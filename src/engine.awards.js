/* ============================================================
   PREMIOS INDIVIDUALES Y SELECCION NACIONAL
   ============================================================ */

const TITLE_POINTS = {
  'UEFA Champions League': 32, 'Copa Libertadores': 22, 'Concacaf Champions Cup': 10,
  'AFC Champions League Elite': 10, 'UEFA Europa League': 12, 'Copa Sudamericana': 8,
  'UEFA Conference League': 6, 'Mundial': 42, 'Eurocopa': 26, 'Copa América': 24,
  'Copa Africana de Naciones': 14, 'Copa Oro': 8, 'Copa Asiática': 8,
};
function titlePoints(name, leagueName) {
  if (TITLE_POINTS[name]) return TITLE_POINTS[name];
  if (name === leagueName) return 14;
  if (/[Aa]scenso/.test(name)) return 3;
  if (/Copa|Cup|Pokal/.test(name)) return 6;
  if (/Supercopa|Shield|Campeones/.test(name)) return 3;
  return 4;
}

/* ---------- Premios de la temporada ---------- */
function computeAwards(G, rep) {
  const p = G.player;
  const s = rep.stats;
  const lg = rep.league;
  const club = rep.club;
  const out = [];
  if (s.mins < 700 || club.academy) return out;

  const lw = clamp((lg ? lg.rep : 65) / 88, 0.5, 1.15);        // peso de la liga
  const ga = s.goals + s.assists * 0.75;

  /* Máximo goleador de la liga */
  if (p.pos !== 'GK') {
    const need = Math.round(gauss(9 + lw * 14, 2.6, 8, 34));
    if (s.goals >= need && s.goals >= 12) {
      out.push({ name: 'Máximo goleador de ' + (lg ? lg.name : 'la liga'), icon: '👟', kind: 'boot', pts: 8 });
    }
    const needA = Math.round(gauss(8 + lw * 5, 2, 6, 20));
    if (s.assists >= needA && s.assists >= 9) {
      out.push({ name: 'Máximo asistente de ' + (lg ? lg.name : 'la liga'), icon: '🎩', kind: 'assist', pts: 6 });
    }
  }

  /* Portero menos goleado */
  if (p.pos === 'GK' && s.cs >= Math.round(gauss(13, 2.4, 9, 22)) && s.apps >= 25) {
    out.push({ name: 'Zamora / portero menos goleado', icon: '🧤', kind: 'gk', pts: 7 });
  }

  /* MVP de la liga */
  const mvpScore = (p.ovr - 76) * 3 + ga * 1.4 * lw + (rep.leaguePos <= 2 ? 16 : rep.leaguePos <= 5 ? 7 : 0) + (s.rating - 7) * 26;
  if (mvpScore >= gauss(62, 9, 42, 92) && p.ovr >= 82) {
    out.push({ name: 'MVP de ' + (lg ? lg.name : 'la liga'), icon: '⭐', kind: 'mvp', pts: 11 });
  }

  /* Once ideal */
  if (mvpScore >= gauss(40, 8, 24, 64) && p.ovr >= 78) {
    out.push({ name: 'Once ideal de ' + (lg ? lg.name : 'la liga'), icon: '🧩', kind: 'toty', pts: 5 });
  }

  /* Mejor joven */
  if (p.age <= 21 && mvpScore >= gauss(20, 6, 10, 40)) {
    out.push({ name: 'Mejor jugador joven de ' + (lg ? lg.name : 'la liga'), icon: '🌟', kind: 'young', pts: 5 });
  }
  if (p.age <= 21 && p.ovr >= 82 && mvpScore >= gauss(42, 8, 26, 70)) {
    out.push({ name: 'Golden Boy', icon: '🏅', kind: 'goldenboy', pts: 12 });
  }

  /* Puskás */
  if (s.goals >= 8 && chance(0.05 + Math.min(0.09, s.goals / 400))) {
    out.push({ name: 'Premio Puskás al mejor gol', icon: '🎬', kind: 'puskas', pts: 5 });
  }

  /* Balón de Oro */
  let ballon = 0;
  ballon += (p.ovr - 84) * 3;
  ballon += ga * 1.25 * lw;
  ballon += (s.rating - 7) * 20;
  (rep.titles || []).forEach((t) => { ballon += titlePoints(t.name, lg ? lg.name : '') * 0.95; });
  (rep.ntTitles || []).forEach((t) => { ballon += titlePoints(t.name, '') * 1.0; });
  ballon += clamp((club.prestige - 78) * 0.35, 0, 8);
  ballon += clamp((p.rep - 60) * 0.2, 0, 10);
  if (p.pos === 'GK') ballon *= 0.55;
  if (p.pos === 'CB' || p.pos === 'DM' || p.pos === 'LB' || p.pos === 'RB') ballon *= 0.78;
  rep.ballonScore = Math.round(ballon);

  const threshold = gauss(134, 11, 105, 165);
  if (p.ovr >= 88 && ballon >= threshold) {
    out.push({ name: 'BALÓN DE ORO', icon: '🥇', kind: 'ballon', pts: 40 });
  } else if (p.ovr >= 85 && ballon >= threshold - 26) {
    out.push({ name: 'Podio del Balón de Oro (' + (ballon >= threshold - 12 ? '2º' : '3º') + ')', icon: '🥈', kind: 'ballon3', pts: 14 });
  } else if (p.ovr >= 82 && ballon >= threshold - 52) {
    out.push({ name: 'Nominado al Balón de Oro', icon: '📜', kind: 'ballonNom', pts: 5 });
  }

  return out;
}

/* ---------- Seleccion nacional ---------- */
const NT_THRESHOLD = { 1: 83.5, 2: 78.5, 3: 74, 4: 70, 5: 66, 6: 61 };

function ntEvaluate(G, rep) {
  const p = G.player;
  const country = COUNTRY_BY_CODE[p.country];
  const lg = rep.league;
  const s = rep.stats;
  const res = { called: false, level: null, caps: 0, goals: 0, tournaments: [], titles: [], feed: [] };

  // La media manda. Todo lo demas son ajustes pequenios: el tope del bono es +6.
  let bonus = 0;
  bonus += clamp(((lg ? lg.rep : 60) - 74) * 0.09, -3, 2);
  bonus += clamp((s.rating - 6.8) * 4, -5, 4);
  bonus += Math.min(3, s.goals * (p.pos === 'GK' ? 0 : 0.14) + s.assists * 0.1);
  bonus += clamp((p.rep - 50) * 0.03, -1.5, 2);
  if (p.nt.streak > 0) bonus += 1.5;                          // ya eres del grupo
  if (p.traits.includes('leader')) bonus += 0.5;
  if (s.mins < 800) bonus -= 8;
  if (p.age >= 33) bonus -= (p.age - 32) * 2.4;
  const score = p.ovr + clamp(bonus, -16, 6);

  const th = NT_THRESHOLD[country.tier];

  /* categorias inferiores */
  if (p.age <= 21) {
    const youthTh = th - (p.age <= 17 ? 16 : p.age <= 19 ? 12 : 8);
    if (score >= youthTh) {
      const lvl = p.age <= 17 ? 'Sub-17' : p.age <= 19 ? 'Sub-19' : 'Sub-21';
      res.called = true; res.level = lvl;
      res.caps = ri(3, 9);
      res.goals = p.pos === 'GK' ? 0 : poisson(POS_BY_KEY[p.pos].g * res.caps * 0.85);
      res.feed.push({ icon: '🌱', cls: 'info', text: `Convocado con la selección ${country.flag} ${lvl}. ${res.caps} partidos, ${res.goals} goles.` });
    }
  }

  /* absoluta */
  if (score >= th && p.age >= 17) {
    res.called = true; res.level = 'Absoluta';
    p.nt.streak++;
    res.caps = ri(5, 13);
    res.goals = p.pos === 'GK' ? 0 : poisson(POS_BY_KEY[p.pos].g * res.caps * 0.75);
    if (p.nt.caps === 0) res.feed.push({ icon: '🎽', cls: 'gold', text: `¡DEBUT ABSOLUTO con ${country.flag} ${country.name}! Un día que no se olvida.` });
    res.feed.push({ icon: '🌐', cls: 'info', text: `${res.caps} internacionalidades esta temporada con ${country.flag} ${country.name}${res.goals ? ` y ${res.goals} gol${res.goals > 1 ? 'es' : ''}` : ''}.` });
  } else if (p.nt.streak > 0 && res.level !== 'Absoluta') {
    p.nt.streak = 0;
    if (p.nt.caps > 0) res.feed.push({ icon: '📉', cls: 'bad', text: `Te quedas fuera de la lista de ${country.flag} ${country.name}.` });
  }

  /* torneos del verano */
  const year = G.seasonStart + 1;
  if (res.level === 'Absoluta') {
    tournamentsInYear(year, country.confed).forEach((t) => {
      const r = simulateNTTournament(G, t, country, p);
      res.tournaments.push(r);
      if (r.won) res.titles.push({ name: t.name, icon: t.emoji, tier: t.prestige >= 88 ? 4 : 3, nt: true });
      res.feed.push({
        icon: t.emoji, cls: r.won ? 'gold' : r.stage === 'subcampeón' ? 'info' : 'info',
        text: `${t.name}: ${country.flag} ${country.name} ${stagePhrase(r.stage)}. ${r.caps} partidos, ${r.goals} goles${r.motm ? `, ${r.motm} MVP` : ''}.`,
      });
    });
  } else if (p.age <= 23 && res.called) {
    youthTournamentsInYear(year, country.confed).filter((t) => p.age <= t.maxAge).forEach((t) => {
      if (!chance(0.6)) return;
      const won = chance(0.10 + (6 - country.tier) * 0.02);
      res.feed.push({ icon: t.emoji, cls: won ? 'gold' : 'info', text: `${t.name}: ${won ? '¡CAMPEÓN!' : roundPhrase(rnd(), true)}.` });
      if (won) res.titles.push({ name: t.name, icon: t.emoji, tier: 2, nt: true });
    });
  }

  return res;
}

const CONFED_FLOOR = { UEFA: 1, CONMEBOL: 1, CONCACAF: 2, CAF: 2, AFC: 2, OFC: 5 };
function simulateNTTournament(G, t, country, p) {
  const isWorld = t.confed === '*';
  const tierRel = isWorld ? country.tier : clamp(country.tier - (CONFED_FLOOR[country.confed] || 1) + 1, 1, 6);
  const baseWin = isWorld
    ? [0.075, 0.022, 0.008, 0.003, 0.0010, 0.0003][tierRel - 1]
    : [0.21, 0.12, 0.058, 0.024, 0.009, 0.003][tierRel - 1];
  // un crack arrastra a su seleccion, pero no la gana el solo
  const boost = 1 + clamp((p.ovr - 84) * 0.035, 0, 0.5) + (p.traits.includes('clutch') ? 0.1 : 0);
  const win = clamp(baseWin * boost, 0.0004, 0.6);
  const roll = rnd();
  let stage;
  if (roll < win) stage = 'campeón';
  else if (roll < win * 2.1) stage = 'subcampeón';
  else if (roll < win * 4.2) stage = 'semifinalista';
  else if (roll < win * 8) stage = 'cuartofinalista';
  else if (roll < win * 15 + 0.12) stage = 'eliminado en octavos';
  else stage = 'eliminado en la fase de grupos';
  const caps = stage === 'campeón' || stage === 'subcampeón' ? ri(6, 7)
    : stage.includes('semi') ? ri(5, 6) : stage.includes('cuartos') ? ri(4, 5)
      : stage.includes('octavos') ? ri(3, 4) : ri(2, 3);
  const goals = p.pos === 'GK' ? 0 : poisson(POS_BY_KEY[p.pos].g * caps * Math.pow(p.ovr / 78, 2));
  const motm = poisson(clamp((p.ovr - 80) / 22, 0, 1) * caps * 0.25);
  return { stage, won: stage === 'campeón', caps, goals, motm, name: t.name, prestige: t.prestige };
}

/* ---------- Reputacion ---------- */
function updateReputation(G, rep, awards, nt) {
  const p = G.player;
  const s = rep.stats;
  let d = 0;
  d += clamp((s.rating - 6.6) * 6, -6, 9);
  d += Math.min(10, (s.goals + s.assists * 0.6) * 0.35);
  d += (rep.titles || []).reduce((a, t) => a + titlePoints(t.name, rep.league ? rep.league.name : '') * 0.22, 0);
  d += awards.reduce((a, x) => a + x.pts * 0.55, 0);
  d += (nt.level === 'Absoluta' ? 3 : nt.level ? 1 : 0);
  d += clamp((p.ovr - 74) * 0.35, -3, 6);
  d += clamp(((rep.league ? rep.league.rep : 60) - 72) * 0.05, -2, 2);
  if (s.mins < 500) d -= 6;
  if (p.traits.includes('mediastar')) d *= 1.2;
  // la fama se evapora: cuanto mas lejos estas de tu mejor version, mas rapido te olvidan
  const fade = 1.2 + Math.max(0, (p.peakOvr || p.ovr) - p.ovr) * 0.55 + Math.max(0, p.age - 31) * 0.6;
  p.rep = clamp(p.rep + d * 0.62 - fade, 1, 100);
}

/* ---------- Legado y retirada ---------- */
function computeLegacy(G) {
  const p = G.player, c = p.career;
  let L = 0;
  L += c.apps * 0.28;
  L += c.goals * 1.5 + c.assists * 1.0;
  L += (c.cs || 0) * 1.1 + (c.saves || 0) * 0.05;
  L += c.ntApps * 1.4 + c.ntGoals * 2.4;
  p.trophies.forEach((t) => { L += titlePoints(t.name, '') * 2.6; });
  p.awards.forEach((a) => { L += a.pts * 3.4; });
  L += Math.max(0, p.peakOvr - 70) * 9;
  L += c.motm * 1.2;
  return Math.round(L);
}
function legacyRank(L) {
  if (L >= 3400) return { t: 'INMORTAL', d: 'Tu nombre está en la conversación del mejor de la historia.', icon: '👑', color: 'gold' };
  if (L >= 2400) return { t: 'LEYENDA MUNDIAL', d: 'Generaciones enteras crecerán viendo tus vídeos.', icon: '🏆', color: 'gold' };
  if (L >= 1600) return { t: 'ICONO', d: 'Un grande de tu época. Tu camiseta se sigue vendiendo.', icon: '⭐', color: 'purple' };
  if (L >= 1000) return { t: 'LEYENDA DE CLUB', d: 'En tu casa tienen tu nombre en una grada.', icon: '💚', color: 'acc' };
  if (L >= 600) return { t: 'PROFESIONAL DE ÉLITE', d: 'Una carrera larga y respetada en la primera línea.', icon: '🎽', color: 'blue' };
  if (L >= 300) return { t: 'HONRADO PROFESIONAL', d: 'Viviste del fútbol. No todo el mundo puede decirlo.', icon: '⚽', color: '' };
  return { t: 'UNO MÁS', d: 'El fútbol es cruel. Lo intentaste.', icon: '🌧️', color: 'dim' };
}
