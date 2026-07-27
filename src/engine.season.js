/* ============================================================
   SIMULACION DE TEMPORADA
   ============================================================ */

const RELEGATION = { ESP1: 3, ENG1: 3, ITA1: 3, GER1: 2, FRA1: 2, POR1: 2, NED1: 2, BRA1: 4, MEX1: 0 };
const CONT_SLOTS = {
  BRA1: 5, ARG1: 5, COL1: 3, CHI1: 3, ECU1: 3, PAR1: 3, URU1: 3, PER1: 3,
  MEX1: 5, USA1: 4, JPN1: 3, KOR1: 3, KSA1: 3, QAT1: 2, UAE1: 2, AUS1: 1,
};

/* ---------- Mundo dinamico (ascensos y descensos) ---------- */
function leagueOfClub(G, club) { return (G.world && G.world[club.id]) || club.league; }
function leagueMembers(G, lk) { return CLUBS.filter((c) => leagueOfClub(G, c) === lk); }

/* ---------- Clasificacion simulada de una liga ---------- */
function simulateTable(G, lk, playerBoost) {
  const members = leagueMembers(G, lk);
  if (!members.length) return [];
  const avg = members.reduce((s, c) => s + c.str, 0) / members.length;
  const games = (members.length - 1) * 2;
  const rows = members.map((c) => {
    let pts = games * 1.38 + (c.str - avg) * (games / 17) + gauss(0, games * 0.19, -games, games);
    if (playerBoost && c.id === playerBoost.clubId) pts += playerBoost.pts;
    pts = clamp(Math.round(pts), 8, games * 2.6);
    return { club: c, pts };
  });
  rows.sort((a, b) => b.pts - a.pts || b.club.str - a.club.str);
  rows.forEach((r, i) => { r.pos = i + 1; });
  return rows;
}

/* ---------- Contribucion del jugador a su equipo ---------- */
function playerImpactPoints(p, club, stats) {
  const gap = p.ovr - club.str;
  const base = clamp(gap * 0.32, -3, 5);
  const prod = ((stats.goals || 0) + (stats.assists || 0) * 0.7) * 0.16;
  return clamp(base + prod * (stats.mins > 900 ? 1 : 0.4), -4, 9);
}

/* ---------- Partidos disponibles ---------- */
function seasonFixtures(G, club, euroTier) {
  const lk = leagueOfClub(G, club);
  const lg = LEAGUES[lk];
  const members = leagueMembers(G, lk).length || 18;
  const league = (members - 1) * 2;
  const cupRun = 1 + poisson(1.4 + club.prestige / 55);
  const cup = clamp(cupRun, 1, 7);
  let cont = 0;
  if (euroTier === 'ucl') cont = 8 + poisson(2.4);
  else if (euroTier === 'uel') cont = 8 + poisson(1.8);
  else if (euroTier === 'uecl') cont = 6 + poisson(1.6);
  else if (euroTier === 'cont') cont = 6 + poisson(2.2);
  return { league, cup, cont: Math.min(cont, 17), total: league + cup + Math.min(cont, 17), lg, lk };
}

/* ---------- Lesiones ---------- */
const INJURIES = [
  { n: 'Sobrecarga muscular', w: [1, 2], sev: 1 },
  { n: 'Esguince de tobillo', w: [2, 5], sev: 1 },
  { n: 'Rotura de fibras', w: [3, 7], sev: 2 },
  { n: 'Lesión en el isquiotibial', w: [3, 8], sev: 2 },
  { n: 'Fractura del quinto metatarsiano', w: [8, 14], sev: 3 },
  { n: 'Lesión de menisco', w: [8, 16], sev: 3 },
  { n: 'Pubalgia crónica', w: [6, 12], sev: 3 },
  { n: 'Rotura del ligamento cruzado', w: [26, 40], sev: 4 },
  { n: 'Rotura del tendón de Aquiles', w: [24, 38], sev: 4 },
];
function rollInjuries(p, mods) {
  const out = [];
  let risk = 0.30 * p.proneness * (mods.injuryRisk || 1);
  if (p.traits.includes('ironman')) risk *= 0.5;
  if (p.traits.includes('glass')) risk *= 1.75;
  if (p.age >= 31) risk *= 1 + (p.age - 30) * 0.12;
  if (p.age <= 18) risk *= 0.85;
  risk *= 1 + (70 - clamp(p.fitness, 20, 100)) / 130;
  let tries = 3;
  while (tries-- > 0 && chance(risk)) {
    const sevRoll = rnd();
    const pool = sevRoll < 0.55 ? INJURIES.slice(0, 2)
      : sevRoll < 0.85 ? INJURIES.slice(2, 4)
      : sevRoll < 0.975 ? INJURIES.slice(4, 7) : INJURIES.slice(7);
    const inj = pick(pool);
    out.push({ name: inj.n, weeks: ri(inj.w[0], inj.w[1]), sev: inj.sev });
    risk *= 0.45;
  }
  return out;
}

/* ---------- Nucleo: simular la temporada del jugador ---------- */
function simulateSeason(G) {
  const p = G.player;
  const club = G.club;
  const mods = G.mods;
  const lk = leagueOfClub(G, club);
  const lg = LEAGUES[lk];
  const rep = { feed: [], titles: [], stats: null };

  /* --- lesiones --- */
  const injuries = rollInjuries(p, mods);
  const weeksOut = injuries.reduce((s, i) => s + i.weeks, 0);
  G.lastInjurySev = injuries.reduce((m, i) => Math.max(m, i.sev), 0);
  p.career.injuries += injuries.length;
  const seasonWeeks = 40;
  const availFrac = clamp(1 - weeksOut / seasonWeeks, 0.03, 1);

  /* --- partidos --- */
  const euroKey = club.academy ? club.parent : club.id;
  const euroTier = G.euro && G.euro[euroKey] ? G.euro[euroKey] : null;
  const fx = seasonFixtures(G, club, euroTier);

  /* --- minutos --- */
  const role = squadRole(p, club);
  let share = role.min;
  share *= 1 + (p.form / 260) + ((p.morale - 60) / 500) + ((p.trust - 55) / 320);
  share *= (mods.mins || 1);
  if (p.traits.includes('engine')) share *= 1.06;
  if (p.age >= 34) share *= 1 - (p.age - 33) * 0.06;
  if (club.academy) share = clamp(share + 0.25, 0, 0.95);
  share = clamp(share, 0.02, 0.97);

  const availableMatches = Math.round(fx.total * availFrac);
  let apps = Math.round(availableMatches * clamp(share * 1.04, 0, 0.98));
  apps = clamp(apps, 0, availableMatches);
  const minsPerApp = clamp(28 + share * 60 + rf(-4, 4), 15, 90);
  const mins = Math.round(apps * minsPerApp);
  const nineties = mins / 90;

  /* --- produccion --- */
  const posDef = POS_BY_KEY[p.pos];
  const ovrScale = Math.pow(clamp(p.ovr, 40, 99) / 75, 2.6);
  const teamAtk = Math.pow(clamp(club.str, 40, 95) / 72, 1.15);
  const leagueAdj = Math.pow(78 / clamp(lg ? lg.rep : 70, 45, 100), 0.34);
  let gMul = 1, aMul = 1;
  if (p.traits.includes('freekick')) gMul *= 1.15;
  if (p.traits.includes('poacher')) { gMul *= 1.18; aMul *= 0.9; }
  if (p.traits.includes('wizard')) aMul *= 1.2;
  gMul *= (mods.goals || 1); aMul *= (mods.assists || 1);

  const stats = { apps, mins, goals: 0, assists: 0, motm: 0, yellow: 0, red: 0, cs: 0, saves: 0, conceded: 0, rating: 0 };

  if (p.pos === 'GK') {
    const defQ = Math.pow(clamp(club.str, 40, 95) / 72, 1.5) * Math.pow(p.ovr / 75, 0.55);
    let concPer90 = clamp(1.42 / defQ * leagueAdj, 0.28, 3.2);
    if (p.traits.includes('wall')) concPer90 *= 0.9;
    stats.conceded = poisson(concPer90 * nineties);
    stats.saves = poisson(clamp(2.4 + (1.6 - concPer90) * -1.1 + rf(-.3, .5), 1.2, 5.4) * nineties);
    // porterias a cero: aproximacion de Poisson(0) por partido
    const csP = Math.exp(-concPer90 * (minsPerApp / 90));
    stats.cs = 0;
    for (let i = 0; i < apps; i++) if (chance(csP)) stats.cs++;
    stats.assists = poisson(0.02 * nineties * (p.traits.includes('sweeper') ? 3 : 1));
    stats.goals = chance(0.012 * nineties) ? 1 : 0;
  } else {
    stats.goals = poisson(posDef.g * ovrScale * teamAtk * leagueAdj * gMul * nineties) + (mods.extraGoals || 0);
    stats.assists = poisson(posDef.a * ovrScale * Math.pow(teamAtk, 0.7) * leagueAdj * aMul * nineties);
  }
  stats.goals = Math.max(0, stats.goals);
  const cardBase = (p.pos === 'CB' || p.pos === 'DM' ? 0.22 : p.pos === 'GK' ? 0.04 : 0.13);
  stats.yellow = poisson(cardBase * nineties * (p.traits.includes('hothead') ? 1.9 : 1));
  stats.red = chance(clamp(nineties * 0.006 * (p.traits.includes('hothead') ? 3 : 1), 0, 0.5)) ? 1 : 0;

  /* --- nota media --- */
  let rating = 6.35 + (p.ovr - club.str) * 0.028 + (mods.rating || 0);
  if (p.pos === 'GK') rating += (stats.cs / Math.max(1, apps)) * 1.5 - (stats.conceded / Math.max(1, nineties)) * 0.28;
  else rating += ((stats.goals + stats.assists * 0.75) / Math.max(1, nineties)) * 1.15;
  rating += gauss(0, 0.16, -0.5, 0.5) + p.form / 400;
  rating = clamp(rating, 5.1, 9.4);
  stats.rating = Math.round(rating * 100) / 100;
  stats.motm = poisson(clamp((rating - 6.5), 0, 3) * apps * 0.075);

  /* --- clasificacion y titulos --- */
  const boost = { clubId: club.academy ? club.parent : club.id, pts: playerImpactPoints(p, club, stats) };
  const table = simulateTable(G, lk, club.academy ? null : boost);
  const myRow = table.find((r) => r.club.id === (club.academy ? club.parent : club.id));
  const pos = myRow ? myRow.pos : Math.ceil(table.length / 2);
  rep.table = table; rep.leaguePos = pos;

  const played = mins > 400; // hay que haber jugado para "ganar" un titulo de verdad
  const titles = [];
  if (lg) {
    if (pos === 1) titles.push({ name: lg.tier === 1 ? lg.name : lg.name + ' (ascenso)', icon: '🏆', tier: lg.tier === 1 ? 3 : 2 });
    else if (lg.tier === 2 && pos === 2) titles.push({ name: 'Ascenso directo a ' + (LEAGUES[lg.up] ? LEAGUES[lg.up].name : 'Primera'), icon: '⬆️', tier: 2 });
    else if (lg.tier === 2 && pos >= 3 && pos <= 6 && chance(0.28)) titles.push({ name: 'Ascenso por playoff', icon: '⬆️', tier: 2 });
  }
  // Copa nacional (el filial no la juega)
  if (lg && lg.cup && !club.academy) {
    const pool = CLUBS.filter((c) => c.country === lg.country && LEAGUES[leagueOfClub(G, c)]);
    const cupWinner = pickW(pool, (c) => Math.pow(Math.max(1, c.str - 42), 3.1) * (1 + c.prestige / 160));
    const me = club.academy ? getClub(club.parent) : club;
    if (cupWinner && cupWinner.id === me.id) titles.push({ name: lg.cup, icon: '🥇', tier: 2 });
    else rep.cupRound = roundPhrase(rnd() * (1.05 - clamp(me.str - 55, 0, 35) / 55), false);
  }
  // Supercopa
  if (lg && lg.supercup && chance(0.16 + clamp((club.prestige - 70) / 130, 0, 0.3))) {
    if (club.prestige > 70 && chance(0.5)) titles.push({ name: lg.supercup, icon: '🛡️', tier: 1 });
  }
  // Continental (el filial no la juega)
  if (euroTier && !club.academy) {
    const contName = contCompName(club.confed, euroTier);
    const poolIds = (G.euroPool && G.euroPool[euroTier]) || [];
    const pool = poolIds.map(getClub).filter(Boolean);
    const me = club.academy ? getClub(club.parent) : club;
    if (pool.length) {
      const winner = pickW(pool, (c) => Math.pow(Math.max(1, c.str - 55), 3.4) * (1 + c.prestige / 130));
      if (winner && winner.id === me.id) titles.push({ name: contName, icon: euroTier === 'ucl' ? '🏆' : '🏅', tier: euroTier === 'ucl' ? 4 : 2 });
      else {
        const rank = pool.filter((c) => c.str > me.str).length / Math.max(1, pool.length);
        rep.contRound = roundPhrase(clamp(rank + rf(-0.18, 0.3), 0.03, 1), true);
        rep.contName = contName;
      }
    }
  }
  // en la cantera no ganas los titulos del primer equipo
  if (!played || club.academy) titles.length = 0;
  if (club.academy) {
    rep.youthNote = pos <= 3
      ? `El primer equipo del ${getClub(club.parent).name} pelea arriba, pero tú todavía lo ves desde el filial.`
      : `Otro año de formación en la cantera del ${getClub(club.parent).name}.`;
  }
  rep.titles = titles;

  /* --- desarrollo --- */
  const dev = developPlayer(G, stats, { pos, titles, mins, apps });
  rep.dev = dev;

  /* --- descenso / ascenso del club --- */
  rep.relegated = false; rep.promoted = false;
  if (lg && lg.tier === 1 && lg.down) {
    const nRel = RELEGATION[lk] != null ? RELEGATION[lk] : 3;
    if (nRel > 0 && pos > table.length - nRel) rep.relegated = true;
  }
  if (lg && lg.tier === 2 && titles.some((t) => /[Aa]scenso/.test(t.name) || t.name === lg.name)) rep.promoted = true;

  rep.stats = stats;
  rep.injuries = injuries;
  rep.club = club; rep.league = lg; rep.euroTier = euroTier;
  rep.fixtures = fx;
  rep.role = role;
  return rep;
}

function contCompName(confed, tier) {
  const c = CONTINENTAL[confed] || CONTINENTAL.UEFA;
  if (tier === 'ucl' || tier === 'cont') return c.elite;
  if (tier === 'uel') return c.second || c.elite;
  return c.third || c.second || c.elite;
}

/* ---------- Evolucion del jugador ---------- */
const AGE_GROWTH = { 16: 1.00, 17: 1.00, 18: 0.96, 19: 0.90, 20: 0.84, 21: 0.78, 22: 0.70, 23: 0.61, 24: 0.52, 25: 0.43, 26: 0.34, 27: 0.25, 28: 0.17, 29: 0.11, 30: 0.06 };

function developPlayer(G, stats, ctx) {
  const p = G.player;
  const mods = G.mods;
  const before = p.ovr;

  const minutesF = clamp(0.28 + (stats.mins / 2100) * 0.9, 0.28, 1.28);
  let ageF = AGE_GROWTH[p.age] != null ? AGE_GROWTH[p.age] : 0;
  if (p.traits.includes('wonderkid') && p.age <= 22) ageF *= 1.25;
  if (p.traits.includes('latebloomer') && p.age >= 25) ageF = Math.max(ageF, 0.36 - (p.age - 25) * 0.04);

  const gap = Math.max(0, p.pot - p.ovr);
  let growth = ageF * gap * 0.225 * minutesF * (mods.growth || 1) * rf(0.72, 1.3);

  // rendimiento por encima de lo esperado acelera; jugar mal frena
  const perf = (stats.rating - 6.6) * 1.3;
  growth += clamp(perf, -1.2, 1.6) * (p.age <= 26 ? 0.55 : 0.3);
  // entrenar en un club grande ayuda
  growth *= 0.9 + clamp((G.club.str - 60) / 130, -0.1, 0.32);

  // declive
  let decline = 0;
  const declineAge = 29 + (p.pos === 'GK' ? 4 : p.pos === 'CB' || p.pos === 'DM' ? 2 : 0) + (p.traits.includes('professor') ? 2 : 0);
  if (p.age > declineAge) {
    decline = (p.age - declineAge) * 0.92 + rf(0, 1.2);
    if (stats.mins > 1800) decline *= 0.8;
    if (p.attrs.phy != null) decline *= 1 + (60 - clamp(p.attrs.phy, 30, 99)) / 200;
  }
  // lesiones graves pasan factura
  const badInj = (G.lastInjurySev || 0);
  if (badInj >= 3) decline += badInj === 4 ? rf(1.2, 3.4) : rf(0.4, 1.4);

  let delta = clamp(growth - decline, -7, 7.5);
  if (p.age <= 20) delta = Math.max(delta, -1.5);

  // repartir en atributos
  const list = attrsFor(p.pos);
  const w = WEIGHTS[p.pos];
  const totalPts = delta * 6.2;
  let assigned = 0;
  const order = shuffle(list.slice());
  order.forEach((a) => {
    const share = (w[a.key] || 0.05) + rf(-0.03, 0.05);
    let v = totalPts * share;
    assigned += v;
    p.attrs[a.key] = clamp(Math.round((p.attrs[a.key] + v) * 10) / 10, 22, 99);
  });
  p.ovr = computeOvr(p);
  // asegurar coherencia con el delta calculado
  const drift = (before + delta) - p.ovr;
  if (Math.abs(drift) >= 1) {
    const k = pickW(list, (a) => (w[a.key] || 0.05));
    p.attrs[k.key] = clamp(p.attrs[k.key] + drift, 22, 99);
    p.ovr = computeOvr(p);
  }

  // puntos de entrenamiento para gastar a mano
  let sp = 2;
  if (p.age <= 21) sp += 2;
  else if (p.age <= 26) sp += 1;
  if (stats.mins > 2300) sp += 1;
  if (stats.rating >= 7.3) sp += 1;
  if (ctx.titles.length) sp += 1;
  if (p.age >= 31) sp = Math.max(1, sp - 2);   // a partir de cierta edad ya no se aprende igual
  p.sp += sp;

  return { before, after: p.ovr, delta: p.ovr - before, sp, growthRaw: growth, decline };
}

/* ---------- Actualizar el mundo tras la temporada ----------
   `cache` permite reutilizar la clasificacion que ya ha visto el jugador,
   para que lo que pasa en su liga sea coherente con su resumen de temporada. */
function advanceWorld(G, cache) {
  cache = cache || {};
  const tableFor = (lk) => (cache[lk] && cache[lk].length ? cache[lk] : simulateTable(G, lk));
  const done = {};
  for (const lk in LEAGUES) {
    const lg = LEAGUES[lk];
    if (lg.tier !== 1 || !lg.down || done[lk]) continue;
    const nRel = RELEGATION[lk] != null ? RELEGATION[lk] : 3;
    if (!nRel) continue;
    const t1 = tableFor(lk), t2 = tableFor(lg.down);
    if (!t1.length || !t2.length) continue;
    const down = t1.slice(-nRel).map((r) => r.club);
    const up = t2.slice(0, nRel).map((r) => r.club);
    down.forEach((c) => { G.world[c.id] = lg.down; });
    up.forEach((c) => { G.world[c.id] = lk; });
    done[lk] = done[lg.down] = true;
  }
  computeEuroSpots(G, cache);
}

/* ---------- Plazas continentales ---------- */
function computeEuroSpots(G, cache) {
  cache = cache || {};
  G.euro = {}; G.euroPool = { ucl: [], uel: [], uecl: [], cont: [] };
  for (const lk in LEAGUES) {
    const lg = LEAGUES[lk];
    if (lg.tier !== 1) continue;
    const country = COUNTRY_BY_CODE[lg.country];
    const confed = country ? country.confed : 'UEFA';
    const table = (cache[lk] && cache[lk].length) ? cache[lk] : simulateTable(G, lk);
    if (!table.length) continue;
    if (confed === 'UEFA') {
      let i = 0;
      for (let n = 0; n < lg.ucl && i < table.length; n++, i++) { G.euro[table[i].club.id] = 'ucl'; G.euroPool.ucl.push(table[i].club.id); }
      for (let n = 0; n < lg.uel && i < table.length; n++, i++) { G.euro[table[i].club.id] = 'uel'; G.euroPool.uel.push(table[i].club.id); }
      for (let n = 0; n < lg.uecl && i < table.length; n++, i++) { G.euro[table[i].club.id] = 'uecl'; G.euroPool.uecl.push(table[i].club.id); }
    } else {
      const slots = CONT_SLOTS[lk] || 0;
      for (let i = 0; i < slots && i < table.length; i++) { G.euro[table[i].club.id] = 'cont'; G.euroPool.cont.push(table[i].club.id); }
    }
  }
}

/* ---------- Objetivos de temporada ---------- */
function makeObjectives(G) {
  const p = G.player, club = G.club, lg = LEAGUES[leagueOfClub(G, club)];
  const role = squadRole(p, club);
  const objs = [];
  const expMins = Math.round(role.min * 34 * 78);
  objs.push({ id: 'mins', text: `Jugar más de ${Math.round(expMins / 90)} partidos completos`, target: expMins, kind: 'mins', reward: 1 });
  if (p.pos === 'GK') {
    objs.push({ id: 'cs', text: `Dejar la portería a cero ${Math.max(4, Math.round(role.min * 12))} veces`, target: Math.max(4, Math.round(role.min * 12)), kind: 'cs', reward: 2 });
  } else if (['ST', 'LW', 'RW', 'AM'].includes(p.pos)) {
    const t = Math.max(3, Math.round(POS_BY_KEY[p.pos].g * (expMins / 90) * Math.pow(p.ovr / 75, 2.2)));
    objs.push({ id: 'goals', text: `Marcar ${t} goles`, target: t, kind: 'goals', reward: 2 });
  } else {
    const t = Math.max(2, Math.round(POS_BY_KEY[p.pos].a * (expMins / 90) * Math.pow(p.ovr / 75, 2)) + 1);
    objs.push({ id: 'assists', text: `Repartir ${t} asistencias`, target: t, kind: 'assists', reward: 2 });
  }
  if (lg && lg.tier === 1 && club.str > 76) objs.push({ id: 'pos', text: 'Clasificar al equipo para Europa', target: 6, kind: 'pos', reward: 2 });
  else if (lg && lg.tier === 2) objs.push({ id: 'pos', text: 'Pelear el ascenso (top 6)', target: 6, kind: 'pos', reward: 2 });
  else objs.push({ id: 'rating', text: 'Terminar con una nota media de 7.0', target: 7.0, kind: 'rating', reward: 2 });
  return objs;
}
function checkObjectives(G, rep) {
  const s = rep.stats;
  return (G.objectives || []).map((o) => {
    let val;
    if (o.kind === 'mins') val = s.mins;
    else if (o.kind === 'pos') val = rep.leaguePos;
    else if (o.kind === 'rating') val = s.rating;
    else val = s[o.kind] || 0;
    const ok = o.kind === 'pos' ? val <= o.target : val >= o.target;
    return { ...o, val, ok };
  });
}
