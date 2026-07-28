/* ============================================================
   FLUJO DE JUEGO: temporada a temporada
   ============================================================ */

function renderStep() {
  const G = window.G;
  if (!G) return screenHome();
  try {
    if (G.player.retired) return screenRetired();
    switch (G.step) {
      case 'beat': return screenBeat();
      case 'sim': return screenSimulating();
      case 'report': return screenReport();
      case 'develop': return screenDevelop();
      case 'market': return screenMarket();
      default: return screenBeat();
    }
  } catch (err) {
    /* Antes de dejar la pantalla en blanco, intentar recolocar la partida en un
       punto jugable. Una carrera de veinte temporadas no se pierde por un fallo. */
    return screenRecover(err);
  }
}

function screenRecover(err) {
  const G = window.G;
  screen(`${brand()}
  <div class="card" style="border-color:#5a2731">
    <div class="tiny red">Se ha atascado algo</div>
    <h2 style="margin:6px 0 8px">Tu carrera sigue a salvo</h2>
    <p class="dim small">Ha fallado al dibujar esta pantalla, pero la partida está guardada.
    Puedes retomarla desde el principio de la temporada sin perder nada de lo conseguido.</p>
    <div class="col mt">
      <button class="btn primary wide" data-act="recoverSeason">Retomar la temporada</button>
      <button class="btn ghost wide" data-act="home">Ir al menú</button>
    </div>
    <details class="mt-s"><summary class="small dim2">Detalle técnico</summary>
      <pre class="small dim2" style="white-space:pre-wrap;margin-top:6px">${esc(String(err && err.stack || err).slice(0, 500))}</pre>
    </details>
  </div>`);
}
ACTIONS.recoverSeason = () => {
  const G = window.G;
  if (!G) return screenHome();
  G.lastReport = null; G.market = null;
  G.step = 'beat';
  if (!G.queue || !G.queue.length) { startSeason(G, false); return; }
  saveGame(G); renderStep();
};

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
  G.bought = [];                    // el staff se contrata temporada a temporada
  G.seasonFeed = [];
  /* Estar en números rojos pesa: ni te puedes rodear bien ni juegas tranquilo. */
  if ((p.money || 0) < 0) {
    p.morale = clamp(p.morale - 8, 15, 100);
    G.mods.rating -= 0.04;
    G.seasonFeed.push({ icon: '🏦', cls: 'bad', text: `Arrastras <b>${fmtM(Math.abs(p.money))}</b> de deuda. Los abogados llaman más que tu madre.` });
    p.money = Math.min(0, p.money + Math.max(0.2, p.wage * 0.3));   // vas devolviéndola
  }
  G.queue = buildQueue(G, first);
  G.queueTotal = G.queue.length;
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
    if (e.once) return last == null;          // una vez por carrera y no vuelve
    return last == null || season - last >= 5;
  });
  const fast = getSettings().pace === 'rapido';
  const nEv = first ? (fast ? 1 : 2) : (fast ? ri(0, 2) : ri(2, 4));
  const chosen = [];
  for (let i = 0; i < nEv && pool.length; i++) {
    const e = pickW(pool.filter((x) => !chosen.includes(x)), (x) => x.w || 5);
    if (!e) break;
    chosen.push(e);
  }
  chosen.forEach((e) => { p.usedEvents[e.id] = season; });

  /* momentos clave */
  const mpool = MOMENTS.filter((m) => !m.when || m.when(G));
  const nMo = first ? 1 : (fast ? (chance(0.55) ? 1 : 0) : ri(1, 2));
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
  </div>
  ${seasonProgress(G)}`;
}
/* Barra de progreso de la temporada: cuántas decisiones quedan antes de jugar */
function seasonProgress(G) {
  if (G.step !== 'beat' || !G.queue) return '';
  const total = (G.queueTotal || G.queue.length) || 1;
  const done = total - G.queue.length;
  return `<div class="row" style="gap:5px;margin:-6px 0 10px">
    ${Array.from({ length: total }, (_, i) => `<div style="flex:1;height:3px;border-radius:3px;background:${i < done ? 'var(--acc)' : '#1b2836'}"></div>`).join('')}
  </div>`;
}

ACTIONS.menu = () => {
  modal(`<h3>Menú</h3>
    <div class="col mt">
      <button class="btn wide" data-act="closeModal">Seguir jugando</button>
      <button class="btn wide" data-act="settings">⚙️ Ajustes de partida</button>
      <button class="btn ghost wide" data-act="saveNow">💾 Guardar ahora</button>
      <button class="btn danger wide" data-act="abandon">Abandonar carrera</button>
    </div>
    <p class="small dim2 mt">La partida se guarda sola en este navegador al final de cada paso.</p>`);
};

/* ---------- Ajustes: cuánta ayuda quieres y a qué ritmo juegas ---------- */
const HINT_OPTS = [
  ['full', 'Completas', 'Te digo exactamente qué sube y qué baja. Cómodo, pero se decide solo.'],
  ['subtle', 'Sutiles', 'Una frase que insinúa por dónde va. Hay que pensar. Recomendado.'],
  ['none', 'Ninguna', 'A ciegas, como en la vida. Solo el texto de la situación.'],
];
const PACE_OPTS = [
  ['normal', 'Completo', 'Todas las decisiones y tú repartes los puntos de entrenamiento.'],
  ['rapido', 'Exprés', 'Menos situaciones por temporada y los puntos se reparten solos. Para carreras rápidas.'],
];
ACTIONS.settings = () => {
  const st = getSettings();
  const w = modal(`<div class="row between" style="margin-bottom:6px">
      <h3>⚙️ Ajustes</h3><button class="btn sm ghost" data-act="closeModal">✕</button></div>
    <div class="tiny mt">Pistas en las decisiones</div>
    <div class="col mt-s">
      ${HINT_OPTS.map(([k, n, d]) => `<button class="opt ${st.hints === k ? 'on' : ''}" data-act="setHints" data-k="${k}"
        style="${st.hints === k ? 'border-color:var(--acc);background:#0f2419' : ''}">
        <div class="t">${n}</div><div class="d">${d}</div></button>`).join('')}
    </div>
    <div class="tiny mt">Ritmo de juego</div>
    <div class="col mt-s">
      ${PACE_OPTS.map(([k, n, d]) => `<button class="opt ${st.pace === k ? 'on' : ''}" data-act="setPace" data-k="${k}"
        style="${st.pace === k ? 'border-color:var(--acc);background:#0f2419' : ''}">
        <div class="t">${n}</div><div class="d">${d}</div></button>`).join('')}
    </div>
    <p class="small dim2 mt">Se aplican a partir de la siguiente temporada y se recuerdan entre partidas.</p>`);
  ACTIONS.setHints = (d) => { setSetting('hints', d.k); w.remove(); ACTIONS.settings(); };
  ACTIONS.setPace = (d) => { setSetting('pace', d.k); w.remove(); ACTIONS.settings(); };
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
    <div class="row between" style="gap:8px">
      <div class="tiny">Pretemporada</div>
      <div class="imp" style="color:var(--acc)">${esc(careerStage(p.age).name)} · ${p.age} años</div>
    </div>
    <div class="small dim2" style="margin:4px 0 8px">${esc(careerStage(p.age).desc)}</div>
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
    <div class="row between">
      <div><div class="tiny">Tu dinero</div><h3 style="margin-top:3px">Invertir en ti</h3></div>
      <div class="ovr" style="width:auto;min-width:78px;height:52px;border-radius:14px;padding:0 12px">
        <b style="font-size:17px">${fmtM(p.money || 0)}</b><span class="tiny">EN EL BANCO</span></div>
    </div>
    <p class="small dim2 mt-s">Se contrata cada verano y vale para esta temporada. Cuanto mejor cobres, mejor te puedes rodear.</p>
    <div class="col mt-s">
      ${investmentsFor(G).map((inv, i) => {
        const can = (p.money || 0) >= inv.cost;
        return `<button class="opt ${can ? '' : 'off'}" data-act="buyInv" data-id="${inv.id}" ${can ? '' : 'disabled'}>
          <div class="row between" style="gap:8px">
            <div class="t">${inv.icon} ${esc(inv.name)}</div>
            <div class="b mono ${can ? 'acc' : 'red'}">${fmtM(inv.cost)}</div>
          </div>
          <div class="d">${esc(inv.desc)}</div>
        </button>`;
      }).join('') || '<p class="small dim2">Ya lo has contratado todo este verano.</p>'}
    </div>
    ${(G.bought || []).length ? `<div class="row wrap mt-s" style="gap:6px">
      ${G.bought.map((id) => { const iv = INVESTMENTS.find((x) => x.id === id); return chip((iv ? iv.icon + ' ' + iv.name : id), 'on'); }).join('')}
    </div>` : ''}
  </div>
  <div class="card">
    <h3>¿Cómo preparas el año?</h3>
    <div class="col mt">
      ${preseasonOptions(G).map((o, i) => `<button class="opt" data-act="preOpt" data-i="${i}">
        <div class="t">${o.l}</div><div class="d">${o.d}</div>
        <div class="meta">${effectChips(o)}</div>
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
/* El verano no se prepara igual siendo portero que siendo extremo: cada puesto
   tiene su propia obsesión de julio. */
const PRESEASON_POS = {
  GK: { l: '🧤 Verano entero de blocaje y salidas', d: 'Manos y área. Nada más.', e: { attr: { han: 2, aer: 1 }, rating: 0.05, growth: 1.04 } },
  CB: { l: '🧱 Trabajo de anticipación y duelos', d: 'Aprender a llegar antes que a llegar fuerte.', e: { attr: { def: 2, men: 1 }, rating: 0.05, injuryRisk: 0.95 } },
  LB: { l: '🏃 Series de ida y vuelta por la banda', d: 'Cien metros noventa veces.', e: { attr: { pac: 2, phy: 1 }, assists: 1.1, fitness: -4 } },
  RB: { l: '🏃 Series de ida y vuelta por la banda', d: 'Cien metros noventa veces.', e: { attr: { pac: 2, phy: 1 }, assists: 1.1, fitness: -4 } },
  DM: { l: '🧭 Vídeo de posicionamiento y coberturas', d: 'Estar siempre donde va a caer el balón.', e: { attr: { def: 2, men: 2 }, rating: 0.06, trust: 6 } },
  CM: { l: '🎛️ Rondos y perfiles de recepción', d: 'Recibir siempre de cara.', e: { attr: { pas: 2, dri: 1 }, assists: 1.12, rating: 0.04 } },
  AM: { l: '🪄 Último pase hasta que salga solo', d: 'Mil pases entre líneas.', e: { attr: { pas: 2, dri: 1 }, assists: 1.18, goals: 1.05 } },
  LW: { l: '⚡ Uno contra uno a máxima velocidad', d: 'Regatear cansado, que es como se regatea.', e: { attr: { dri: 2, pac: 1 }, goals: 1.1, fitness: -5 } },
  RW: { l: '⚡ Uno contra uno a máxima velocidad', d: 'Regatear cansado, que es como se regatea.', e: { attr: { dri: 2, pac: 1 }, goals: 1.1, fitness: -5 } },
  ST: { l: '🎯 Quinientos remates cada mañana', d: 'Definición hasta que duela el empeine.', e: { attr: { sho: 2 }, goals: 1.18, fitness: -5 } },
};
function preseasonOptions(G) {
  const own = PRESEASON_POS[G.player.pos];
  return own ? PRESEASON.concat([own]) : PRESEASON;
}
ACTIONS.buyInv = (d) => {
  const G = window.G, p = G.player;
  const inv = INVESTMENTS.find((x) => x.id === d.id);
  if (!inv || (p.money || 0) < inv.cost) return;
  p.money -= inv.cost;
  G.bought = (G.bought || []).concat([inv.id]);
  const note = applyEffects(G, investmentEffect(inv, p));
  G.seasonFeed.push({ icon: inv.icon, cls: 'info', text: `Contratas: <b>${esc(inv.name)}</b> por ${fmtM(inv.cost)}.` });
  saveGame(G); keepScrollOnce(); renderStep();
};

ACTIONS.preOpt = (d) => {
  const G = window.G;
  const opt = preseasonOptions(G)[+d.i];
  if (!opt) return;
  const note = applyEffects(G, opt.e);
  G.seasonFeed.push({ icon: '🏋️', cls: 'info', text: 'Pretemporada: ' + opt.l.replace(/^\S+\s/, '') + (note ? ' — ' + note : '') });
  G.queue.shift(); saveGame(G); renderStep();
};

function screenEvent(ev) {
  const G = window.G;
  const imp = eventImportance(ev);
  const I = IMPORTANCE[imp];
  screen(`${topbar(G)}${hud(G, true)}
  <div class="card ${I.cls}">
    <div class="row between" style="gap:8px">
      <div class="tiny">${ev.cat}</div>
      <div class="imp" style="color:${I.color}">${imp === 3 ? '⚠ ' : imp === 2 ? '● ' : ''}${I.name}</div>
    </div>
    <h3 style="margin:6px 0 10px;font-size:20px">${esc(ev.title)}</h3>
    <p class="dim">${esc(typeof ev.text === 'function' ? ev.text(G) : ev.text)}</p>
    <div class="col mt">
      ${ev.opts.map((o, i) => `<button class="opt ${optionImportance(o) === 3 ? 'crucial' : ''}" data-act="evOpt" data-i="${i}">
        <div class="t">${esc(o.l)}</div>${o.d ? `<div class="d">${esc(o.d)}</div>` : ''}
        <div class="meta">${effectChips(o)}</div>
      </button>`).join('')}
    </div>
  </div>`);
}
ACTIONS.evOpt = (d) => {
  const G = window.G;
  const b = G.queue[0];
  const o = b.ev.opts[+d.i];
  // Una opción que te ata durante años no se pulsa sin querer
  if (optionImportance(o) === 3 && !d.confirmed) return confirmCrucial(o, () => ACTIONS.evOpt({ ...d, confirmed: '1' }));
  const note = applyEffects(G, o.e);
  G.seasonFeed.push({ icon: '💬', cls: 'info', text: `<b>${esc(b.ev.title)}</b> — ${esc(o.l)}${note ? '. ' + esc(note) : '.'}` });
  G.queue.shift(); saveGame(G);
  if (note) resultCard(b.ev.title, note, () => renderStep());
  else renderStep();
};

function confirmCrucial(o, then) {
  const w = modal(`<div class="imp" style="color:var(--red)">⚠ Decisión crucial</div>
    <h3 style="margin:8px 0 8px">${esc(o.l)}</h3>
    ${o.d ? `<p class="dim small">${esc(o.d)}</p>` : ''}
    <div class="row wrap" style="gap:6px">${effectChips(o)}</div>
    <p class="small dim2 mt">Esto va a marcar tu carrera. No hay vuelta atrás.</p>
    <div class="col mt">
      <button class="btn primary wide" data-act="crucialYes">Sí, adelante</button>
      <button class="btn ghost wide" data-act="crucialNo">Mejor no</button>
    </div>`, { sticky: true });
  ACTIONS.crucialYes = () => { w.remove(); then(); };
  ACTIONS.crucialNo = () => { w.remove(); };
}

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
    <div class="hdr"><span class="pulse"></span><span class="tiny" style="color:var(--acc)">Momento clave</span>
      ${m.clutch ? `<span class="imp grow" style="color:var(--red);justify-content:flex-end">⚠ Aquí se decide todo</span>` : ''}</div>
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
      ${stage.opts.map((o, i) => `<button class="opt ${optionImportance(o) === 3 ? 'crucial' : ''}" data-act="stOpt" data-i="${i}">
        <div class="t">${esc(o.l)}</div>${o.d ? `<div class="d">${esc(o.d)}</div>` : ''}
        <div class="meta">${effectChips(o)}</div>
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
  if (optionImportance(o) === 3 && !d.confirmed) return confirmCrucial(o, () => ACTIONS.stOpt({ ...d, confirmed: '1' }));
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

  /* lo que has hecho con la camiseta de cada club */
  p.clubStats = p.clubStats || {};
  const mc = mainClub(rep.club);
  const cs = p.clubStats[mc.id] = p.clubStats[mc.id] || { name: mc.name, apps: 0, goals: 0, assists: 0, titles: 0, seasons: 0 };
  cs.apps += s.apps; cs.goals += s.goals; cs.assists += s.assists;
  cs.titles += rep.titles.length; cs.seasons++;

  /* hitos, récords y destacados: hacen que la temporada se sienta como un capítulo */
  rep.milestones = checkMilestones(G);
  rep.broken = brokenRecords(G, rep);      // antes de actualizar, para saber qué se ha batido
  rep.prev = p.history.filter((h) => h.rating != null).slice(-1)[0] || null;
  updateRecords(G, rep);
  rep.highlights = seasonHighlights(G, rep);

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

  if (rep.winter) {
    const w = rep.winter;
    feed.push({ icon: '🛫', cls: 'gold', text:
      `<b>Fichaje de invierno.</b> Media temporada en el ${esc(w.from.name)} (${w.a.apps} pj, ${w.a.goals} g) `
      + `y media en el ${esc(w.to.name)} (${w.b.apps} pj, ${w.b.goals} g).` });
  }
  rep.injuries.forEach((i) => feed.push({ icon: '🚑', cls: 'bad', text: `<b>${esc(i.name)}</b> — ${i.weeks} semanas de baja.` }));
  if (rep.banWeeks) feed.push({ icon: '⛔', cls: 'bad', text: `<b>Sancionado ${rep.banWeeks} semanas.</b> Ni entrenar con el grupo.` });
  if (s.mins < 500 && s.apps < 12) feed.push({ icon: '🪑', cls: 'bad', text: 'Un año para olvidar: apenas has jugado.' });
  rep.titles.forEach((t) => feed.push({ icon: t.icon, cls: 'gold', text: `<b>¡${esc(t.name.toUpperCase())}!</b>` }));
  if (rep.contRound) feed.push({ icon: '🌍', cls: 'info', text: `${esc(rep.contName)}: ${esc(rep.contRound)}.` });
  if (rep.cupRound && !rep.titles.some((t) => t.name === (rep.league || {}).cup)) feed.push({ icon: '🥉', cls: 'info', text: `${esc(rep.league ? rep.league.cup : 'Copa')}: ${esc(rep.cupRound)}.` });
  if (rep.youthNote) feed.push({ icon: '🌱', cls: 'info', text: esc(rep.youthNote) });
  if (rep.relegated) feed.push({ icon: '⬇️', cls: 'bad', text: `El ${esc(rep.club.name)} desciende de categoría.` });
  if (rep.promoted) feed.push({ icon: '⬆️', cls: 'good', text: `¡El ${esc(rep.club.name)} sube de categoría!` });
  (rep.broken || []).forEach((b) => feed.push({ icon: '📊', cls: 'gold', text: `<b>Récord personal:</b> ${esc(b)}` }));
  (rep.highlights || []).forEach((h) => feed.push(h));
  nt.feed.forEach((f) => feed.push(f));
  awards.forEach((a) => feed.push({ icon: a.icon, cls: 'gold', text: `<b>${esc(a.name)}</b>` }));
  (rep.milestones || []).forEach((m) => feed.push({ icon: m.icon, cls: 'gold', text: `<b>Hito:</b> ${esc(m.name)}` }));

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
      ${statD(s.apps, 'Partidos', rep.prev && s.apps - rep.prev.apps)}
      ${stat(Math.round(s.mins), 'Minutos')}
      ${isGKp ? statD(s.cs, 'Portería 0', rep.prev && s.cs - rep.prev.cs) : statD(s.goals, 'Goles', rep.prev && s.goals - rep.prev.goals)}
      ${isGKp ? stat(s.conceded, 'Encajados') : statD(s.assists, 'Asistencias', rep.prev && s.assists - rep.prev.assists)}
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
ACTIONS.toDevelop = () => {
  const G = window.G;
  if (getSettings().pace === 'rapido' && G.player.sp > 0) autoSpend(G);
  G.step = 'develop'; saveGame(G); renderStep();
};
/* Reparto automático: los puntos van a lo que más pesa en tu posición, con algo
   de variedad para no clavar siempre el mismo atributo. */
function autoSpend(G) {
  const p = G.player;
  const w = WEIGHTS[p.pos];
  const list = attrsFor(p.pos);
  let spent = 0;
  while (p.sp > 0 && spent < 40) {
    const a = pickW(list.filter((x) => p.attrs[x.key] < 99), (x) => Math.pow(w[x.key] || 0.03, 1.4));
    if (!a) break;
    p.attrs[a.key] = clamp(p.attrs[a.key] + 1, 20, 99);
    p.sp--; spent++;
  }
  p.ovr = computeOvr(p); p.value = playerValue(p);
  p.peakOvr = Math.max(p.peakOvr || 0, p.ovr);
  G.autoSpent = spent;
}

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
  const autoNote = G.autoSpent; G.autoSpent = 0;
  const dev = G.lastReport.dev;
  const list = attrsFor(p.pos);
  const arrow = dev.delta > 0 ? `<span class="acc">▲ +${dev.delta}</span>` : dev.delta < 0 ? `<span class="red">▼ ${dev.delta}</span>` : '<span class="dim">= 0</span>';
  const bump = dev.delta !== 0 ? 'bump' : '';
  screen(`${topbar(G)}
  <div class="card">
    <div class="tiny">Final de temporada</div>
    <h2 style="margin:4px 0 10px">Cómo has evolucionado</h2>
    <div class="row between">
      <div class="row" style="gap:14px">
        <div class="ovr" style="opacity:.6"><b>${dev.before}</b><span class="tiny">ANTES</span></div>
        <div style="font-size:22px;align-self:center">→</div>
        <div class="ovr ${ovrTier(p.ovr)}"><b class="${bump}">${p.ovr}</b><span class="tiny">AHORA</span></div>
      </div>
      <div style="text-align:right">
        <div class="b" style="font-size:17px">${arrow}</div>
        <div class="small dim">${ovrLabel(p.ovr)}</div>
      </div>
    </div>
    <p class="small dim mt">${devNarrative(p, dev)}</p>
    ${p.history.filter((h) => h.ovr != null).length >= 2 ? `<div class="sub mt-s" style="padding:8px 4px 2px">
      <div class="tiny" style="padding-left:8px">Tu media, temporada a temporada</div>
      ${ovrSparkline(p.history, 320, 78)}
    </div>` : ''}
  </div>

  ${autoNote ? `<div class="card" style="border-color:#2b4a63">
    <div class="row" style="gap:9px"><span style="font-size:19px">⚡</span>
    <div><div class="b small">Ritmo exprés</div>
    <div class="small dim2">Se han repartido ${autoNote} puntos automáticamente según tu posición.</div></div></div>
  </div>` : ''}
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
  saveGame(G); keepScrollOnce(); renderStep();
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
  const stature = Math.round(m.stature || p.ovr);
  screen(`${topbar(G)}
  <div class="card ${m.binding ? 'imp-3' : ''}">
    <div class="tiny">Verano de ${G.seasonStart + 1}</div>
    <h2 style="margin:4px 0 6px">${m.binding ? 'Tenías un acuerdo' : '¿Y ahora qué?'}</h2>
    <p class="dim small">${m.binding
      ? 'Te comprometiste a mitad de temporada. Ahora toca cumplir: no hay otra opción sobre la mesa.'
      : forcedOut
        ? `${esc(clubRef(G.club).replace(/^el /, 'El ').replace(/^la /, 'La '))} no cuenta contigo. Toca buscar equipo.`
        : 'Tu carrera está en tus manos. Elige bien: la media, los minutos y los títulos dependen de esto.'}</p>
    <div class="row wrap mt-s" style="gap:6px">
      ${chip('Media ' + p.ovr, ovrTier(p.ovr) ? 'on' : '')}
      ${chip('Cartel ' + stature, stature > p.ovr + 3 ? 'on' : stature < p.ovr - 3 ? 'bad' : '')}
      ${chip(p.age + 1 + ' años', '')}
      ${chip('Valor ' + fmtM(p.value), '')}
    </div>
    ${stature > p.ovr + 3 ? `<div class="small acc mt-s">Tu temporada te ha puesto por encima de tu media: hay clubes mirándote que antes ni preguntaban.</div>` : ''}
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
          ${o.stepUp != null && Math.abs(o.stepUp) >= 2 ? chip((o.stepUp > 0 ? '▲ Salto de nivel +' : '▼ Bajas ') + Math.abs(Math.round(o.stepUp)), o.stepUp > 0 ? 'on' : 'bad') : ''}
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
  if (o.breaksLifer) {
    const c = lifeBreachCost(G);
    if (!confirm('Firmaste de por vida por el ' + G.club.name + '.\n\n'
      + 'Si te vas ahora: pagas ' + fmtM(c.fee) + ' de cláusula, pierdes todo el legado de este club '
      + 'y cargarás con la etiqueta de traidor el resto de tu carrera.\n\n¿Seguro que quieres irte?')) return;
  }
  const prevClub = G.club;
  applyMove(G, o);
  if (prevClub.id !== G.club.id) {
    p.history.push({
      season: seasonLabel(G) + ' →', club: G.club.name, move: true,
      note: (G.lifeBreach ? 'Rompe su contrato de por vida y ficha por ' : 'Ficha por ') + G.club.name,
    });
  }
  if (G.lifeBreach) return screenLifeBreach(prevClub);
  nextSeason(G);
};

/* Romper un contrato de por vida merece su propia pantalla: es irreversible */
function screenLifeBreach(prevClub) {
  const G = window.G, p = G.player;
  const b = G.lifeBreach;
  screen(`${brand()}
  <div class="card imp-3" style="border-color:#5a2731">
    <div class="tiny red">Traición</div>
    <h2 style="margin:6px 0 8px">Te vas del ${esc(prevClub.name)}</h2>
    <p class="dim small">Habías firmado de por vida. Hoy sales por la puerta de atrás, con la cláusula pagada
    y una grada que ha tapado tu mural. En ${esc(prevClub.name)} tu nombre ya no se pronuncia.</p>
    <div class="row wrap mt" style="gap:6px">
      ${chip('💸 −' + fmtM(b.fee), 'bad')}
      ${chip('🏛️ −' + b.legacy + ' legado', 'bad')}
      ${chip('📉 −12 fama', 'bad')}
      ${chip('🐍 Traidor', 'bad')}
    </div>
    <p class="dim2 small mt">El mercado tampoco lo olvida: a partir de ahora los clubes se lo van a pensar dos veces.</p>
    <button class="btn primary wide mt" data-act="afterBreach">Empezar de cero en el ${esc(G.club.name)}</button>
  </div>`);
}
ACTIONS.afterBreach = () => { const G = window.G; G.lifeBreach = null; nextSeason(G); };

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

  const ch = G.challenge;
  const chRes = ch ? challengeScore(G) : null;

  // guardar en la sala de leyendas (una sola vez)
  if (!p.savedToHall) {
    p.savedToHall = true;
    const meta = loadMeta();
    meta.careers = (meta.careers || 0) + 1;
    meta.best = Math.max(meta.best || 0, L);
    if (ch && chRes) {
      const prev = (meta.daily && meta.daily.key === ch.key) ? meta.daily.best : 0;
      meta.daily = { key: ch.key, best: Math.max(prev, chRes.score), rank: legacyRank(chRes.score).t };
    }
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
  ${ch ? `<div class="card" style="border-color:#4a3f1a;background:linear-gradient(160deg,#1b1608,#0a1119)">
    <div class="row between"><span class="tiny" style="color:var(--gold)">🎯 Reto del día</span>
      <span class="small b ${chRes.goalDone ? 'acc' : 'red'}">${chRes.goalDone ? '✅ Objetivo cumplido' : '❌ Objetivo fallado'}</span></div>
    <div class="small dim mt-s">${esc(ch.goal.name)}</div>
    <div class="tc" style="margin:12px 0 6px">
      <div style="font-size:38px;font-weight:900;letter-spacing:-1px" class="gold">${chRes.score}</div>
      <div class="tiny">Puntos${chRes.goalDone ? ' · incluye el ×1,5 por cumplir el objetivo' : ''}</div>
    </div>
    <pre id="shareBox" style="white-space:pre-wrap;background:#0b131b;border:1px solid var(--line);border-radius:11px;
      padding:11px;font:600 12.5px/1.5 var(--font);margin:10px 0 0">${esc(challengeShareText(G))}</pre>
    <button class="btn primary wide mt-s" data-act="copyShare">📋 Copiar para mandarlo al grupo</button>
  </div>` : ''}
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

  ${p.history.filter((h) => h.ovr != null).length >= 2 ? `<div class="card">
    <div class="tiny">Tu media a lo largo de la carrera</div>
    ${ovrSparkline(p.history, 340, 92)}
  </div>` : ''}

  ${clubLegendCard(G)}

  ${p.records && Object.keys(p.records).length ? `<div class="card">
    <div class="tiny">Récords personales</div>
    <div class="col mt-s" style="gap:6px">
      ${Object.keys(p.records).filter((k) => RECORD_LABELS[k]).map((k) => `<div class="sub row between">
        <span class="small">${esc(RECORD_LABELS[k])}</span>
        <span class="small"><b>${k === 'rating' ? p.records[k].v.toFixed(2) : p.records[k].v}</b>
        <span class="dim2">· ${esc(p.records[k].season)}, ${esc(p.records[k].club)}</span></span>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${p.milestones && Object.keys(p.milestones).length ? `<div class="card">
    <div class="tiny">Hitos alcanzados</div>
    <div class="grid autowide mt-s">
      ${MILESTONES.filter((m) => p.milestones[m.id]).map((m) => `<div class="trophy">
        <span class="ic">${m.icon}</span><div><div class="n">${esc(m.name)}</div>
        <div class="small dim2">${esc(p.milestones[m.id])}</div></div></div>`).join('')}
    </div>
  </div>` : ''}

  ${careerTable(p)}

  <div class="actionbar col" style="gap:8px">
    <button class="btn primary wide" data-act="newCareer">Empezar otra carrera</button>
    ${ch ? '<button class="btn wide" data-act="dailyScreen">🎯 Volver a intentar el reto</button>' : ''}
    <button class="btn ghost wide" data-act="hall">🏛️ Sala de leyendas</button>
  </div>`);
}

/* Dónde has dejado más huella: el club donde más has jugado manda */
function clubLegendCard(G) {
  const p = G.player;
  const all = Object.values(p.clubStats || {});
  if (!all.length) return '';
  const target = G.legendClubId && p.clubStats[G.legendClubId] ? p.clubStats[G.legendClubId] : null;
  const home = target || all.slice().sort((a, b) => b.apps - a.apps)[0];
  if (!home || home.apps < 20) return '';
  const score = home.apps * 0.9 + home.goals * 2.4 + home.assists * 1.2 + home.titles * 28 + home.seasons * 8;
  const tier = score >= 900 ? ['LEYENDA ETERNA', 'Tu nombre está en la fachada del estadio.', 'gold']
    : score >= 520 ? ['ÍDOLO', 'Los niños de la ciudad llevan tu dorsal.', 'gold']
      : score >= 280 ? ['UNO DE LOS NUESTROS', 'Aquí siempre vas a tener tu sitio.', 'acc']
        : ['SE TE RECUERDA', 'Diste lo que pudiste con esta camiseta.', 'blue'];
  return `<div class="card">
    <div class="tiny">${target ? '🏛️ Modo Leyenda · tu club' : 'El club de tu vida'}</div>
    <h3 style="margin:4px 0 2px">${esc(home.name)}</h3>
    <div class="b ${tier[2]}" style="font-size:17px;letter-spacing:.03em">${tier[0]}</div>
    <div class="small dim">${tier[1]}</div>
    <div class="stats mt-s">
      ${stat(home.seasons, 'Temporadas')}${stat(home.apps, 'Partidos')}
      ${stat(home.goals, 'Goles')}${stat(home.titles, 'Títulos')}
    </div>
  </div>`;
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

ACTIONS.copyShare = () => {
  const box = document.getElementById('shareBox');
  if (!box) return;
  const txt = box.textContent;
  const done = () => toast('Copiado. ¡A picarse!');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done));
  } else fallbackCopy(txt, done);
};
function fallbackCopy(txt, done) {
  // Sin permisos de portapapeles hay que hacerlo a la vieja usanza
  const ta = document.createElement('textarea');
  ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('Selecciona el texto y cópialo a mano'); }
  ta.remove();
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
