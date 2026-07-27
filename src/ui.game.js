/* ============================================================
   FLUJO DE JUEGO: temporada a temporada
   ============================================================ */

function renderStep() {
  const G = window.G;
  if (!G) return screenHome();
  if (G.player.retired) return screenRetired();
  switch (G.step) {
    case 'beat': return screenBeat();
    case 'sim': return screenSimulating();
    case 'report': return screenReport();
    case 'develop': return screenDevelop();
    case 'market': return screenMarket();
    default: return screenBeat();
  }
}

/* ---------- Arranque de temporada ---------- */
function startSeason(G, first) {
  const p = G.player;
  G.mods = freshMods();
  if (p.startClubId && G.club.id === p.startClubId) {
    G.mods.mins *= (p.startMinsMod || 1);
    G.mods.growth *= (p.startDev || 1);
  } else if (first) {
    p.startClubId = G.club.id;
    G.mods.mins *= (p.startMinsMod || 1);
    G.mods.growth *= (p.startDev || 1);
  }
  syncSquad(G);
  G.objectives = makeObjectives(G);
  G.seasonFeed = [];
  G.queue = buildQueue(G, first);
  G.step = 'beat';
  saveGame(G);
  renderStep();
}

function buildQueue(G, first) {
  const p = G.player;
  p.usedEvents = p.usedEvents || {};
  const season = p.career.seasons;
  const q = [{ t: 'preseason' }];

  /* eventos */
  const pool = EVENTS.filter((e) => {
    if (e.when && !e.when(G)) return false;
    const last = p.usedEvents[e.id];
    return last == null || season - last >= 5;
  });
  const nEv = first ? 2 : ri(2, 4);
  const chosen = [];
  for (let i = 0; i < nEv && pool.length; i++) {
    const e = pickW(pool.filter((x) => !chosen.includes(x)), (x) => x.w || 5);
    if (!e) break;
    chosen.push(e);
  }
  chosen.forEach((e) => { p.usedEvents[e.id] = season; });

  /* momentos clave */
  const mpool = MOMENTS.filter((m) => !m.when || m.when(G));
  const nMo = first ? 1 : ri(1, 2);
  const moms = [];
  for (let i = 0; i < nMo && mpool.length; i++) {
    const m = pick(mpool.filter((x) => !moms.includes(x)) || mpool);
    if (m) moms.push(m);
  }
  if (first) { const deb = MOMENTS.find((m) => m.id === 'debut'); if (deb) { moms.length = 0; moms.push(deb); } }

  /* trama larga */
  const beats = [];
  chosen.forEach((e) => beats.push({ t: 'event', id: e.id, ev: e }));
  moms.forEach((m) => beats.push({ t: 'moment', id: m.id, m }));

  const activeArc = Object.keys(p.arcs).find((k) => p.arcs[k] && !p.arcs[k].done);
  if (activeArc && chance(0.75)) beats.push({ t: 'story', arcId: activeArc });
  else if (!activeArc) {
    const cands = STORYLINES.filter((s) => !p.arcs[s.id] && s.start(G));
    if (cands.length && chance(0.62)) {
      const s = pick(cands);
      p.arcs[s.id] = { stage: 0, data: s.init ? s.init(G) : {}, done: false };
      beats.push({ t: 'story', arcId: s.id });
    }
  }
  return q.concat(shuffle(beats));
}

/* ---------- Cabecera de temporada ---------- */
function topbar(G) {
  return `<div class="row between" style="margin-bottom:12px">
    <div class="row" style="gap:9px">
      <div class="brand-logo" style="width:34px;height:34px;border-radius:10px;font-size:18px">⚽</div>
      <div><div class="tiny" style="letter-spacing:.1em">EL CAMINO</div>
      <div class="small b">Temporada ${seasonLabel(G)}</div></div>
    </div>
    <div class="row" style="gap:6px">
      <button class="btn sm ghost" data-act="profile">📋 Perfil</button>
      <button class="btn sm ghost" data-act="menu">⋯</button>
    </div>
  </div>`;
}
ACTIONS.menu = () => {
  modal(`<h3>Menú</h3>
    <div class="col mt">
      <button class="btn wide" data-act="closeModal">Seguir jugando</button>
      <button class="btn ghost wide" data-act="saveNow">💾 Guardar ahora</button>
      <button class="btn danger wide" data-act="abandon">Abandonar carrera</button>
    </div>
    <p class="small dim2 mt">La partida se guarda sola en este navegador al final de cada paso.</p>`);
};
ACTIONS.saveNow = () => { saveGame(window.G); closeModals(); toast('Partida guardada'); };
ACTIONS.abandon = () => { if (confirm('¿Abandonar esta carrera? Se borrará el guardado.')) { clearSave(); closeModals(); window.G = null; screenHome(); } };
function toast(t) {
  const n = document.createElement('div');
  n.textContent = t;
  n.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#16212d;border:1px solid #2e4054;padding:10px 16px;border-radius:11px;z-index:99;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.5)';
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 1800);
}

/* ---------- Beats ---------- */
function screenBeat() {
  const G = window.G;
  if (!G.queue.length) { G.step = 'sim'; return renderStep(); }
  const b = G.queue[0];
  if (b.t === 'preseason') return screenPreseason();
  if (b.t === 'event') return screenEvent(b.ev);
  if (b.t === 'moment') return screenMoment(b.m);
  if (b.t === 'story') return screenStory(b.arcId);
  G.queue.shift(); return renderStep();
}

function screenPreseason() {
  const G = window.G, p = G.player, c = G.club;
  const lg = LEAGUES[leagueOfClub(G, c)];
  const role = squadRole(p, c, competitorGap(G));
  const comp = competitorFor(G);
  const euro = G.euro[c.academy ? c.parent : c.id];
  screen(`${topbar(G)}${hud(G)}
  <div class="card">
    <div class="tiny">Pretemporada</div>
    <h3 style="margin:3px 0 8px">Objetivos del club</h3>
    <div class="col" style="gap:8px">
      ${G.objectives.map((o) => `<div class="sub row between"><span class="small">${esc(o.text)}</span>${chip('+' + o.reward + ' PE', '')}</div>`).join('')}
    </div>
    ${comp ? competitorCard(G, comp) : ''}
    <div class="row wrap mt" style="gap:6px">
      ${chip('Rol: ' + role.name, role.min >= 0.68 ? 'on' : 'warn')}
      ${euro ? chip('🌍 ' + contCompName(c.confed, euro), 'on') : ''}
      ${chip('Contrato: ' + (p.contract >= 99 ? 'de por vida' : p.contract + ' año' + (p.contract > 1 ? 's' : '')), p.contract <= 1 ? 'warn' : '')}
      ${chip('Ficha: ' + fmtWage(p.wage), '')}
    </div>
  </div>
  <div class="card">
    <h3>¿Cómo preparas el año?</h3>
    <div class="col mt">
      ${PRESEASON.map((o, i) => `<button class="opt" data-act="preOpt" data-i="${i}">
        <div class="t">${o.l}</div><div class="d">${o.d}</div>
      </button>`).join('')}
    </div>
  </div>`);
}
function competitorCard(G, comp) {
  const p = G.player;
  const d = p.ovr - comp.ovr;
  const cc = COUNTRY_BY_CODE[comp.country];
  const verdict = d >= 4 ? ['El puesto es tuyo.', 'on']
    : d >= -1 ? ['Estáis muy igualados. Se decide en el campo.', 'warn']
      : d >= -6 ? ['Ahora mismo juega él.', 'warn']
        : ['Te saca mucha diferencia. Vas a mirar desde el banquillo.', 'bad'];
  return `<div class="sub mt">
    <div class="tiny">Tu puesto</div>
    <div class="row between mt-s" style="gap:10px">
      <div class="row" style="gap:9px;min-width:0">
        <div class="ovr" style="width:44px;height:44px;border-radius:13px"><b style="font-size:18px">${comp.ovr}</b></div>
        <div style="min-width:0">
          <div class="b small">${cc ? cc.flag : ''} ${esc(comp.name)}${comp.isNew ? ' <span class="gold">· fichaje</span>' : ''}</div>
          <div class="small dim2">${comp.age} años · ${POS_BY_KEY[comp.pos].name}</div>
        </div>
      </div>
      <div class="ovr ${ovrTier(p.ovr)}" style="width:44px;height:44px;border-radius:13px"><b style="font-size:18px">${p.ovr}</b></div>
    </div>
    <div class="small mt-s ${verdict[1] === 'bad' ? 'red' : verdict[1] === 'warn' ? 'gold' : 'acc'}">${verdict[0]}</div>
  </div>`;
}

const PRESEASON = [
  { l: '🔥 Pretemporada a tope', d: 'Llegas fino como nunca. Riesgo de romperte antes de empezar.', e: { fitness: 12, growth: 1.1, injuryRisk: 1.25, form: 8 } },
  { l: '🧠 Trabajo táctico y vídeo', d: 'Te ganas al entrenador desde julio.', e: { trust: 10, attr: { men: 2 }, rating: 0.05 } },
  { l: '🛡️ Prevención de lesiones', d: 'Menos brillo, más partidos jugados.', e: { injuryRisk: 0.7, fitness: 6, growth: 0.97 } },
  { l: '🏝️ Descansar de verdad', d: 'Llegas fresco de cabeza pero justo de ritmo.', e: { morale: 12, fitness: -4, form: -6, injuryRisk: 0.95 } },
  { l: '📣 Gira comercial con el club', d: 'Muchos aviones, mucha exposición.', e: { rep: 8, money: 0.25, fitness: -8, trust: 3 } },
];
ACTIONS.preOpt = (d) => {
  const G = window.G;
  const note = applyEffects(G, PRESEASON[+d.i].e);
  G.seasonFeed.push({ icon: '🏋️', cls: 'info', text: 'Pretemporada: ' + PRESEASON[+d.i].l.replace(/^\S+\s/, '') + (note ? ' — ' + note : '') });
  G.queue.shift(); saveGame(G); renderStep();
};

function screenEvent(ev) {
  const G = window.G;
  screen(`${topbar(G)}${hud(G, true)}
  <div class="card">
    <div class="tiny">${ev.cat}</div>
    <h3 style="margin:4px 0 10px;font-size:20px">${esc(ev.title)}</h3>
    <p class="dim">${esc(typeof ev.text === 'function' ? ev.text(G) : ev.text)}</p>
    <div class="col mt">
      ${ev.opts.map((o, i) => `<button class="opt" data-act="evOpt" data-i="${i}">
        <div class="t">${esc(o.l)}</div>${o.d ? `<div class="d">${esc(o.d)}</div>` : ''}
      </button>`).join('')}
    </div>
  </div>`);
}
ACTIONS.evOpt = (d) => {
  const G = window.G;
  const b = G.queue[0];
  const o = b.ev.opts[+d.i];
  const note = applyEffects(G, o.e);
  G.seasonFeed.push({ icon: '💬', cls: 'info', text: `<b>${esc(b.ev.title)}</b> — ${esc(o.l)}${note ? '. ' + esc(note) : '.'}` });
  G.queue.shift(); saveGame(G);
  if (note) resultCard(b.ev.title, note, () => renderStep());
  else renderStep();
};

function resultCard(title, text, then) {
  const w = modal(`<div class="tiny">${esc(title)}</div>
    <p style="font-size:16px;margin:8px 0 14px">${esc(text)}</p>
    <button class="btn primary wide" data-act="resultOk">Continuar</button>`, { sticky: true });
  ACTIONS.resultOk = () => { w.remove(); then(); };
}

/* ---------- Momento clave ---------- */
function screenMoment(m) {
  const G = window.G;
  screen(`${topbar(G)}${hud(G, true)}
  <div class="card moment">
    <div class="hdr"><span class="pulse"></span><span class="tiny" style="color:var(--acc)">Momento clave</span></div>
    <h3 style="margin:2px 0 10px;font-size:20px">${esc(m.title)}</h3>
    <p class="dim">${esc(typeof m.text === 'function' ? m.text(G) : m.text)}</p>
    <div class="col mt">
      ${m.opts.map((o, i) => {
        const pr = Math.round(momentChance(G, o) * 100);
        return `<button class="opt" data-act="momOpt" data-i="${i}">
          <div class="row between"><div class="t">${esc(o.l)}</div><div class="b mono ${pr >= 60 ? 'acc' : pr >= 40 ? 'gold' : 'red'}">${pr}%</div></div>
          <div class="meta">${(o.a || []).filter((k) => G.player.attrs[k] != null).map((k) => chip(attrName(k) + ' ' + Math.round(G.player.attrs[k]), '')).join('')}</div>
        </button>`;
      }).join('')}
    </div>
  </div>`);
}
function attrName(k) {
  const all = ATTRS_FIELD.concat(ATTRS_GK);
  const f = all.find((a) => a.key === k);
  return f ? f.name : k;
}
ACTIONS.momOpt = (d) => {
  const G = window.G;
  const b = G.queue[0];
  const o = b.m.opts[+d.i];
  const win = chance(momentChance(G, o));
  const res = win ? o.win : o.lose;
  const note = applyEffects(G, res.e);
  G.seasonFeed.push({ icon: win ? '⚡' : '💔', cls: win ? 'good' : 'bad', text: `<b>${esc(b.m.title)}</b> — ${esc(res.text)}` });
  G.queue.shift(); saveGame(G);
  const w = modal(`<div class="tiny" style="color:${win ? 'var(--acc)' : 'var(--red)'}">${win ? 'HA SALIDO BIEN' : 'HA SALIDO MAL'}</div>
    <h3 style="margin:8px 0 10px">${esc(b.m.title)}</h3>
    <p style="font-size:16px">${esc(res.text)}</p>
    ${note ? `<p class="small dim">${esc(note)}</p>` : ''}
    <button class="btn primary wide mt" data-act="resultOk">Continuar</button>`, { sticky: true });
  ACTIONS.resultOk = () => { w.remove(); renderStep(); };
};

/* ---------- Trama larga ---------- */
function screenStory(arcId) {
  const G = window.G, p = G.player;
  const arc = STORY_BY_ID[arcId];
  const st = p.arcs[arcId];
  if (!arc || !st || st.done || st.stage >= arc.stages.length) { G.queue.shift(); return renderStep(); }
  const stage = arc.stages[st.stage];
  screen(`${topbar(G)}${hud(G, true)}
  <div class="card" style="border-color:#4a3b6b;background:linear-gradient(160deg,#1b1630,#0a1119)">
    <div class="tiny" style="color:var(--purple)">Trama · ${esc(arc.title)}</div>
    <p style="font-size:16px;margin:10px 0 14px">${esc(typeof stage.text === 'function' ? stage.text(G, st.data) : stage.text)}</p>
    <div class="col">
      ${stage.opts.map((o, i) => `<button class="opt" data-act="stOpt" data-i="${i}">
        <div class="t">${esc(o.l)}</div>${o.d ? `<div class="d">${esc(o.d)}</div>` : ''}
      </button>`).join('')}
    </div>
  </div>`);
}
ACTIONS.stOpt = (d) => {
  const G = window.G, p = G.player;
  const b = G.queue[0];
  const arc = STORY_BY_ID[b.arcId];
  const st = p.arcs[b.arcId];
  const o = arc.stages[st.stage].opts[+d.i];
  const note = applyEffects(G, o.e);
  if (o.score) st.data.score = (st.data.score || 0) + o.score;
  const next = o.next != null ? o.next : st.stage + 1;
  if (next === -1 || next >= arc.stages.length) { st.done = true; }
  else st.stage = next;
  G.seasonFeed.push({ icon: '📖', cls: 'info', text: `<b>${esc(arc.title)}</b> — ${esc(o.l)}${note ? '. ' + esc(note) : '.'}` });
  G.queue.shift(); saveGame(G);
  if (note) resultCard(arc.title, note, () => renderStep());
  else renderStep();
};

/* ---------- Simulación ---------- */
function screenSimulating() {
  const G = window.G;
  screen(`${topbar(G)}
  <div class="card cinema">
    <div class="spin"></div>
    <div class="big">Temporada ${seasonLabel(G)}</div>
    <div class="dim">Se juegan los partidos…</div>
  </div>`);
  setTimeout(() => { runSimulation(); }, 620);
}

function runSimulation() {
  const G = window.G, p = G.player;
  const rep = simulateSeason(G);
  const nt = ntEvaluate(G, rep);
  rep.ntTitles = nt.titles;
  const awards = computeAwards(G, rep);
  updateReputation(G, rep, awards, nt);

  /* acumular carrera */
  const s = rep.stats, c = p.career;
  c.apps += s.apps; c.mins += s.mins; c.goals += s.goals; c.assists += s.assists;
  c.motm += s.motm; c.yellow += s.yellow; c.red += s.red;
  c.cs += s.cs; c.saves += s.saves; c.conceded += s.conceded;
  c.ratingSum += s.rating * (s.apps || 1); c.ratingN += (s.apps || 1);
  c.seasons++;
  c.ntApps += nt.caps + nt.tournaments.reduce((a, t) => a + t.caps, 0);
  c.ntGoals += nt.goals + nt.tournaments.reduce((a, t) => a + t.goals, 0);
  p.nt.caps += nt.level === 'Absoluta' ? nt.caps + nt.tournaments.reduce((a, t) => a + t.caps, 0) : 0;
  p.nt.goals += nt.level === 'Absoluta' ? nt.goals + nt.tournaments.reduce((a, t) => a + t.goals, 0) : 0;
  p.nt.level = nt.level;
  p.peakOvr = Math.max(p.peakOvr || 0, p.ovr);

  const allTitles = rep.titles.concat(nt.titles);
  allTitles.forEach((t) => { p.trophies.push({ ...t, season: seasonLabel(G), club: t.nt ? COUNTRY_BY_CODE[p.country].name : rep.club.name }); });
  c.trophies += allTitles.length;
  awards.forEach((a) => p.awards.push({ ...a, season: seasonLabel(G) }));

  /* objetivos */
  const objs = checkObjectives(G, rep);
  const objSp = objs.filter((o) => o.ok).reduce((a, o) => a + o.reward, 0);
  p.sp += objSp;
  rep.objs = objs; rep.objSp = objSp;

  /* moral y estado */
  const okRatio = objs.filter((o) => o.ok).length / Math.max(1, objs.length);
  p.morale = clamp(p.morale + (okRatio - 0.5) * 22 + (rep.titles.length ? 10 : 0), 10, 100);
  p.trust = clamp(p.trust + (s.rating - 6.6) * 12 + (s.mins > 1800 ? 5 : -6), 5, 100);
  p.fanLove = clamp(p.fanLove + (s.rating - 6.6) * 9 + (rep.titles.length ? 8 : 0) - 2, 5, 100);
  p.form = clamp(p.form * 0.4 + (s.rating - 6.7) * 12, -45, 45);
  p.fitness = clamp(p.fitness + 6 - rep.injuries.length * 6, 25, 100);
  if (rep.injuries.length) p.injuryHistory += rep.injuries.length;
  p.money = (p.money || 0) + p.wage * 0.55;

  /* historial */
  p.history.push({
    season: seasonLabel(G), club: rep.club.name, clubId: rep.club.id,
    league: rep.league ? rep.league.name : '', pos: rep.leaguePos, ovr: p.ovr,
    apps: s.apps, goals: s.goals, assists: s.assists, rating: s.rating,
    cs: s.cs, saves: s.saves, conceded: s.conceded, mins: s.mins,
    titles: allTitles.map((t) => t.name), awards: awards.map((a) => a.name),
  });

  /* la clasificacion que ha visto el jugador manda sobre el resto del mundo */
  G.lastTables = {};
  if (rep.league && rep.table) G.lastTables[leagueOfClub(G, rep.club)] = rep.table;

  G.lastReport = rep; G.lastNt = nt; G.lastAwards = awards;
  G.step = 'report';
  saveGame(G);
  renderStep();
}

/* ---------- Resumen de temporada ---------- */
function screenReport() {
  const G = window.G, p = G.player;
  const rep = G.lastReport, nt = G.lastNt, awards = G.lastAwards;
  const s = rep.stats;
  const isGKp = p.pos === 'GK';
  const feed = [];

  rep.injuries.forEach((i) => feed.push({ icon: '🚑', cls: 'bad', text: `<b>${esc(i.name)}</b> — ${i.weeks} semanas de baja.` }));
  if (s.mins < 500 && s.apps < 12) feed.push({ icon: '🪑', cls: 'bad', text: 'Un año para olvidar: apenas has jugado.' });
  rep.titles.forEach((t) => feed.push({ icon: t.icon, cls: 'gold', text: `<b>¡${esc(t.name.toUpperCase())}!</b>` }));
  if (rep.contRound) feed.push({ icon: '🌍', cls: 'info', text: `${esc(rep.contName)}: ${esc(rep.contRound)}.` });
  if (rep.cupRound && !rep.titles.some((t) => t.name === (rep.league || {}).cup)) feed.push({ icon: '🥉', cls: 'info', text: `${esc(rep.league ? rep.league.cup : 'Copa')}: ${esc(rep.cupRound)}.` });
  if (rep.youthNote) feed.push({ icon: '🌱', cls: 'info', text: esc(rep.youthNote) });
  if (rep.relegated) feed.push({ icon: '⬇️', cls: 'bad', text: `El ${esc(rep.club.name)} desciende de categoría.` });
  if (rep.promoted) feed.push({ icon: '⬆️', cls: 'good', text: `¡El ${esc(rep.club.name)} sube de categoría!` });
  nt.feed.forEach((f) => feed.push(f));
  awards.forEach((a) => feed.push({ icon: a.icon, cls: 'gold', text: `<b>${esc(a.name)}</b>` }));

  const tableRows = buildTableView(rep);

  screen(`${topbar(G)}
  <div class="card">
    <div class="row between wrap" style="gap:10px">
      <div>
        <div class="tiny">Resumen ${seasonLabel(G)}</div>
        <h2 style="font-size:22px">${esc(rep.club.name)}</h2>
        <div class="small dim">${rep.league ? esc(rep.league.name) : ''} · ${rep.club.academy ? 'el primer equipo acaba ' + rep.leaguePos + 'º' : rep.leaguePos + 'º clasificado'} · ${rep.role.name}</div>
      </div>
      <div class="row" style="gap:10px">
        ${crestSVG(rep.club, 'crest-lg')}
        <div class="ovr ${ovrTier(p.ovr)}"><b>${s.rating.toFixed(2)}</b><span class="tiny">NOTA</span></div>
      </div>
    </div>
    <div class="stats mt">
      ${stat(s.apps, 'Partidos')}
      ${stat(Math.round(s.mins), 'Minutos')}
      ${isGKp ? stat(s.cs, 'Portería 0') : stat(s.goals, 'Goles')}
      ${isGKp ? stat(s.conceded, 'Encajados') : stat(s.assists, 'Asistencias')}
      ${isGKp ? stat(s.saves, 'Paradas') : stat(s.motm, 'MVP')}
      ${stat(s.yellow + (s.red ? '/' + s.red : ''), s.red ? 'Tarj. A/R' : 'Amarillas')}
    </div>
  </div>

  ${feed.length ? `<div class="card"><div class="tiny">Lo que ha pasado</div><div class="feed mt-s">${feed.map(feedItem).join('')}</div></div>` : ''}

  <div class="card">
    <div class="tiny">Objetivos del club</div>
    <div class="col mt-s" style="gap:7px">
      ${rep.objs.map((o) => `<div class="sub row between">
        <span class="small">${o.ok ? '✅' : '❌'} ${esc(o.text)}</span>
        <span class="small mono dim">${o.kind === 'pos' ? o.val + 'º' : o.kind === 'rating' ? o.val.toFixed(2) : o.val}</span>
      </div>`).join('')}
    </div>
    ${rep.objSp ? `<div class="mt-s small acc b">+${rep.objSp} puntos de evolución por objetivos cumplidos.</div>` : ''}
  </div>

  ${G.seasonFeed.length ? `<div class="card"><div class="tiny">Tu año, decisión a decisión</div><div class="feed mt-s">${G.seasonFeed.map(feedItem).join('')}</div></div>` : ''}

  ${tableRows}

  <div class="actionbar">
    <button class="btn primary wide" data-act="toDevelop">Ver mi evolución →</button>
  </div>`);
}
ACTIONS.toDevelop = () => { window.G.step = 'develop'; saveGame(window.G); renderStep(); };

function buildTableView(rep) {
  if (!rep.table || !rep.table.length) return '';
  const meId = rep.club.academy ? rep.club.parent : rep.club.id;
  const idx = rep.table.findIndex((r) => r.club.id === meId);
  const slice = [];
  rep.table.slice(0, 6).forEach((r) => slice.push(r));
  if (idx > 6) { slice.push(null); for (let i = Math.max(6, idx - 1); i <= Math.min(rep.table.length - 1, idx + 1); i++) slice.push(rep.table[i]); }
  return `<div class="card">
    <div class="tiny">Clasificación · ${esc(rep.league ? rep.league.name : '')}</div>
    <div class="tablewrap mt-s"><table>
      <thead><tr><th>#</th><th>Equipo</th><th class="num">Pts</th></tr></thead>
      <tbody>${slice.map((r) => r === null
        ? '<tr><td colspan="3" class="dim2 tc">···</td></tr>'
        : `<tr style="${r.club.id === meId ? 'background:#0f2419' : ''}">
            <td class="mono">${r.pos}</td>
            <td><div class="row" style="gap:7px">${crestSVG(r.club, 'crest-sm')}<span class="${r.club.id === meId ? 'b acc' : ''}">${esc(r.club.name)}</span></div></td>
            <td class="num b">${r.pts}</td></tr>`).join('')}
      </tbody>
    </table></div>
  </div>`;
}

/* ---------- Evolución ---------- */
function screenDevelop() {
  const G = window.G, p = G.player;
  const dev = G.lastReport.dev;
  const list = attrsFor(p.pos);
  const arrow = dev.delta > 0 ? `<span class="acc">▲ +${dev.delta}</span>` : dev.delta < 0 ? `<span class="red">▼ ${dev.delta}</span>` : '<span class="dim">= 0</span>';
  screen(`${topbar(G)}
  <div class="card">
    <div class="tiny">Final de temporada</div>
    <h2 style="margin:4px 0 10px">Cómo has evolucionado</h2>
    <div class="row between">
      <div class="row" style="gap:14px">
        <div class="ovr" style="opacity:.6"><b>${dev.before}</b><span class="tiny">ANTES</span></div>
        <div style="font-size:22px;align-self:center">→</div>
        <div class="ovr ${ovrTier(p.ovr)}"><b>${p.ovr}</b><span class="tiny">AHORA</span></div>
      </div>
      <div style="text-align:right">
        <div class="b" style="font-size:17px">${arrow}</div>
        <div class="small dim">${ovrLabel(p.ovr)}</div>
      </div>
    </div>
    <p class="small dim mt">${devNarrative(p, dev)}</p>
  </div>

  <div class="card">
    <div class="row between">
      <div><div class="tiny">Entrenamiento</div><h3 style="margin-top:3px">Reparte tus puntos</h3></div>
      <div class="ovr" style="width:58px;height:58px;border-radius:16px"><b style="font-size:23px">${p.sp}</b><span class="tiny">PE</span></div>
    </div>
    <div class="col mt" style="gap:7px">
      ${list.map((a) => `<div class="skill">
        <span class="lab">${a.name}</span>
        <div class="grow">${bar(p.attrs[a.key], 99, WEIGHTS[p.pos][a.key] >= 0.18 ? '' : 'blue')}</div>
        <span class="val mono">${Math.round(p.attrs[a.key])}</span>
        <button class="plus" data-act="spend" data-k="${a.key}" ${p.sp > 0 && p.attrs[a.key] < 99 ? '' : 'disabled'}>+</button>
      </div>`).join('')}
    </div>
    <p class="small dim2 mt-s">Cada punto sube 1 el atributo. Los atributos que más pesan en tu posición son los que más suben tu media.</p>
  </div>

  ${p.traits.length ? `<div class="card"><div class="tiny">Tus rasgos</div>
    <div class="col mt-s" style="gap:7px">${p.traits.map((t) => `<div class="sub row" style="gap:9px">
      <span style="font-size:17px">${TRAITS[t].icon}</span>
      <div><div class="b small">${TRAITS[t].name}</div><div class="small dim2">${TRAITS[t].desc}</div></div>
    </div>`).join('')}</div></div>` : ''}

  <div class="actionbar">
    <button class="btn primary wide" data-act="toMarket">Al mercado de fichajes →</button>
  </div>`);
}
function devNarrative(p, dev) {
  if (dev.delta >= 5) return 'Un salto brutal. Ya no eres el mismo jugador que empezó el año.';
  if (dev.delta >= 2) return 'Progresas bien. Los minutos se están traduciendo en nivel.';
  if (dev.delta >= 1) return 'Mejoras poco a poco. El trabajo silencioso también cuenta.';
  if (dev.delta === 0) return p.age >= 29 ? 'Te mantienes. A tu edad, mantenerse ya es ganar.' : 'Te has estancado. Necesitas más minutos o un cambio de aires.';
  if (dev.delta >= -2) return 'Empieza la cuesta abajo. El cuerpo ya no responde igual.';
  return 'Caída fuerte. Los años y las lesiones pasan factura.';
}
ACTIONS.spend = (d) => {
  const G = window.G, p = G.player;
  if (p.sp <= 0) return;
  p.attrs[d.k] = clamp(p.attrs[d.k] + 1, 20, 99);
  p.sp--; p.ovr = computeOvr(p); p.value = playerValue(p);
  p.peakOvr = Math.max(p.peakOvr || 0, p.ovr);
  saveGame(G); renderStep();
};
ACTIONS.toMarket = () => {
  const G = window.G;
  G.market = generateMarket(G, G.lastReport);
  if (G.pendingMove) {
    G.market.options.unshift({
      type: 'transfer', club: G.pendingMove, forced: true,
      title: 'Fichar por el ' + G.pendingMove.name,
      desc: 'El movimiento que ya habías puesto en marcha.',
      wage: wageFor(G.pendingMove, G.player, squadRole(G.player, G.pendingMove).key),
      years: ri(2, 4), tags: ['Acuerdo cerrado'],
    });
    G.pendingMove = null;
  }
  G.step = 'market'; saveGame(G); renderStep();
};

/* ---------- Mercado ---------- */
function screenMarket() {
  const G = window.G, p = G.player;
  const m = G.market;
  const forcedOut = !m.clubWants;
  screen(`${topbar(G)}
  <div class="card">
    <div class="tiny">Verano de ${G.seasonStart + 1}</div>
    <h2 style="margin:4px 0 6px">¿Y ahora qué?</h2>
    <p class="dim small">${forcedOut
      ? `${esc(clubRef(G.club).replace(/^el /, 'El ').replace(/^la /, 'La '))} no cuenta contigo. Toca buscar equipo.`
      : 'Tu carrera está en tus manos. Elige bien: la media, los minutos y los títulos dependen de esto.'}</p>
    <div class="row wrap mt-s" style="gap:6px">
      ${chip('Media ' + p.ovr, ovrTier(p.ovr) ? 'on' : '')}
      ${chip(p.age + 1 + ' años', '')}
      ${chip('Valor ' + fmtM(p.value), '')}
      ${chip('Fama ' + Math.round(p.rep), p.rep > 60 ? 'on' : '')}
    </div>
  </div>
  <div class="card">
    <div class="col">
      ${m.options.map((o, i) => marketCard(G, o, i)).join('')}
    </div>
    ${m.options.length ? '' : '<p class="dim tc">Nadie te quiere. Se acabó.</p>'}
  </div>`);
}
function marketCard(G, o, i) {
  const p = G.player;
  if (o.type === 'retire') {
    return `<button class="opt" data-act="mkOpt" data-i="${i}" style="border-color:#553">
      <div class="t">🎬 ${esc(o.title)}</div><div class="d">${esc(o.desc)}</div>
    </button>`;
  }
  const c = o.club;
  const lg = LEAGUES[leagueOfClub(G, c)];
  const cc = COUNTRY_BY_CODE[c.country];
  const role = squadRole(p, c, competitorGap(G));
  const comp = competitorFor(G);
  const euro = G.euro[c.academy ? c.parent : c.id];
  return `<button class="opt" data-act="mkOpt" data-i="${i}">
    <div class="row" style="gap:11px">
      ${crestSVG(c, 'crest-lg')}
      <div class="grow" style="min-width:0">
        <div class="t">${esc(o.title)}</div>
        <div class="small dim2">${cc ? cc.flag : ''} ${lg ? esc(lg.name) : ''} · plantilla ${c.str}</div>
        <div class="d" style="margin-top:5px">${esc(o.desc)}</div>
        <div class="meta">
          ${chip(role.name, role.min >= 0.68 ? 'on' : role.min >= 0.4 ? 'warn' : 'bad')}
          ${o.wage != null ? chip('💰 ' + fmtWage(o.wage), '') : ''}
          ${o.years ? chip(o.years + ' años', '') : ''}
          ${euro ? chip('🌍 ' + contCompName(c.confed, euro), 'on') : ''}
          ${(o.tags || []).map((t) => chip(t, '')).join('')}
        </div>
      </div>
    </div>
  </button>`;
}
ACTIONS.mkOpt = (d) => {
  const G = window.G, p = G.player;
  const o = G.market.options[+d.i];
  if (o.type === 'retire') {
    if (!confirm('¿Seguro que quieres retirarte? Se acaba la carrera.')) return;
    p.retired = true; saveGame(G); return renderStep();
  }
  const prevClub = G.club;
  applyMove(G, o);
  if (prevClub.id !== G.club.id) {
    p.history.push({ season: seasonLabel(G) + ' →', club: G.club.name, move: true, note: 'Ficha por ' + G.club.name });
  }
  nextSeason(G);
};

/* ---------- Pasar de temporada ---------- */
function nextSeason(G) {
  const p = G.player;
  p.age++;
  if (p.contract < 99) p.contract = Math.max(0, p.contract - 1);
  G.seasonStart++;
  advanceWorld(G, G.lastTables);
  G.lastTables = null;

  // retirada forzosa
  if (p.age >= 41 || (p.age >= 35 && p.ovr < 58) || (p.age >= 38 && p.ovr < 66)) {
    p.retired = true; p.forcedRetire = true;
    saveGame(G); return renderStep();
  }
  startSeason(G, false);
}

/* ---------- Retirada ---------- */
function screenRetired() {
  const G = window.G, p = G.player;
  const L = computeLegacy(G) + (p.legacyExtra || 0);
  const rank = legacyRank(L);
  const c = p.career;
  const country = COUNTRY_BY_CODE[p.country];
  const avgRating = c.ratingN ? (c.ratingSum / c.ratingN) : 0;
  const byTitle = {};
  p.trophies.forEach((t) => { byTitle[t.name] = (byTitle[t.name] || 0) + 1; });

  // guardar en la sala de leyendas (una sola vez)
  if (!p.savedToHall) {
    p.savedToHall = true;
    const meta = loadMeta();
    meta.careers = (meta.careers || 0) + 1;
    meta.best = Math.max(meta.best || 0, L);
    meta.hall.unshift({
      name: displayName(p), country: p.country, pos: p.pos, peak: p.peakOvr,
      legacy: L, rank: rank.t, goals: c.goals, apps: c.apps, trophies: c.trophies,
      seasons: c.seasons, date: Date.now(),
    });
    meta.hall = meta.hall.slice(0, 30);
    saveMeta(meta);
    clearSave();
  }

  screen(`${brand()}
  <div class="card tc" style="border-color:#4a3f1a;background:linear-gradient(180deg,#1c1708,#0a1119)">
    <div style="font-size:44px">${rank.icon}</div>
    <div class="tiny" style="letter-spacing:.14em">Fin de la carrera</div>
    <h2 style="font-size:28px;margin:6px 0">${esc(displayName(p))} ${country.flag}</h2>
    <div class="b ${rank.color}" style="font-size:20px;letter-spacing:.04em">${rank.t}</div>
    <p class="dim mt-s">${esc(rank.d)}</p>
    <div class="row center wrap mt" style="gap:6px">
      ${chip('Media máxima ' + p.peakOvr, 'on')}
      ${chip(c.seasons + ' temporadas', '')}
      ${chip('Se retira con ' + p.age + ' años', '')}
      ${chip('Legado ' + L, 'warn')}
    </div>
  </div>

  <div class="card">
    <div class="tiny">Números de una vida</div>
    <div class="stats mt-s">
      ${stat(c.apps, 'Partidos')}
      ${stat(c.goals, 'Goles')}
      ${stat(c.assists, 'Asistencias')}
      ${p.pos === 'GK' ? stat(c.cs, 'Portería 0') : stat(c.motm, 'MVP')}
      ${stat(avgRating.toFixed(2), 'Nota media')}
      ${stat(c.ntApps, 'Internacional')}
      ${stat(c.ntGoals, 'Goles selección')}
      ${stat(c.trophies, 'Títulos')}
    </div>
  </div>

  ${p.trophies.length ? `<div class="card"><div class="tiny">Palmarés</div>
    <div class="grid autowide mt-s">${Object.keys(byTitle).sort().map((n) => `<div class="trophy">
      <span class="ic">${esc((p.trophies.find((t) => t.name === n) || {}).icon || '🏆')}</span>
      <div class="grow"><div class="n">${esc(n)}</div><div class="small dim2">×${byTitle[n]}</div></div>
    </div>`).join('')}</div></div>` : '<div class="card"><p class="dim tc">Sin títulos. No todos los caminos acaban en una vitrina.</p></div>'}

  ${p.awards.length ? `<div class="card"><div class="tiny">Premios individuales</div>
    <div class="col mt-s" style="gap:6px">${p.awards.slice().reverse().map((a) => `<div class="sub row between">
      <span class="small"><b>${esc(a.icon)} ${esc(a.name)}</b></span><span class="small dim2">${esc(a.season)}</span>
    </div>`).join('')}</div></div>` : ''}

  ${careerTable(p)}

  <div class="actionbar col" style="gap:8px">
    <button class="btn primary wide" data-act="newCareer">Empezar otra carrera</button>
    <button class="btn ghost wide" data-act="hall">🏛️ Sala de leyendas</button>
  </div>`);
}

function careerTable(p) {
  const rows = p.history.filter((h) => h.rating != null);
  if (!rows.length) return '';
  const gk = p.pos === 'GK';
  return `<div class="card"><div class="tiny">Temporada a temporada</div>
    <div class="tablewrap mt-s"><table>
      <thead><tr><th>Año</th><th>Club</th><th class="num">Med</th><th class="num">PJ</th>
      <th class="num">${gk ? 'PC' : 'G'}</th><th class="num">${gk ? 'GC' : 'A'}</th><th class="num">Nota</th></tr></thead>
      <tbody>${rows.map((h) => `<tr>
        <td class="mono dim">${esc(h.season)}</td>
        <td>${esc(h.club)}${h.titles && h.titles.length ? ' <span class="gold">★</span>' : ''}</td>
        <td class="num b">${h.ovr}</td><td class="num">${h.apps}</td>
        <td class="num">${gk ? h.cs : h.goals}</td><td class="num">${gk ? (h.conceded || 0) : h.assists}</td>
        <td class="num">${h.rating.toFixed(2)}</td></tr>`).join('')}
      </tbody></table></div></div>`;
}

/* ---------- Sala de leyendas ---------- */
ACTIONS.hall = () => {
  const meta = loadMeta();
  screen(`${brand()}
  <div class="card">
    <h2>🏛️ Sala de leyendas</h2>
    <p class="dim small">Todas las carreras que has terminado en este navegador.</p>
    <div class="grid g3 mt-s">${stat(meta.careers || 0, 'Carreras')}${stat(meta.best || 0, 'Mejor legado')}${stat(meta.hall.length, 'Registradas')}</div>
  </div>
  ${meta.hall.length ? `<div class="card"><div class="tablewrap"><table>
    <thead><tr><th>Jugador</th><th>Rango</th><th class="num">Media</th><th class="num">Goles</th><th class="num">Títulos</th><th class="num">Legado</th></tr></thead>
    <tbody>${meta.hall.map((h) => `<tr>
      <td>${(COUNTRY_BY_CODE[h.country] || {}).flag || ''} ${esc(h.name)} <span class="dim2">${POS_BY_KEY[h.pos] ? POS_BY_KEY[h.pos].short : ''}</span></td>
      <td class="small">${esc(h.rank)}</td><td class="num b">${h.peak}</td>
      <td class="num">${h.goals}</td><td class="num">${h.trophies}</td><td class="num b gold">${h.legacy}</td>
    </tr>`).join('')}</tbody></table></div></div>` : '<div class="card"><p class="dim tc">Todavía no has terminado ninguna carrera.</p></div>'}
  <div class="actionbar"><button class="btn wide" data-act="home">Volver</button></div>`);
};

/* ---------- Perfil completo ---------- */
ACTIONS.profile = () => showProfile('perfil');
function showProfile(tab) {
  const G = window.G, p = G.player;
  const c = p.career;
  const list = attrsFor(p.pos);
  const country = COUNTRY_BY_CODE[p.country];
  const tabs = [['perfil', 'Perfil'], ['vestuario', 'Vestuario'], ['palmares', 'Palmarés'], ['historial', 'Historial'], ['liga', 'Mi liga']];
  let body = '';
  if (tab === 'perfil') {
    body = `<div class="kitwrap">${kitSVG(country.kit.shirt, country.kit.trim, country.kit.ink, shirtName(p), p.number)}</div>
      <div class="stats mt-s">${list.map((a) => stat(Math.round(p.attrs[a.key]), a.name)).join('')}</div>
      <div class="grid g2 mt-s" style="gap:8px">
        ${meter('Moral', p.morale, 100, '')}${meter('Confianza', p.trust, 100, 'purple')}
        ${meter('Afición', p.fanLove, 100, '')}${meter('Fama', p.rep, 100, 'gold')}
      </div>
      <div class="stats mt-s">
        ${stat(c.apps, 'Partidos')}${stat(c.goals, 'Goles')}${stat(c.assists, 'Asist.')}
        ${stat(c.trophies, 'Títulos')}${stat(p.nt.caps, 'Intern.')}${stat(fmtM(p.money || 0), 'Patrimonio')}
      </div>
      ${p.traits.length ? `<div class="row wrap mt-s" style="gap:6px">${p.traits.map((t) => chip(TRAITS[t].icon + ' ' + TRAITS[t].name, TRAITS[t].bad ? 'bad' : 'on')).join('')}</div>` : ''}`;
  } else if (tab === 'vestuario') {
    const squad = (G.squad || []).slice();
    const comp = competitorFor(G);
    const me = { name: displayName(p), country: p.country, pos: p.pos, ovr: p.ovr, age: p.age, isMe: true };
    const all = squad.concat([me]).sort((a, b) => b.ovr - a.ovr);
    body = `<div class="small dim" style="margin-bottom:8px">Plantilla del ${esc(mainClub(G.club).name)}. ${comp ? 'Te disputa el puesto <b>' + esc(comp.name) + '</b>.' : ''}</div>
      <div class="tablewrap"><table style="min-width:0"><thead><tr><th class="num">Med</th><th>Jugador</th><th>Pos</th><th class="num">Edad</th></tr></thead><tbody>
      ${all.map((t) => {
        const cc = COUNTRY_BY_CODE[t.country];
        const mark = t.isMe ? 'background:#0f2419' : (comp && t === comp ? 'background:#221c0d' : '');
        return `<tr style="${mark}"><td class="num b">${t.ovr}</td>
          <td class="${t.isMe ? 'b acc' : ''}" style="white-space:normal">${cc ? cc.flag : ''} ${esc(t.name)}${t.isNew ? ' <span class="gold">·nuevo</span>' : ''}</td>
          <td class="dim2">${POS_BY_KEY[t.pos].short}</td><td class="num">${t.age}</td></tr>`;
      }).join('')}
      </tbody></table></div>`;
  } else if (tab === 'palmares') {
    const by = {};
    p.trophies.forEach((t) => { by[t.name] = (by[t.name] || 0) + 1; });
    body = p.trophies.length
      ? `<div class="grid autowide">${Object.keys(by).map((n) => `<div class="trophy"><span class="ic">${esc((p.trophies.find((t) => t.name === n) || {}).icon || '🏆')}</span><div><div class="n">${esc(n)}</div><div class="small dim2">×${by[n]}</div></div></div>`).join('')}</div>
         ${p.awards.length ? `<div class="tiny mt">Premios</div><div class="col mt-s" style="gap:6px">${p.awards.slice().reverse().map((a) => `<div class="sub row between"><span class="small b">${esc(a.icon)} ${esc(a.name)}</span><span class="small dim2">${esc(a.season)}</span></div>`).join('')}</div>` : ''}`
      : '<p class="dim tc">Vitrina vacía. Todavía.</p>';
  } else if (tab === 'historial') {
    body = careerTable(p) || '<p class="dim tc">Aún no has jugado ninguna temporada.</p>';
  } else {
    const lk = leagueOfClub(G, G.club);
    const table = simulateTable(G, lk);
    const meId = G.club.academy ? G.club.parent : G.club.id;
    body = `<div class="tablewrap"><table><thead><tr><th>#</th><th>Equipo</th><th class="num">Nivel</th></tr></thead><tbody>
      ${leagueMembers(G, lk).slice().sort((a, b) => b.str - a.str).map((cl, i) => `<tr style="${cl.id === meId ? 'background:#0f2419' : ''}">
        <td class="mono">${i + 1}</td><td><div class="row" style="gap:7px">${crestSVG(cl, 'crest-sm')}<span class="${cl.id === meId ? 'b acc' : ''}">${esc(cl.name)}</span></div></td>
        <td class="num b">${cl.str}</td></tr>`).join('')}</tbody></table></div>`;
  }
  const w = modal(`<div class="row between" style="margin-bottom:10px">
      <div><div class="tiny">${country.flag} ${esc(country.name)}</div><h3>${esc(displayName(p))}</h3></div>
      <button class="btn sm ghost" data-act="closeModal">✕</button>
    </div>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="ptab" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="mt">${body}</div>`);
  ACTIONS.ptab = (d) => { w.remove(); showProfile(d.k); };
}
