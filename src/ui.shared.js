/* ============================================================
   INTERFAZ: utilidades de render y efectos
   ============================================================ */

const APP = () => document.getElementById('app');
const ACTIONS = {};

function screen(html) {
  const app = APP();
  app.innerHTML = html;
  app.scrollTop = 0;
  window.scrollTo(0, 0);
  bind(app);
}
function bind(root) {
  root.querySelectorAll('[data-act]').forEach((n) => {
    if (n.__bound) return; n.__bound = true;
    n.addEventListener('click', (e) => {
      const a = n.getAttribute('data-act');
      if (ACTIONS[a]) { e.preventDefault(); ACTIONS[a](n.dataset, n); }
    });
  });
  root.querySelectorAll('[data-inp]').forEach((n) => {
    if (n.__bound) return; n.__bound = true;
    n.addEventListener('input', () => { const a = n.getAttribute('data-inp'); if (ACTIONS[a]) ACTIONS[a](n.dataset, n); });
  });
}

/* ---------- Modal ---------- */
function modal(html, opts) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-bg';
  wrap.innerHTML = `<div class="modal">${html}</div>`;
  wrap.addEventListener('click', (e) => { if (e.target === wrap && !(opts && opts.sticky)) wrap.remove(); });
  document.body.appendChild(wrap);
  bind(wrap);
  return wrap;
}
function closeModals() { document.querySelectorAll('.modal-bg').forEach((n) => n.remove()); }
ACTIONS.closeModal = () => closeModals();

/* ---------- Barras y piezas ---------- */
const bar = (v, max, cls) => `<div class="bar ${cls || ''}"><i style="width:${clamp((v / max) * 100, 0, 100)}%"></i></div>`;
const chip = (t, cls) => `<span class="chip ${cls || ''}">${t}</span>`;
const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;

function seasonLabel(G) { return `${G.seasonStart}/${String(G.seasonStart + 1).slice(2)}`; }

/* ---------- HUD del jugador ---------- */
function hud(G, compact) {
  const p = G.player, c = G.club;
  const lg = LEAGUES[leagueOfClub(G, c)];
  const country = COUNTRY_BY_CODE[p.country];
  const role = squadRole(p, c);
  return `<div class="card hud">
    <div class="row between wrap" style="gap:14px">
      <div class="row" style="gap:13px;min-width:0">
        <div class="ovr ${ovrTier(p.ovr)}"><b>${p.ovr}</b><span class="tiny">MEDIA</span></div>
        <div style="min-width:0">
          <div class="row" style="gap:7px;flex-wrap:wrap">
            <h2 style="font-size:19px">${esc(displayName(p))}</h2>
            <span style="font-size:17px">${country.flag}</span>
          </div>
          <div class="small dim" style="margin-top:2px">
            ${POS_BY_KEY[p.pos].name} · ${p.age} años · Dorsal ${p.number}
          </div>
          <div class="row" style="gap:6px;margin-top:7px;flex-wrap:wrap">
            ${crestSVG(c, 'crest-sm')}
            <span class="small b">${esc(c.name)}</span>
            <span class="small dim2">${lg ? esc(lg.name) : ''}</span>
          </div>
        </div>
      </div>
      <div class="col" style="gap:6px;align-items:flex-end">
        <div class="tiny">Temporada ${seasonLabel(G)}</div>
        ${chip(role.name, role.key === 'star' || role.key === 'key' ? 'on' : role.key === 'fringe' || role.key === 'sub' ? 'bad' : '')}
        ${chip('Valor ' + fmtM(p.value), '')}
      </div>
    </div>
    ${compact ? '' : `<div class="grid g4 mt" style="gap:8px">
      ${meter('Moral', p.morale, 100, '')}
      ${meter('Forma', 50 + p.form / 2, 100, 'blue')}
      ${meter('Confianza del míster', p.trust, 100, 'purple')}
      ${meter('Fama', p.rep, 100, 'gold')}
    </div>`}
  </div>`;
}
function meter(label, v, max, cls) {
  return `<div class="sub" style="padding:9px 10px">
    <div class="row between" style="margin-bottom:6px"><span class="tiny">${label}</span><span class="small b mono">${Math.round(v)}</span></div>
    ${bar(v, max, cls)}
  </div>`;
}

/* ---------- Aplicar efectos ---------- */
function applyEffects(G, raw) {
  const p = G.player;
  let e = typeof raw === 'function' ? raw(G) : raw;
  if (!e) return '';
  const add = (k, v) => { p[k] = clamp((p[k] || 0) + v, 0, 100); };
  if (e.morale) add('morale', e.morale);
  if (e.trust) add('trust', e.trust);
  if (e.fanLove) add('fanLove', e.fanLove);
  if (e.fitness) add('fitness', e.fitness);
  if (e.rep) p.rep = clamp(p.rep + e.rep, 1, 100);
  if (e.form) p.form = clamp(p.form + e.form, -60, 60);
  if (e.sp) p.sp += e.sp;
  if (e.money) p.money = Math.max(-5, (p.money || 0) + e.money);
  if (e.wageCut) p.wage *= e.wageCut;
  if (e.legacyBonus) p.legacyExtra = (p.legacyExtra || 0) + e.legacyBonus;
  if (e.attr) for (const k in e.attr) if (p.attrs[k] != null) p.attrs[k] = clamp(p.attrs[k] + e.attr[k], 20, 99);
  if (e.trait && !p.traits.includes(e.trait)) p.traits.push(e.trait);
  if (e.lose) p.traits = p.traits.filter((t) => t !== e.lose);
  if (e.flag) p.flags[e.flag] = 1;
  const m = G.mods;
  ['goals', 'assists', 'mins', 'growth', 'injuryRisk'].forEach((k) => { if (e[k]) m[k] = (m[k] || 1) * e[k]; });
  if (e.rating) m.rating = (m.rating || 0) + e.rating;
  if (e.extraGoals) m.extraGoals = (m.extraGoals || 0) + e.extraGoals;
  p.ovr = computeOvr(p);
  p.value = playerValue(p);
  return e.note || '';
}

function freshMods() {
  return { goals: 1, assists: 1, mins: 1, growth: 1, injuryRisk: 1, rating: 0, extraGoals: 0 };
}

/* ---------- Feed ---------- */
function feedItem(it) {
  return `<div class="ev ${it.cls || ''}"><div class="ic">${it.icon || '•'}</div><div class="grow">${it.text}</div></div>`;
}

/* ---------- Guardado ---------- */
const SAVE_KEY = 'elcamino.save.v1';
const META_KEY = 'elcamino.meta.v1';

function saveGame(G) {
  try {
    const data = {
      v: 1, seasonStart: G.seasonStart, player: G.player, clubId: G.club ? G.club.id : null,
      clubAcademy: G.club && G.club.academy ? G.club.parent : null,
      world: G.world, euro: G.euro, euroPool: G.euroPool, mods: G.mods,
      objectives: G.objectives, step: G.step, queue: serializeQueue(G.queue),
      seasonFeed: G.seasonFeed, history: G.player.history,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) { return false; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    const G = {
      seasonStart: d.seasonStart, player: d.player,
      club: d.clubAcademy ? academyOf(getClub(d.clubAcademy)) : getClub(d.clubId),
      world: d.world || {}, euro: d.euro || {}, euroPool: d.euroPool || {},
      mods: d.mods || freshMods(), objectives: d.objectives || [],
      step: d.step || 'season', queue: deserializeQueue(d.queue || []),
      seasonFeed: d.seasonFeed || [],
    };
    // sanear
    if (!G.club) return null;
    G.player.arcs = G.player.arcs || {};
    G.player.flags = G.player.flags || {};
    return G;
  } catch (e) { return null; }
}
function serializeQueue(q) { return (q || []).map((b) => ({ t: b.t, id: b.id || null, arcId: b.arcId || null })); }
function deserializeQueue(q) {
  return q.map((b) => {
    if (b.t === 'event') return { t: 'event', id: b.id, ev: EVENTS.find((e) => e.id === b.id) };
    if (b.t === 'moment') return { t: 'moment', id: b.id, m: MOMENTS.find((e) => e.id === b.id) };
    if (b.t === 'story') return { t: 'story', arcId: b.arcId };
    return b;
  }).filter((b) => b.t === 'preseason' || b.ev || b.m || b.arcId);
}

/* ---------- Meta persistente (sala de leyendas) ---------- */
function loadMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) || { hall: [], best: 0, careers: 0 }; }
  catch (e) { return { hall: [], best: 0, careers: 0 }; }
}
function saveMeta(m) { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {} }
