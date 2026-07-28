/* ============================================================
   NUCLEO: aleatoriedad, jugador, atributos, clubes, SVG
   ============================================================ */

/* ---------- Aleatoriedad ---------- */
let RNG_STATE = (Math.random() * 4294967296) >>> 0;
function seedRng(s) { RNG_STATE = (s >>> 0) || 1; }
function rnd() {
  // mulberry32
  RNG_STATE |= 0; RNG_STATE = (RNG_STATE + 0x6D2B79F5) | 0;
  let t = Math.imul(RNG_STATE ^ (RNG_STATE >>> 15), 1 | RNG_STATE);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));          // entero [a,b]
const rf = (a, b) => a + rnd() * (b - a);
const chance = (p) => rnd() < p;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
function pickW(items, weightFn) {
  let total = 0;
  const ws = items.map((it) => { const w = Math.max(0, weightFn(it)); total += w; return w; });
  if (total <= 0) return pick(items);
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
// Distribucion normal truncada
function gauss(mean, sd, lo, hi) {
  let u = 0, v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return clamp(mean + z * sd, lo, hi);
}
function poisson(lambda) {
  if (lambda <= 0) return 0;
  if (lambda > 24) return Math.max(0, Math.round(gauss(lambda, Math.sqrt(lambda), 0, lambda * 3)));
  const L = Math.exp(-lambda); let k = 0, p = 1;
  do { k++; p *= rnd(); } while (p > L);
  return k - 1;
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r1 = (v) => Math.round(v * 10) / 10;

/* ---------- Posiciones ---------- */
const POSITIONS = [
  { key: 'GK', name: 'Portero', short: 'POR', line: 'Portería', g: 0.004, a: 0.010 },
  { key: 'CB', name: 'Defensa central', short: 'DFC', line: 'Defensa', g: 0.070, a: 0.035 },
  { key: 'LB', name: 'Lateral izquierdo', short: 'LI', line: 'Defensa', g: 0.045, a: 0.125 },
  { key: 'RB', name: 'Lateral derecho', short: 'LD', line: 'Defensa', g: 0.045, a: 0.125 },
  { key: 'DM', name: 'Pivote', short: 'MCD', line: 'Medio', g: 0.055, a: 0.080 },
  { key: 'CM', name: 'Mediocentro', short: 'MC', line: 'Medio', g: 0.125, a: 0.150 },
  { key: 'AM', name: 'Mediapunta', short: 'MCO', line: 'Medio', g: 0.245, a: 0.235 },
  { key: 'LW', name: 'Extremo izquierdo', short: 'EI', line: 'Ataque', g: 0.300, a: 0.215 },
  { key: 'RW', name: 'Extremo derecho', short: 'ED', line: 'Ataque', g: 0.300, a: 0.215 },
  { key: 'ST', name: 'Delantero centro', short: 'DC', line: 'Ataque', g: 0.500, a: 0.130 },
];
const POS_BY_KEY = Object.fromEntries(POSITIONS.map((p) => [p.key, p]));

/* ---------- Atributos ---------- */
const ATTRS_FIELD = [
  { key: 'sho', name: 'Tiro' }, { key: 'dri', name: 'Regate' }, { key: 'pas', name: 'Pase' },
  { key: 'def', name: 'Defensa' }, { key: 'phy', name: 'Físico' }, { key: 'pac', name: 'Ritmo' },
  { key: 'men', name: 'Mentalidad' },
];
const ATTRS_GK = [
  { key: 'ref', name: 'Reflejos' }, { key: 'pos', name: 'Colocación' }, { key: 'han', name: 'Manos' },
  { key: 'aer', name: 'Juego aéreo' }, { key: 'kic', name: 'Juego de pies' }, { key: 'men', name: 'Mentalidad' },
];
const WEIGHTS = {
  GK: { ref: .30, pos: .23, han: .19, aer: .12, kic: .08, men: .08 },
  CB: { def: .35, phy: .22, men: .14, pas: .11, pac: .12, dri: .03, sho: .03 },
  LB: { def: .24, pac: .22, phy: .15, pas: .17, dri: .12, men: .08, sho: .02 },
  RB: { def: .24, pac: .22, phy: .15, pas: .17, dri: .12, men: .08, sho: .02 },
  DM: { def: .28, pas: .23, phy: .18, men: .14, dri: .09, pac: .06, sho: .02 },
  CM: { pas: .28, dri: .16, men: .16, phy: .14, def: .14, sho: .06, pac: .06 },
  AM: { pas: .25, dri: .25, sho: .18, men: .12, pac: .12, phy: .05, def: .03 },
  LW: { dri: .28, pac: .24, sho: .18, pas: .14, men: .08, phy: .06, def: .02 },
  RW: { dri: .28, pac: .24, sho: .18, pas: .14, men: .08, phy: .06, def: .02 },
  ST: { sho: .34, dri: .16, phy: .16, pac: .14, men: .12, pas: .06, def: .02 },
};
function attrsFor(pos) { return pos === 'GK' ? ATTRS_GK : ATTRS_FIELD; }
function computeOvr(p) {
  const w = WEIGHTS[p.pos]; let s = 0;
  for (const k in w) s += (p.attrs[k] || 40) * w[k];
  return clamp(Math.round(s), 30, 99);
}

/* ---------- Rasgos ---------- */
const TRAITS = {
  freekick:   { name: 'Especialista a balón parado', icon: '🎯', desc: '+15% goles. Los penaltis y faltas son tuyos.' },
  leader:     { name: 'Líder de vestuario', icon: '🅲', desc: 'Más confianza del entrenador y menos crisis internas.' },
  clutch:     { name: 'Jugador de finales', icon: '🔥', desc: 'Mucho mejor en los momentos clave y en las finales.' },
  ironman:    { name: 'Hombre de hierro', icon: '🛡️', desc: 'Mitad de riesgo de lesión.' },
  glass:      { name: 'Frágil', icon: '🩼', desc: 'Te lesionas con mucha más facilidad.', bad: true },
  wizard:     { name: 'Mago del último pase', icon: '🪄', desc: '+20% asistencias.' },
  poacher:    { name: 'Killer del área', icon: '🦈', desc: '+18% goles, -10% asistencias.' },
  engine:     { name: 'Pulmones infinitos', icon: '🫁', desc: 'Más minutos por partido, menos fatiga.' },
  mediastar:  { name: 'Icono mediático', icon: '📸', desc: 'Reputación y sueldos más altos. Más presión.' },
  hothead:    { name: 'Sangre caliente', icon: '🟥', desc: 'Más tarjetas y más líos.', bad: true },
  wall:       { name: 'Muro', icon: '🧱', desc: 'Portero: menos goles encajados.' },
  sweeper:    { name: 'Portero-líbero', icon: '🧤', desc: 'Portero: más asistencias y mejor con los pies.' },
  loyal:      { name: 'Uno de los nuestros', icon: '💚', desc: 'La afición te adora. Renovaciones más fáciles.' },
  wonderkid:  { name: 'Perla', icon: '✨', desc: 'Creces más rápido antes de los 23.' },
  latebloomer:{ name: 'Flor tardía', icon: '🌻', desc: 'Sigues creciendo pasados los 27.' },
  professor:  { name: 'Profesor', icon: '🎓', desc: 'Envejeces mejor: el declive llega más tarde.' },
  judas:      { name: 'Traidor', icon: '🐍', desc: 'Rompiste un contrato de por vida. Nadie se fía de ti.', bad: true },
};

/* ---------- Mundo: indice de clubes ---------- */
const CLUBS = [];
const CLUBS_BY_ID = {};
(function buildWorld() {
  for (const lk in CLUB_ROWS) {
    const lg = LEAGUES[lk];
    if (!lg) continue;
    CLUB_ROWS[lk].forEach((row, i) => {
      const c = {
        id: lk + '_' + i, name: row[0], abbr: row[1], str: row[2],
        c1: row[3], c2: row[4], prestige: row[5] != null ? row[5] : row[2],
        crest: row[6] || 'p', league: lk, country: lg.country,
        confed: (COUNTRY_BY_CODE[lg.country] || {}).confed || 'UEFA',
      };
      CLUBS.push(c); CLUBS_BY_ID[c.id] = c;
    });
  }
})();
const clubsOf = (lk) => CLUBS.filter((c) => c.league === lk);
const getClub = (id) => CLUBS_BY_ID[id];

/* Clubes filial / academias (para el arranque a los 16) */
function academyOf(club) {
  return {
    id: 'ac_' + club.id, name: 'Cantera del ' + club.name, abbr: club.abbr,
    str: Math.round(club.str * 0.62), c1: club.c1, c2: club.c2,
    prestige: Math.round(club.prestige * 0.5), crest: club.crest,
    league: club.league, country: club.country, confed: club.confed,
    academy: true, parent: club.id,
  };
}

/* ---------- Utilidades de nombre ---------- */
/* Nombre con articulo, para que las frases suenen naturales */
function clubRef(club) {
  if (!club) return 'tu equipo';
  if (club.academy) { const par = getClub(club.parent); return 'la cantera del ' + (par ? par.name : club.abbr); }
  return 'el ' + club.name;
}
/* Nombre del primer equipo al que perteneces */
function mainClub(club) { return club && club.academy ? (getClub(club.parent) || club) : club; }

function displayName(p) { return (p.firstName + ' ' + p.lastName).trim(); }
function shirtName(p) { return (p.shirtName || p.lastName || p.firstName).toUpperCase(); }

/* ---------- SVG: escudo ---------- */
function crestSVG(club, cls) {
  if (!club) return '';
  const { c1, c2 } = club;
  const id = 'c' + Math.abs(hashStr(club.id + club.name)) % 100000;
  let inner = '';
  switch (club.crest) {
    case 's': // rayas verticales
      inner = `<rect width="60" height="70" fill="${c1}"/>` +
        [0, 1, 2].map((i) => `<rect x="${8 + i * 17}" y="0" width="9" height="70" fill="${c2}"/>`).join('');
      break;
    case 'h': // franjas horizontales
      inner = `<rect width="60" height="70" fill="${c1}"/>` +
        [0, 1, 2].map((i) => `<rect x="0" y="${9 + i * 18}" width="60" height="9" fill="${c2}"/>`).join('');
      break;
    case 'v': // mitades
      inner = `<rect width="30" height="70" fill="${c1}"/><rect x="30" width="30" height="70" fill="${c2}"/>`;
      break;
    case 'q': // cuartos
      inner = `<rect width="30" height="35" fill="${c1}"/><rect x="30" width="30" height="35" fill="${c2}"/>` +
        `<rect y="35" width="30" height="35" fill="${c2}"/><rect x="30" y="35" width="30" height="35" fill="${c1}"/>`;
      break;
    case 'x': // banda diagonal
      inner = `<rect width="60" height="70" fill="${c1}"/><path d="M0 46 L46 0 L60 0 L60 12 L14 70 L0 70 Z" fill="${c2}"/>`;
      break;
    default:
      inner = `<rect width="60" height="70" fill="${c1}"/><rect y="56" width="60" height="14" fill="${c2}"/>`;
  }
  const ink = readable(club.crest === 'v' ? c1 : c1);
  return `<svg class="crest ${cls || 'crest-md'}" viewBox="0 0 60 70" aria-hidden="true">
  <defs><clipPath id="${id}"><path d="M2 2 H58 V40 C58 56 40 66 30 68 C20 66 2 56 2 40 Z"/></clipPath></defs>
  <g clip-path="url(#${id})">${inner}</g>
  <path d="M2 2 H58 V40 C58 56 40 66 30 68 C20 66 2 56 2 40 Z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.5"/>
  <text x="30" y="34" text-anchor="middle" font-family="Inter,sans-serif" font-weight="900" font-size="19" fill="${ink}" opacity=".95">${esc(club.abbr.slice(0, 3))}</text>
</svg>`;
}
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function luminance(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const readable = (bg) => (luminance(bg) > 0.55 ? '#101820' : '#ffffff');

/* ---------- SVG: camiseta ---------- */
function kitSVG(shirt, trim, ink, name, num) {
  const inkC = ink || readable(shirt);
  return `<svg class="kit" viewBox="0 0 200 230" role="img" aria-label="Camiseta">
  <defs>
    <linearGradient id="kg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".16"/>
      <stop offset="1" stop-color="#000000" stop-opacity=".22"/>
    </linearGradient>
  </defs>
  <path d="M62 14 L84 6 C92 20 108 20 116 6 L138 14 L176 36 L160 74 L142 66 L142 214 C142 220 138 224 132 224 L68 224 C62 224 58 220 58 214 L58 66 L40 74 L24 36 Z" fill="${shirt}"/>
  <path d="M62 14 L84 6 C92 20 108 20 116 6 L138 14 L176 36 L160 74 L142 66 L142 214 C142 220 138 224 132 224 L68 224 C62 224 58 220 58 214 L58 66 L40 74 L24 36 Z" fill="url(#kg)"/>
  <path d="M84 6 C92 20 108 20 116 6 L124 10 C114 30 86 30 76 10 Z" fill="${trim}"/>
  <rect x="58" y="200" width="84" height="7" fill="${trim}" opacity=".9"/>
  <path d="M24 36 L40 74 L52 70 L36 32 Z" fill="${trim}" opacity=".85"/>
  <path d="M176 36 L160 74 L148 70 L164 32 Z" fill="${trim}" opacity=".85"/>
  <text class="kname" x="100" y="96" text-anchor="middle" fill="${inkC}">${esc((name || '').slice(0, 12))}</text>
  <text class="knum" x="100" y="168" text-anchor="middle" fill="${inkC}">${esc(String(num == null ? '' : num))}</text>
</svg>`;
}

/* ---------- Escape ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---------- Creacion del jugador ---------- */
function rollPotential(bonus) {
  // La mayoria se queda en 70-82. Los cracks mundiales son raros de verdad.
  const roll = rnd();
  let base;
  if (roll < 0.40) base = gauss(68, 4, 58, 76);
  else if (roll < 0.74) base = gauss(76, 3.5, 68, 83);
  else if (roll < 0.92) base = gauss(83, 3, 77, 88);
  else if (roll < 0.99) base = gauss(88, 2.5, 83, 93);
  else base = gauss(93, 2.5, 89, 99);
  return clamp(Math.round(base + (bonus || 0)), 58, 99);
}

function createPlayer(opts) {
  const pos = opts.pos;
  const list = attrsFor(pos);
  const p = {
    firstName: opts.firstName, lastName: opts.lastName, shirtName: opts.shirtName,
    number: opts.number, pos, country: opts.country, foot: opts.foot || 'Derecho',
    age: 16, born: opts.startYear - 16,
    attrs: {}, traits: [], sp: 0,
    form: 0, morale: 70, fitness: 95, rep: 8, trust: 55, fanLove: 50,
    injury: null, injuryHistory: 0, proneness: rf(0.75, 1.3),
    club: null, contract: 0, wage: 0, value: 0, role: 'cantera',
    nt: { level: null, caps: 0, goals: 0, calledUp: false, streak: 0 },
    seasonStats: null, career: blankCareer(), history: [], trophies: [], awards: [],
    arcs: {}, flags: {}, legacy: 0, retired: false,
  };
  // Atributos de partida: media ~52-60 segun potencial
  const potential = rollPotential(opts.potBonus || 0);
  p.pot = potential;
  const target = clamp(46 + (potential - 70) * 0.34 + rf(-2, 3), 38, 66);
  const w = WEIGHTS[pos];
  list.forEach((a) => {
    const weight = w[a.key] || 0.04;
    // los atributos importantes de tu posicion nacen algo mas altos
    const v = target + (weight - 0.14) * 42 + rf(-5, 5);
    p.attrs[a.key] = clamp(Math.round(v), 25, 75);
  });
  // toque del jugador segun perfil elegido
  if (opts.archetype && ARCHETYPES[opts.archetype]) {
    const arc = ARCHETYPES[opts.archetype];
    for (const k in arc.mod) if (p.attrs[k] != null) p.attrs[k] = clamp(p.attrs[k] + arc.mod[k], 25, 80);
    if (arc.trait && !p.traits.includes(arc.trait)) p.traits.push(arc.trait);
  }
  p.ovr = computeOvr(p);
  p.value = playerValue(p);
  return p;
}

function blankCareer() {
  return {
    apps: 0, mins: 0, goals: 0, assists: 0, motm: 0, yellow: 0, red: 0,
    cs: 0, saves: 0, conceded: 0, seasons: 0, ntApps: 0, ntGoals: 0,
    trophies: 0, injuries: 0, ratingSum: 0, ratingN: 0,
  };
}

/* Perfiles de salida: dan personalidad a la partida desde el minuto uno */
const ARCHETYPES = {
  canterano:  { name: 'Canterano puro', icon: '🏠', desc: 'Formado en casa. La afición te quiere antes de debutar.', mod: { men: 4 }, trait: 'loyal' },
  talento:    { name: 'Talento precoz', icon: '✨', desc: 'Técnica por encima de la media para tu edad. Mucho ruido alrededor.', mod: { dri: 6, pas: 3, phy: -3 }, trait: 'wonderkid' },
  atleta:     { name: 'Bestia física', icon: '💪', desc: 'Cuerpo de adulto a los 16. Duro de tumbar.', mod: { phy: 7, pac: 4, dri: -3 }, trait: 'ironman' },
  cerebro:    { name: 'Cerebro', icon: '🧠', desc: 'Lees el partido antes de que pase.', mod: { men: 7, pas: 4, pac: -3 }, trait: null },
  callejero:  { name: 'Fútbol de barrio', icon: '🔥', desc: 'Te criaste en la calle. Descarado y con carácter.', mod: { dri: 5, sho: 3, men: -3, ref: 4 }, trait: 'hothead' },
  tardio:     { name: 'Sin pulir', icon: '🌱', desc: 'Empiezas peor que nadie, pero tu techo es otro.', mod: { sho: -4, dri: -4, pas: -4, def: -4, phy: -4, pac: -4, men: -4, ref: -4, pos: -4, han: -4, aer: -4, kic: -4 }, trait: 'latebloomer' },
};

/* ---------- Valor de mercado ----------
   Calibrado para que 90 de media ~150 M€, 80 ~40 M€, 70 ~7 M€, 60 ~0,6 M€.
   Luego pesan la edad, lo que te queda por crecer y lo conocido que seas. */
function playerValue(p) {
  const base = Math.pow(Math.max(0.6, (p.ovr - 40) / 10), 6) * 0.0096; // millones
  const ageF = p.age <= 17 ? 0.85 : p.age === 18 ? 1.1
    : p.age <= 21 ? 1.45 : p.age <= 25 ? 1.35 : p.age <= 28 ? 1.0
    : p.age <= 31 ? 0.62 : p.age <= 33 ? 0.3 : p.age <= 35 ? 0.15 : 0.05;
  const gap = Math.max(0, p.pot - p.ovr);
  const potF = p.age <= 21 ? Math.min(2.4, 1 + gap * 0.055)
    : p.age <= 25 ? Math.min(1.5, 1 + gap * 0.02) : 1;
  const repF = clamp(0.45 + p.rep / 70, 0.45, 1.6);
  return Math.max(0.02, base * ageF * potF * repF);
}
const fmtM = (v) => (v >= 100 ? Math.round(v) + ' M€' : v >= 10 ? v.toFixed(0) + ' M€' : v >= 1 ? v.toFixed(1) + ' M€' : Math.round(v * 1000) + ' K€');
const fmtWage = (v) => (v >= 1 ? v.toFixed(1) + ' M€/año' : Math.round(v * 1000) + ' K€/año');

/* ---------- Rol en el equipo ---------- */
function squadRole(p, club, compGap) {
  const gap = p.ovr - club.str;
  const young = p.age <= 19 ? -3.5 : p.age <= 21 ? -1.5 : 0;
  // si hay un companiero concreto en tu puesto, el manda tanto como el nivel del club
  const rival = compGap == null ? 0 : clamp(compGap * 0.45, -5, 5);
  const g = gap + young + rival + (p.trust - 55) / 14;
  if (g >= 7) return { key: 'star', name: 'Estrella del equipo', min: 0.92 };
  if (g >= 2.5) return { key: 'key', name: 'Titular indiscutible', min: 0.82 };
  if (g >= -1.5) return { key: 'starter', name: 'Titular', min: 0.68 };
  if (g >= -5) return { key: 'rot', name: 'Rotación', min: 0.45 };
  if (g >= -10) return { key: 'sub', name: 'Suplente', min: 0.22 };
  return { key: 'fringe', name: 'Descarte', min: 0.06 };
}

/* ---------- Nivel de estrella (para la UI) ---------- */
function ovrTier(o) {
  if (o >= 89) return 't-elite';
  if (o >= 83) return 't-star';
  if (o >= 75) return 't-good';
  return '';
}
function ovrLabel(o) {
  if (o >= 91) return 'Leyenda viva';
  if (o >= 87) return 'Clase mundial';
  if (o >= 82) return 'Estrella';
  if (o >= 77) return 'Muy bueno';
  if (o >= 71) return 'Solvente';
  if (o >= 64) return 'Prometedor';
  return 'En formación';
}

/* ---------- Nombres genericos (rivales, companeros) ---------- */
const NAME_POOL = {
  ESP: ['Iker','Marcos','Álvaro','Pablo','Sergio','Nico','Hugo','Dani','Jorge','Adri','Unai','Mateo','Rubén','Álex','Javi','Carlos','Diego','Aitor','Bruno','Gonzalo','Íñigo','Raúl','Manu','Óscar'],
  ENG: ['Jack','Harry','Callum','Reece','Tyler','Owen','Lewis','Kai','Ben','Josh','Alfie','Charlie','Dominic','Ethan','Finley','George','Jude','Leo','Mason','Oliver','Riley','Toby','Archie','Dylan'],
  FRA: ['Enzo','Théo','Lucas','Mattéo','Noah','Kylian','Amine','Rayan','Nathan','Ilan','Hugo','Léo','Gabin','Adam','Yanis','Maxence','Sacha','Ibrahim','Malo','Ousmane','Tom','Aaron','Éliott','Nolan'],
  BRA: ['Gabriel','Matheus','João','Vinícius','Rodrigo','Lucas','Pedro','Kaio','Estêvão','Wesley','Bruno','Caio','Davi','Enzo','Felipe','Guilherme','Igor','Murilo','Rafael','Thiago','Vitor','Yuri','Arthur','Léo'],
  ARG: ['Facundo','Thiago','Valentín','Santiago','Máximo','Julián','Alejo','Franco','Lautaro','Benjamín','Agustín','Bautista','Ciro','Dylan','Ezequiel','Gastón','Ignacio','Joaquín','Lisandro','Nahuel','Ramiro','Tomás','Bruno','Emiliano'],
  GER: ['Luca','Finn','Jonas','Noah','Elias','Til','Malik','Nico','Paul','Lennart','Ben','David','Emil','Felix','Jannik','Julian','Lars','Maximilian','Moritz','Niklas','Philipp','Tim','Yannick','Erik'],
  ITA: ['Matteo','Lorenzo','Alessandro','Riccardo','Giacomo','Simone','Andrea','Davide','Nicolò','Tommaso','Federico','Gabriele','Leonardo','Luca','Marco','Mattia','Pietro','Samuele','Stefano','Filippo','Emanuele','Cristian','Gianluca','Antonio'],
  DEF: ['Alex','Sam','Leo','Adam','Ryan','Omar','Yusuf','Nikola','Emre','Diego','Amir','Andrei','Denis','Filip','Ivan','Jakub','Karim','Luka','Marek','Mehmet','Milos','Petar','Stefan','Tomas'],
};
const SURNAME_POOL = {
  ESP: ['García','Martínez','López','Sánchez','Fernández','Ruiz','Moreno','Navarro','Ortega','Cabrera','Vidal','Serrano','Iglesias','Herrera','Molina','Castro','Peña','Guerrero','Bermejo','Sanz','Rojas','Alonso','Prieto','Cortés'],
  ENG: ['Wright','Hughes','Barnes','Doyle','Foster','Keane','Palmer','Wilson','Turner','Reid','Bennett','Carter','Dawson','Ellis','Fletcher','Gibson','Harper','Jennings','Lawson','Mercer','Norris','Preston','Shaw','Whitaker'],
  FRA: ['Diallo','Bernard','Lemaire','Traoré','Rousseau','Fofana','Guerin','Mbaye','Perrin','Sylla','Aubert','Bonnet','Cissé','Dubois','Fournier','Girard','Keita','Lambert','Marchand','Ndiaye','Renaud','Sarr','Vasseur','Chevalier'],
  BRA: ['Silva','Souza','Oliveira','Costa','Ribeiro','Santos','Almeida','Barbosa','Nunes','Teixeira','Cardoso','Duarte','Fonseca','Gomes','Lima','Machado','Moreira','Pereira','Rocha','Tavares','Vieira','Azevedo','Braga','Campos'],
  ARG: ['Gómez','Rodríguez','Álvarez','Domínguez','Ferreyra','Sosa','Medina','Ibarra','Quiroga','Bustos','Acosta','Benítez','Cáceres','Escobar','Figueroa','Gallardo','Luna','Maldonado','Ojeda','Paredes','Ramírez','Silvestre','Vera','Zárate'],
  GER: ['Müller','Schmidt','Wagner','Becker','Hofmann','Krüger','Neumann','Fischer','Weber','Lang','Bauer','Brandt','Engel','Frank','Günther','Hartmann','Keller','Lehmann','Meyer','Richter','Schäfer','Vogel','Winkler','Zimmermann'],
  ITA: ['Rossi','Ferrari','Esposito','Conti','Greco','Marchetti','Bruno','Villa','Rizzo','Gatti','Barone','Caputo','De Luca','Fabbri','Galli','Longo','Mancini','Neri','Orlando','Palumbo','Riva','Sartori','Testa','Vitale'],
  DEF: ['Nowak','Petrov','Kovač','Yilmaz','Andersen','Novák','Horvat','Aliyev','Hassan','Bakker','Berg','Christensen','Dimitrov','Eriksen','Farkas','Georgiev','Hansen','Jansen','Kaya','Larsen','Marković','Popescu','Simić','Varga'],
};
/* Para los países sin lista propia, nombre y apellido salen de la MISMA familia
   regional: si no, aparecen cosas como "Andrei Larsen" con bandera checa. */
const NAME_FAMILIES = {
  eslavo:   { f: ['Andrei','Denis','Filip','Ivan','Jakub','Luka','Marek','Milos','Petar','Stefan','Tomas','Nikola','Vlad','Bojan'],
              s: ['Nowak','Petrov','Kovač','Novák','Horvat','Marković','Popescu','Simić','Dimitrov','Georgiev','Varga','Farkas','Jurić','Stanković'] },
  nordico:  { f: ['Emil','Kasper','Mathias','Oskar','Rasmus','Viktor','Elias','Jonas','Henrik','Sander','Even','Alfons'],
              s: ['Andersen','Christensen','Eriksen','Hansen','Larsen','Berg','Nilsen','Lindqvist','Dahl','Sørensen','Bakke','Holm'] },
  turco:    { f: ['Emre','Mehmet','Kaan','Arda','Burak','Cenk','Halil','Ozan','Yusuf','Berkay','Kerem','Umut'],
              s: ['Yilmaz','Kaya','Demir','Şahin','Çelik','Aydın','Öztürk','Arslan','Doğan','Kılıç','Aslan','Koç'] },
  arabe:    { f: ['Omar','Karim','Amir','Youssef','Bilal','Hamza','Tarek','Rami','Ziad','Nabil','Sami','Anas'],
              s: ['Hassan','Nasser','Haddad','Mansour','Aziz','Barakat','Khalil','Saleh','Rahmani','Chahine','Tahir','Amrani'] },
  africano: { f: ['Ibrahim','Moussa','Cheikh','Lamine','Sekou','Bakary','Kwame','Chidi','Musa','Abdoulaye','Serge','Emeka'],
              s: ['Traoré','Diallo','Ndiaye','Keita','Sarr','Kone','Mensah','Okonkwo','Camara','Bamba','Owusu','Nwankwo'] },
  neerland: { f: ['Daan','Sven','Ruben','Bram','Thijs','Jesse','Stijn','Lars','Joris','Timo'],
              s: ['Bakker','Jansen','De Vries','Van Dijk','Visser','Meijer','Smit','Bos','Kuiper','Van Leeuwen'] },
  asiatico: { f: ['Sota','Ren','Haruto','Minjun','Jihoon','Kenta','Riku','Seojun','Yuto','Daiki'],
              s: ['Tanaka','Sato','Yamamoto','Kim','Park','Lee','Nakamura','Watanabe','Choi','Ito'] },
};
/* Qué familia le toca a cada país sin lista propia */
const COUNTRY_FAMILY = {
  NED: 'neerland', BEL: 'neerland', SUR: 'neerland', CUW: 'neerland',
  TUR: 'turco', AZE: 'turco', KAZ: 'turco', UZB: 'turco',
  MAR: 'arabe', ALG: 'arabe', TUN: 'arabe', EGY: 'arabe', LBY: 'arabe', KSA: 'arabe',
  QAT: 'arabe', UAE: 'arabe', IRQ: 'arabe', JOR: 'arabe', SYR: 'arabe', LBN: 'arabe', PLE: 'arabe',
  JPN: 'asiatico', KOR: 'asiatico', CHN: 'asiatico', VIE: 'asiatico', THA: 'asiatico',
  DEN: 'nordico', NOR: 'nordico', SWE: 'nordico', FIN: 'nordico', ISL: 'nordico', FRO: 'nordico',
};
function randomName(cc) {
  if (NAME_POOL[cc]) return pick(NAME_POOL[cc]) + ' ' + pick(SURNAME_POOL[cc]);
  const country = COUNTRY_BY_CODE[cc];
  let key = COUNTRY_FAMILY[cc];
  if (!key && country) {
    key = country.confed === 'CAF' ? 'africano'
      : country.confed === 'AFC' ? 'arabe'
        : country.confed === 'UEFA' ? 'eslavo' : null;
  }
  // El resto de América habla español: tira de la lista argentina
  if (!key && country && (country.confed === 'CONMEBOL' || country.confed === 'CONCACAF')) {
    return pick(NAME_POOL.ARG) + ' ' + pick(SURNAME_POOL.ARG);
  }
  const fam = NAME_FAMILIES[key];
  if (fam) return pick(fam.f) + ' ' + pick(fam.s);
  return pick(NAME_POOL.DEF) + ' ' + pick(SURNAME_POOL.DEF);
}

/* ---------- Fase de eliminatoria alcanzada ---------- */
function roundFromRoll(x) {
  for (const [t, n] of ROUND_NAMES) if (x <= t) return n;
  return 'fase de grupos';
}

/* Frase natural para una eliminatoria que NO se ha ganado.
   `hasGroups` distingue las competiciones con fase de grupos de las copas a partido único. */
function roundPhrase(x, hasGroups) {
  const r = roundFromRoll(x);
  if (r === 'campeón' || r === 'subcampeón') return 'perdéis la final';
  if (r === 'fase de grupos') return hasGroups ? 'os quedáis en la fase de grupos' : 'os eliminan en las primeras rondas';
  return 'caéis en ' + r;
}
/* Como termina una seleccion en un torneo, en frase corregida */
function stagePhrase(stage) {
  return stage.indexOf('eliminad') === 0 ? 'queda ' + stage : 'termina como ' + stage;
}
