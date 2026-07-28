/* ============================================================
   META: hitos, récords, destacados, ventajas y Reto del Día
   ============================================================ */

/* ---------- Hitos de carrera ----------
   Se comprueban al final de cada temporada. Dan legado y, sobre todo, dan la
   sensación de que la carrera avanza hacia algo. */
const MILESTONES = [
  { id: 'debut', icon: '👕', name: 'Debut como profesional', legacy: 10, test: (c) => c.apps >= 1 },
  { id: 'apps50', icon: '🎽', name: '50 partidos oficiales', legacy: 15, test: (c) => c.apps >= 50 },
  { id: 'apps100', icon: '💯', name: '100 partidos oficiales', legacy: 25, test: (c) => c.apps >= 100 },
  { id: 'apps250', icon: '🏟️', name: '250 partidos oficiales', legacy: 45, test: (c) => c.apps >= 250 },
  { id: 'apps500', icon: '🗿', name: '500 partidos oficiales', legacy: 90, test: (c) => c.apps >= 500 },
  { id: 'apps700', icon: '⏳', name: '700 partidos: pocos llegan aquí', legacy: 140, test: (c) => c.apps >= 700 },
  { id: 'g1', icon: '⚽', name: 'Tu primer gol', legacy: 10, test: (c, p) => p.pos !== 'GK' && c.goals >= 1 },
  { id: 'g50', icon: '🎯', name: '50 goles', legacy: 20, test: (c, p) => p.pos !== 'GK' && c.goals >= 50 },
  { id: 'g100', icon: '💥', name: '100 goles', legacy: 40, test: (c, p) => p.pos !== 'GK' && c.goals >= 100 },
  { id: 'g250', icon: '🔥', name: '250 goles', legacy: 80, test: (c, p) => p.pos !== 'GK' && c.goals >= 250 },
  { id: 'g500', icon: '👑', name: '500 goles: territorio de leyenda', legacy: 200, test: (c, p) => p.pos !== 'GK' && c.goals >= 500 },
  { id: 'a100', icon: '🪄', name: '100 asistencias', legacy: 40, test: (c, p) => p.pos !== 'GK' && c.assists >= 100 },
  { id: 'cs100', icon: '🧤', name: '100 porterías a cero', legacy: 50, test: (c, p) => p.pos === 'GK' && c.cs >= 100 },
  { id: 'cs200', icon: '🧱', name: '200 porterías a cero', legacy: 110, test: (c, p) => p.pos === 'GK' && c.cs >= 200 },
  { id: 'nt1', icon: '🌐', name: 'Debut con la absoluta', legacy: 25, test: (c) => c.ntApps >= 1 },
  { id: 'nt50', icon: '🎖️', name: '50 internacionalidades', legacy: 45, test: (c) => c.ntApps >= 50 },
  { id: 'nt100', icon: '🏅', name: '100 internacionalidades', legacy: 100, test: (c) => c.ntApps >= 100 },
  { id: 'ovr80', icon: '📈', name: 'Superar los 80 de media', legacy: 30, test: (c, p) => p.peakOvr >= 80 },
  { id: 'ovr88', icon: '⭐', name: 'Clase mundial: 88 de media', legacy: 70, test: (c, p) => p.peakOvr >= 88 },
  { id: 'ovr93', icon: '🌟', name: '93 de media: uno de los mejores del planeta', legacy: 160, test: (c, p) => p.peakOvr >= 93 },
  { id: 't1', icon: '🏆', name: 'Tu primer título', legacy: 20, test: (c) => c.trophies >= 1 },
  { id: 't10', icon: '🏆', name: '10 títulos', legacy: 60, test: (c) => c.trophies >= 10 },
  { id: 't20', icon: '🏆', name: '20 títulos: una vitrina indecente', legacy: 140, test: (c) => c.trophies >= 20 },
];

function checkMilestones(G) {
  const p = G.player, c = p.career;
  p.milestones = p.milestones || {};
  const hit = [];
  MILESTONES.forEach((m) => {
    if (p.milestones[m.id]) return;
    if (!m.test(c, p)) return;
    p.milestones[m.id] = seasonLabel(G);
    p.legacyExtra = (p.legacyExtra || 0) + m.legacy;
    hit.push(m);
  });
  return hit;
}

/* ---------- Récords personales ---------- */
function updateRecords(G, rep) {
  const p = G.player, s = rep.stats;
  p.records = p.records || {};
  const r = p.records;
  const better = (key, val, extra) => {
    if (val > (r[key] ? r[key].v : -1)) r[key] = { v: val, season: seasonLabel(G), club: rep.club.name, ...extra };
  };
  better('goals', s.goals);
  better('assists', s.assists);
  better('apps', s.apps);
  better('rating', s.rating);
  if (p.pos === 'GK') { better('cs', s.cs); better('saves', s.saves); }
}
/* Qué récords se han batido esta temporada (se llama ANTES de actualizarlos) */
function brokenRecords(G, rep) {
  const p = G.player, s = rep.stats, r = p.records || {};
  const out = [];
  const chk = (key, val, label, fmt) => {
    if (!r[key] || val <= r[key].v) return;
    if (val <= 0) return;
    out.push(`${label} (${fmt ? fmt(val) : val}, antes ${fmt ? fmt(r[key].v) : r[key].v})`);
  };
  chk('goals', s.goals, 'más goles en una temporada');
  chk('assists', s.assists, 'más asistencias en una temporada');
  chk('rating', s.rating, 'mejor nota media', (v) => v.toFixed(2));
  if (p.pos === 'GK') chk('cs', s.cs, 'más porterías a cero');
  return out;
}

const RECORD_LABELS = {
  goals: 'Más goles en una temporada', assists: 'Más asistencias en una temporada',
  apps: 'Más partidos en una temporada', rating: 'Mejor nota media',
  cs: 'Más porterías a cero', saves: 'Más paradas',
};

/* ---------- Destacados de la temporada ----------
   Se deducen de los números reales, así que nunca cuentan algo que no pasó. */
function seasonHighlights(G, rep) {
  const p = G.player, s = rep.stats;
  const out = [];
  const club = rep.club.name;
  if (s.apps < 5) return out;

  if (p.pos !== 'GK' && s.goals >= 10) {
    const hats = poisson(s.goals / 14);
    if (hats >= 1) out.push({ icon: '🎩', cls: 'good', text: hats === 1
      ? `Firmaste un <b>hat-trick</b> esta temporada.`
      : `<b>${hats} hat-tricks</b> en una sola temporada.` });
  }
  if (p.pos !== 'GK' && s.goals >= 6 && chance(0.55)) {
    const streak = clamp(2 + poisson(s.goals / 11), 2, 9);
    out.push({ icon: '🔥', cls: 'good', text: `Marcaste en <b>${streak} partidos seguidos</b>.` });
  }
  if (p.pos !== 'GK' && s.goals >= 3 && chance(0.45)) {
    out.push({ icon: '⏱️', cls: 'good', text: pick([
      `Un gol tuyo en el minuto 90 dio tres puntos al ${club}.`,
      `Marcaste el gol de la victoria en el derbi.`,
      `Un golazo desde fuera del área tuyo abrió los informativos.`,
      `Marcaste en el último suspiro para forzar un empate imposible.`,
    ]) });
  }
  if (s.assists >= 6 && chance(0.5)) {
    out.push({ icon: '🪄', cls: 'good', text: pick([
      `Diste tres asistencias en un mismo partido.`,
      `Tu pase del año se ha visto en todos los resúmenes.`,
      `Repartiste asistencias en cuatro jornadas consecutivas.`,
    ]) });
  }
  if (p.pos === 'GK' && s.saves >= 60 && chance(0.6)) {
    out.push({ icon: '🧤', cls: 'good', text: pick([
      `Hiciste <b>nueve paradas</b> en un solo partido y os salvaste con un punto.`,
      `Encadenaste <b>cinco porterías a cero</b> seguidas.`,
      `Paraste un penalti en el descuento.`,
    ]) });
  }
  if (s.rating >= 7.6 && chance(0.5)) {
    out.push({ icon: '📰', cls: 'info', text: `La prensa te ha metido en el once ideal de la jornada ${ri(3, 9)} veces.` });
  }
  if (s.red >= 1) out.push({ icon: '🟥', cls: 'bad', text: `Viste una <b>roja directa</b> que te costó sanción.` });
  if (s.apps > 10 && s.rating <= 6.2) out.push({ icon: '📉', cls: 'bad', text: `La afición te señaló como uno de los puntos débiles del equipo.` });
  return shuffle(out).slice(0, 3);
}

/* ---------- Invertir en ti mismo ----------
   Hasta ahora el dinero no servía para nada. Ahora se convierte en rendimiento:
   cada verano puedes montarte tu propio equipo de trabajo. Es caro, hay que
   renovarlo cada año y de joven no te lo puedes permitir, que es justo la gracia. */
const INVESTMENTS = [
  { id: 'fisio', icon: '🩺', name: 'Fisioterapeuta a tiempo completo', cost: 0.45,
    desc: 'Alguien pendiente de tu cuerpo los 365 días.', e: { injuryRisk: 0.68, fitness: 6 } },
  { id: 'prepa', icon: '🏋️', name: 'Preparador físico personal', cost: 0.3,
    desc: 'Trabajo específico para tu posición y tu cuerpo.', e: { injuryRisk: 0.85, fitness: 9, attr: { phy: 1 } } },
  { id: 'chef', icon: '🥗', name: 'Nutricionista y chef', cost: 0.25,
    desc: 'Se acabó comer lo que pillas.', e: { fitness: 10, growth: 1.05 } },
  { id: 'psico', icon: '🧠', name: 'Psicólogo deportivo', cost: 0.22,
    desc: 'La cabeza también se entrena.', e: { morale: 12, rating: 0.06, attr: { men: 1 } } },
  { id: 'video', icon: '🎥', name: 'Analista de vídeo propio', cost: 0.4,
    desc: 'Cada rival estudiado antes de pisar el campo.', e: { growth: 1.1, rating: 0.06 } },
  { id: 'tech', icon: '❄️', name: 'Sala de recuperación en casa', cost: 0.7,
    desc: 'Crioterapia, presoterapia y cámara hiperbárica.', e: { injuryRisk: 0.72, fitness: 12, mins: 1.04 } },
  { id: 'coach', icon: '🎯', name: 'Entrenador específico de tu puesto', cost: 0.35,
    desc: 'Un especialista solo para pulir lo tuyo.', e: null },   // el efecto depende de la posición
];
/* El entrenador específico mejora lo que de verdad importa en tu demarcación */
function investmentEffect(inv, p) {
  if (inv.id !== 'coach') return inv.e;
  const w = WEIGHTS[p.pos];
  const key = Object.keys(w).sort((a, b) => w[b] - w[a])[0];
  return { attr: { [key]: 2 }, growth: 1.06 };
}
function investmentsFor(G) {
  const p = G.player;
  return INVESTMENTS.filter((i) => !(G.bought || []).includes(i.id));
}

/* ---------- Ventajas desbloqueables ----------
   Lo que se gana en una carrera sirve para la siguiente: engancha a volver a jugar. */
const PERKS = [
  { id: 'none', need: 0, icon: '🚫', name: 'Sin ventaja', desc: 'La carrera limpia, como debe ser.' },
  { id: 'scout', need: 400, icon: '🔎', name: 'Ojo de ojeador', desc: 'Las opciones iniciales incluyen clubes algo mejores.' },
  { id: 'body', need: 1200, icon: '🛡️', name: 'Cuerpo de hierro', desc: 'Empiezas con el rasgo Hombre de hierro: la mitad de lesiones.' },
  { id: 'contacts', need: 2200, icon: '📇', name: 'Agenda de contactos', desc: 'Empiezas con superagente: más y mejores ofertas toda la carrera.' },
  { id: 'genes', need: 3500, icon: '🧬', name: 'Genética privilegiada', desc: '+4 a tu techo secreto. No garantiza nada, pero ayuda.' },
  { id: 'prodigy', need: 6000, icon: '✨', name: 'Prodigio', desc: '+7 al techo y empiezas dos puntos por encima.' },
];
function unlockedPerks(meta) {
  const total = (meta.hall || []).reduce((a, h) => a + (h.legacy || 0), 0);
  return { total, list: PERKS.map((p) => ({ ...p, unlocked: total >= p.need })) };
}
function applyPerk(p, perkId) {
  switch (perkId) {
    case 'body': if (!p.traits.includes('ironman')) p.traits.push('ironman'); break;
    case 'contacts': p.flags.superAgent = 1; break;
    case 'genes': p.pot = clamp(p.pot + 4, 40, 99); break;
    case 'prodigy':
      p.pot = clamp(p.pot + 7, 40, 99);
      Object.keys(p.attrs).forEach((k) => { p.attrs[k] = clamp(p.attrs[k] + 2, 20, 99); });
      p.ovr = computeOvr(p);
      break;
    default: break;
  }
  p.perk = perkId;
}

/* ---------- Reto del Día ----------
   Todo el mundo que juegue hoy arranca exactamente con las mismas condiciones y
   la misma semilla. Lo que cambie el resultado serán tus decisiones, no la suerte.
   Al terminar sale una tarjeta de texto para pegar en el grupo. */
function todayKey(d) {
  const t = d || new Date();
  return t.getUTCFullYear() * 10000 + (t.getUTCMonth() + 1) * 100 + t.getUTCDate();
}
function dailySeed(key) {
  let h = 2166136261 ^ (key >>> 0);
  for (let i = 0; i < 4; i++) { h = Math.imul(h ^ (h >>> 13), 16777619); }
  return h >>> 0;
}
/* Genera las condiciones del reto de forma determinista */
function dailyChallenge(key) {
  const saved = RNG_STATE;
  seedRng(dailySeed(key));
  const pool = COUNTRIES.filter((c) => c.tier >= 2);
  const country = pick(pool);
  const pos = pick(POSITIONS).key;
  const archKeys = Object.keys(ARCHETYPES);
  const arch = pick(archKeys);
  const twists = [
    { id: 'none', name: 'Sin restricciones', desc: 'La carrera tal cual. Que hable el talento.' },
    { id: 'hard', name: 'Sin red', desc: 'Empiezas en el club más modesto de los tres.' },
    { id: 'home', name: 'De casa', desc: 'Empiezas obligatoriamente en tu país.' },
    { id: 'exile', name: 'Exiliado', desc: 'Empiezas obligatoriamente fuera de tu país.' },
  ];
  const twist = pick(twists);
  const goalPool = [
    { id: 'ucl', name: 'Ganar la Champions', check: (p) => p.trophies.some((t) => t.name === 'UEFA Champions League') },
    { id: 'ballon', name: 'Ganar el Balón de Oro', check: (p) => p.awards.some((a) => a.kind === 'ballon') },
    { id: 'ovr90', name: 'Llegar a 90 de media', check: (p) => p.peakOvr >= 90 },
    { id: 'nt', name: 'Jugar 50 partidos con tu selección', check: (p) => p.career.ntApps >= 50 },
    { id: 'trophies', name: 'Ganar 12 títulos', check: (p) => p.career.trophies >= 12 },
    { id: 'goals', name: 'Marcar 200 goles', check: (p) => p.career.goals >= 200 },
  ];
  const goal = pick(goalPool.filter((g) => !(pos === 'GK' && (g.id === 'goals' || g.id === 'ballon'))));
  RNG_STATE = saved;
  return { key, seed: dailySeed(key), country, pos, arch, twist, goal };
}

/* Puntuación del reto: legado más bonus por cumplir el objetivo */
function challengeScore(G) {
  const p = G.player;
  const base = computeLegacy(G) + (p.legacyExtra || 0);
  const ch = G.challenge;
  const done = ch && ch.goal.check(p);
  return { score: Math.round(base * (done ? 1.5 : 1)), base, goalDone: !!done };
}

/* Tarjeta de texto para compartir, estilo resultado de partido */
function challengeShareText(G) {
  const p = G.player, c = p.career, ch = G.challenge;
  const { score, goalDone } = challengeScore(G);
  const country = COUNTRY_BY_CODE[p.country];
  const d = String(ch.key);
  const fecha = `${d.slice(6, 8)}/${d.slice(4, 6)}`;
  const rank = legacyRank(score);
  const lines = [
    `⚽ El Camino · Reto ${fecha}`,
    `${country.flag} ${POS_BY_KEY[p.pos].name} · media máxima ${p.peakOvr}`,
    `${goalDone ? '✅' : '❌'} ${ch.goal.name}`,
    p.pos === 'GK'
      ? `🧤 ${c.cs} porterías a cero · ${c.apps} partidos`
      : `⚽ ${c.goals} goles · 🅰️ ${c.assists} asistencias · ${c.apps} partidos`,
    `🏆 ${c.trophies} títulos · 🌐 ${c.ntApps} internacionalidades`,
    `${rank.icon} ${rank.t} — ${score} puntos`,
  ];
  return lines.join('\n');
}

/* ---------- Gráfica de la evolución de la media ---------- */
function ovrSparkline(history, w, h) {
  const rows = history.filter((x) => x.ovr != null);
  if (rows.length < 2) return '';
  const W = w || 300, H = h || 74, pad = 6;
  const vals = rows.map((r) => r.ovr);
  const lo = Math.min(...vals) - 2, hi = Math.max(...vals) + 2;
  const x = (i) => pad + (i / (rows.length - 1)) * (W - pad * 2);
  const y = (v) => H - pad - ((v - lo) / Math.max(1, hi - lo)) * (H - pad * 2);
  const line = rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r.ovr).toFixed(1)}`).join(' ');
  const area = `${line} L${x(rows.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;
  const peakI = vals.indexOf(Math.max(...vals));
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block" aria-label="Evolución de la media">
    <defs><linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2ee66b" stop-opacity=".35"/>
      <stop offset="1" stop-color="#2ee66b" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${area}" fill="url(#spk)"/>
    <path d="${line}" fill="none" stroke="#2ee66b" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(peakI).toFixed(1)}" cy="${y(vals[peakI]).toFixed(1)}" r="3.6" fill="#ffc93c"/>
    <text x="${x(peakI).toFixed(1)}" y="${(y(vals[peakI]) - 7).toFixed(1)}" text-anchor="middle"
      font-family="Inter,sans-serif" font-size="11" font-weight="800" fill="#ffc93c">${vals[peakI]}</text>
  </svg>`;
}
