/* ============================================================
   CREACION DE PERSONAJE
   ============================================================ */

const NEW = { country: null, pos: null, arch: null, perk: 'none', challenge: null,
  legendMode: false, legendClub: null, clubFilter: '',
  firstName: '', lastName: '', shirtName: '', number: 10, foot: 'Derecho', filter: '' };
const START_YEAR = 2025;

function brand() {
  return `<div class="brand">
    <div class="brand-logo">⚽</div>
    <div class="grow">
      <h1>EL CAMINO</h1>
      <div class="tiny">Simulador de carrera futbolística</div>
    </div>
  </div>`;
}

/* ---------- Menu principal ---------- */
function screenHome() {
  const meta = loadMeta();
  const cont = hasSave();
  const perkInfo = unlockedPerks(meta);
  screen(`${brand()}
  <div class="card">
    <h2 style="font-size:26px;margin-bottom:8px">Tienes 16 años y una decisión que tomar.</h2>
    <p class="dim">Elige de dónde vienes, quién eres y a dónde vas. Firma tu primer contrato, pelea por los minutos,
    aguanta las lesiones, gánate a la afición y llega tan lejos como te dejen la suerte y el talento.
    Cada carrera es distinta. Casi nadie llega arriba.</p>
    <div class="grid g3 mt" style="gap:8px">
      ${stat(CLUBS.length, 'Clubes')}
      ${stat(Object.keys(LEAGUES).length, 'Ligas')}
      ${stat(COUNTRIES.length, 'Selecciones')}
    </div>
    <div class="col mt">
      ${cont ? `<button class="btn primary wide" data-act="continue">▶️ Continuar carrera</button>` : ''}
      <button class="btn ${cont ? '' : 'primary'} wide" data-act="newCareer">${cont ? '🔁 Empezar una carrera nueva' : '⚽ Empezar mi carrera'}</button>
      <button class="btn wide" data-act="dailyScreen">🎯 Reto del día${todayDone(meta) ? ' · jugado' : ''}</button>
      <button class="btn wide" data-act="legendScreen">🏛️ Modo Leyenda de club</button>
      ${meta.hall.length ? `<button class="btn ghost wide" data-act="hall">🏛️ Sala de leyendas (${meta.hall.length})</button>` : ''}
      ${perkInfo.total > 0 ? `<button class="btn ghost wide" data-act="perksScreen">🎁 Ventajas (${perkInfo.list.filter((x) => x.unlocked).length - 1} desbloqueadas)</button>` : ''}
    </div>
  </div>
  <div class="card">
    <div class="tiny">Cómo funciona</div>
    <div class="grid g2 mt-s" style="gap:8px">
      ${miniCard('🌍', 'Tu país lo cambia todo', 'De dónde eres decide qué puertas se te abren con 16 años y lo difícil que será ser internacional.')}
      ${miniCard('📈', 'Media dinámica', 'Empiezas bajo, creces con minutos y rendimiento, tocas techo sobre los 28-30 y luego caes.')}
      ${miniCard('🎲', 'Todo es probabilidad', 'Goles, títulos, lesiones, Balón de Oro. Nada está garantizado.')}
      ${miniCard('🎭', 'Decisiones que pesan', 'Eventos, momentos clave y tramas que duran temporadas.')}
    </div>
  </div>`);
}
/* ---------- Reto del día ----------
   Mismas condiciones y misma semilla para todo el mundo ese día: lo único que
   cambia el resultado son tus decisiones. Al terminar sale una tarjeta de texto
   para pegar en el grupo y picarse. */
function todayDone(meta) {
  const d = meta.daily || {};
  return d.key === todayKey();
}
ACTIONS.dailyScreen = () => {
  const meta = loadMeta();
  const ch = dailyChallenge(todayKey());
  const prev = (meta.daily && meta.daily.key === ch.key) ? meta.daily : null;
  const d = String(ch.key);
  screen(`${brand()}
  <div class="card" style="border-color:#4a3f1a;background:linear-gradient(160deg,#1b1608,#0a1119)">
    <div class="tiny" style="color:var(--gold)">Reto del ${d.slice(6, 8)}/${d.slice(4, 6)}</div>
    <h2 style="font-size:24px;margin:6px 0 8px">El mismo punto de partida para todos</h2>
    <p class="dim small">Hoy, cualquiera que juegue este reto empieza exactamente igual que tú: mismo país,
    misma posición, mismo perfil y la misma suerte. Lo único que va a marcar la diferencia entre tu carrera
    y la de tus amigos son las decisiones que toméis. Al terminar te doy una tarjeta para mandarles.</p>
    <div class="grid g2 mt" style="gap:8px">
      ${miniCard(ch.country.flag, ch.country.name, 'Tu nacionalidad de hoy')}
      ${miniCard('🎽', POS_BY_KEY[ch.pos].name, 'Tu posición')}
      ${miniCard(ARCHETYPES[ch.arch].icon, ARCHETYPES[ch.arch].name, ARCHETYPES[ch.arch].desc)}
      ${miniCard('🎲', ch.twist.name, ch.twist.desc)}
    </div>
    <div class="sub mt">
      <div class="tiny">Objetivo del reto</div>
      <div class="b" style="font-size:17px;margin-top:4px">🏁 ${esc(ch.goal.name)}</div>
      <div class="small dim2 mt-s">Cumplirlo multiplica tu puntuación final por 1,5.</div>
    </div>
    ${prev ? `<div class="sub mt"><div class="tiny">Tu mejor intento de hoy</div>
      <div class="row between mt-s"><span class="b gold" style="font-size:19px">${prev.best} puntos</span>
      <span class="small dim">${esc(prev.rank || '')}</span></div></div>` : ''}
  </div>
  <div class="actionbar col" style="gap:8px">
    <button class="btn primary wide" data-act="startDaily">🎯 Jugar el reto de hoy</button>
    <button class="btn ghost wide" data-act="home">Volver</button>
  </div>`);
};
ACTIONS.startDaily = () => {
  if (hasSave() && !confirm('Esto borrará tu carrera guardada. ¿Seguro?')) return;
  clearSave();
  const ch = dailyChallenge(todayKey());
  seedRng(ch.seed);                       // a partir de aquí, todos vivimos lo mismo
  NEW.country = ch.country.code; NEW.pos = ch.pos; NEW.arch = ch.arch;
  NEW.perk = 'none'; NEW.challenge = ch; NEW.legendMode = false; NEW.legendClub = null;
  NEW.firstName = ''; NEW.lastName = ''; NEW.shirtName = ''; NEW.number = 10;
  screenIdentity();
};

/* ---------- Modo Leyenda de club ----------
   Eliges el club de tu vida antes de empezar, naces en su cantera y toda la
   carrera se mide por lo que dejes ahí. El juego te va a tentar con ofertas
   mejores: resistirse es justo la gracia del modo. */
ACTIONS.legendScreen = () => {
  const f = (NEW.clubFilter || '').toLowerCase().trim();
  const list = CLUBS.filter((c) => LEAGUES[c.league] && (!f
    || c.name.toLowerCase().includes(f)
    || LEAGUES[c.league].name.toLowerCase().includes(f)))
    .sort((a, b) => b.prestige - a.prestige).slice(0, 60);
  screen(`${brand()}
  <div class="card">
    <h2>🏛️ Modo Leyenda de club</h2>
    <p class="dim small">Elige el club de tu vida. Empiezas en su cantera y tu carrera se juzga por lo que
    dejes ahí: partidos, goles, títulos y años con esa camiseta. Te van a llover ofertas mejores;
    quedarte es la mitad del reto.</p>
    <input class="input mt-s" data-inp="filterClub" placeholder="Buscar club o liga…" value="${esc(NEW.clubFilter || '')}" autocomplete="off">
    <div class="scroller mt">
      <div class="grid autowide">
        ${list.map((c) => `<button class="pick ${NEW.legendClub === c.id ? 'on' : ''}" data-act="pickLegendClub" data-id="${c.id}">
          ${crestSVG(c, 'crest-md')}
          <span class="grow" style="min-width:0"><span class="nm" style="display:block">${esc(c.name)}</span>
          <span class="small dim2">${COUNTRY_BY_CODE[c.country].flag} ${esc(LEAGUES[c.league].name)}</span></span>
        </button>`).join('')}
      </div>
      ${list.length ? '' : '<p class="dim tc mt">Ningún club coincide.</p>'}
    </div>
  </div>
  <div class="actionbar row" style="gap:10px">
    <button class="btn ghost" data-act="home">Volver</button>
    <button class="btn primary grow" data-act="startLegend" ${NEW.legendClub ? '' : 'disabled'}>Empezar aquí</button>
  </div>`);
};
ACTIONS.filterClub = (d, n) => {
  NEW.clubFilter = n.value;
  const pos = n.selectionStart;
  keepScrollOnce();
  ACTIONS.legendScreen();
  const inp = document.querySelector('[data-inp="filterClub"]');
  if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (e) {} }
};
ACTIONS.pickLegendClub = (d) => { NEW.legendClub = d.id; keepScrollOnce(); ACTIONS.legendScreen(); };
ACTIONS.startLegend = () => {
  if (hasSave() && !confirm('Esto borrará tu carrera guardada. ¿Seguro?')) return;
  clearSave();
  const club = getClub(NEW.legendClub);
  if (!club) return;
  NEW.challenge = null;
  NEW.country = club.country;
  NEW.pos = null; NEW.arch = null; NEW.perk = 'none';
  NEW.firstName = ''; NEW.lastName = ''; NEW.shirtName = ''; NEW.number = 10;
  NEW.legendMode = true;
  screenPosition();
};

/* ---------- Ventajas desbloqueables ---------- */
ACTIONS.perksScreen = () => {
  const meta = loadMeta();
  const info = unlockedPerks(meta);
  screen(`${brand()}
  <div class="card">
    <h2>🎁 Ventajas</h2>
    <p class="dim small">Cada carrera que terminas suma legado, y el legado acumulado desbloquea ventajas
    con las que empezar la siguiente. Llevas <b class="gold">${info.total}</b> de legado acumulado.</p>
    <div class="col mt">
      ${info.list.filter((x) => x.id !== 'none').map((x) => `<div class="sub row" style="gap:11px;${x.unlocked ? '' : 'opacity:.45'}">
        <span style="font-size:20px">${x.unlocked ? x.icon : '🔒'}</span>
        <div class="grow"><div class="b small">${esc(x.name)}</div>
        <div class="small dim2">${esc(x.desc)}</div></div>
        ${x.unlocked ? chip('Disponible', 'on') : chip(x.need + ' legado', '')}
      </div>`).join('')}
    </div>
  </div>
  <div class="actionbar"><button class="btn wide" data-act="home">Volver</button></div>`);
};

function miniCard(ic, t, d) {
  return `<div class="sub"><div style="font-size:20px">${ic}</div><div class="b" style="margin:4px 0 2px">${t}</div><div class="small dim">${d}</div></div>`;
}
ACTIONS.newCareer = () => { if (hasSave() && !confirm('Esto borrará tu carrera guardada. ¿Seguro?')) return; clearSave(); NEW.country = null; NEW.pos = null; NEW.arch = null; NEW.challenge = null; NEW.perk = 'none'; NEW.legendMode = false; NEW.legendClub = null; screenCountry(); };
ACTIONS.continue = () => { const G = loadGame(); if (!G) { alert('No se ha podido cargar la partida.'); return; } window.G = G; renderStep(); };
ACTIONS.home = () => screenHome();

/* ---------- Paso 1: pais ---------- */
function steps(n) {
  return `<div class="steps">${[1, 2, 3, 4].map((i) => `<div class="step ${i <= n ? 'on' : ''}"></div>`).join('')}</div>`;
}
function screenCountry() {
  const f = NEW.filter.toLowerCase().trim();
  const list = COUNTRIES.filter((c) => !f || c.name.toLowerCase().includes(f) || c.code.toLowerCase().includes(f));
  const byConfed = {};
  list.forEach((c) => { (byConfed[c.confed] = byConfed[c.confed] || []).push(c); });
  const CONF_NAME = { UEFA: 'Europa', CONMEBOL: 'Sudamérica', CONCACAF: 'Norte y Centroamérica', CAF: 'África', AFC: 'Asia', OFC: 'Oceanía' };
  screen(`${brand()}${steps(1)}
  <div class="card">
    <h2>¿De dónde eres?</h2>
    <p class="dim small">Tu nacionalidad decide los colores de tu equipación, qué clubes te van a mirar con 16 años
    y lo difícil que será vestir la camiseta de tu selección.</p>
    <input class="input mt-s" data-inp="filterCountry" placeholder="Buscar país…" value="${esc(NEW.filter)}" autocomplete="off">
    <div class="scroller mt">
      ${Object.keys(byConfed).map((k) => `
        <div class="tiny" style="margin:12px 0 7px">${CONF_NAME[k] || k}</div>
        <div class="grid auto">
          ${byConfed[k].map((c) => `
            <button class="pick ${NEW.country === c.code ? 'on' : ''}" data-act="pickCountry" data-code="${c.code}">
              <span class="flag">${c.flag}</span>
              <span class="grow" style="min-width:0"><span class="nm" style="display:block">${esc(c.name)}</span>
              <span class="small dim2">${ntDifficultyLabel(c.tier)}</span></span>
            </button>`).join('')}
        </div>`).join('')}
      ${list.length ? '' : '<p class="dim tc mt">Ningún país coincide con esa búsqueda.</p>'}
    </div>
  </div>
  <div class="actionbar row" style="gap:10px">
    <button class="btn ghost" data-act="home">Atrás</button>
    <button class="btn primary grow" data-act="toPos" ${NEW.country ? '' : 'disabled'}>Continuar</button>
  </div>`);
}
function ntDifficultyLabel(tier) {
  return ['Selección de élite', 'Selección top', 'Selección fuerte', 'Selección media', 'Selección modesta', 'Selección humilde'][tier - 1];
}
ACTIONS.filterCountry = (d, n) => {
  NEW.filter = n.value;
  const pos = n.selectionStart;
  keepScrollOnce();
  screenCountry();
  const inp = document.querySelector('[data-inp="filterCountry"]');
  if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (e) {} }
};
ACTIONS.pickCountry = (d) => { NEW.country = d.code; keepScrollOnce(); screenCountry(); };
ACTIONS.toPos = () => screenPosition();

/* ---------- Paso 2: posicion ---------- */
function screenPosition() {
  const c = COUNTRY_BY_CODE[NEW.country];
  const lines = ['Portería', 'Defensa', 'Medio', 'Ataque'];
  screen(`${brand()}${steps(2)}
  <div class="card">
    <div class="row between">
      <h2>¿En qué posición juegas?</h2>
      <span style="font-size:24px">${c.flag}</span>
    </div>
    <p class="dim small">El portero tiene su propia hoja de estadísticas: paradas, goles encajados y porterías a cero.
    Un delantero vive de los goles; un central, de otras cosas.</p>
    ${lines.map((ln) => `
      <div class="tiny" style="margin:14px 0 7px">${ln}</div>
      <div class="grid auto">
        ${POSITIONS.filter((p) => p.line === ln).map((p) => `
          <button class="pick ${NEW.pos === p.key ? 'on' : ''}" data-act="pickPos" data-key="${p.key}">
            <span class="flag" style="font-size:15px;font-weight:900;width:34px;text-align:center">${p.short}</span>
            <span class="grow" style="min-width:0"><span class="nm" style="display:block">${p.name}</span>
            <span class="small dim2">${p.key === 'GK' ? 'Paradas y porterías a cero' : `~${p.g.toFixed(2)} goles y ${p.a.toFixed(2)} asist. por partido de referencia`}</span></span>
          </button>`).join('')}
      </div>`).join('')}
  </div>
  <div class="actionbar row" style="gap:10px">
    <button class="btn ghost" data-act="${NEW.legendMode ? 'legendScreen' : 'toCountry'}">Atrás</button>
    <button class="btn primary grow" data-act="toArch" ${NEW.pos ? '' : 'disabled'}>Continuar</button>
  </div>`);
}
ACTIONS.pickPos = (d) => { NEW.pos = d.key; keepScrollOnce(); screenPosition(); };
ACTIONS.toCountry = () => screenCountry();
ACTIONS.toArch = () => screenArchetype();

/* ---------- Paso 3: perfil ---------- */
function screenArchetype() {
  screen(`${brand()}${steps(3)}
  <div class="card">
    <h2>¿Qué clase de chaval eres?</h2>
    <p class="dim small">Esto define tus atributos de salida y, en algunos casos, un rasgo que te va a acompañar toda la carrera.
    No cambia tu techo: eso ya está escrito y no lo sabes.</p>
    <div class="grid autowide mt">
      ${Object.keys(ARCHETYPES).map((k) => {
        const a = ARCHETYPES[k];
        return `<button class="opt ${NEW.arch === k ? 'on' : ''}" data-act="pickArch" data-key="${k}" style="${NEW.arch === k ? 'border-color:var(--acc);background:#0f2419' : ''}">
          <div class="row" style="gap:9px"><span style="font-size:20px">${a.icon}</span><span class="t">${a.name}</span></div>
          <div class="d" style="margin-top:5px">${a.desc}</div>
          ${a.trait ? `<div class="meta">${chip(TRAITS[a.trait].icon + ' ' + TRAITS[a.trait].name, TRAITS[a.trait].bad ? 'bad' : 'on')}</div>` : ''}
        </button>`;
      }).join('')}
    </div>
  </div>
  ${perkSection()}
  <div class="actionbar row" style="gap:10px">
    <button class="btn ghost" data-act="toPos">Atrás</button>
    <button class="btn primary grow" data-act="toIdentity" ${NEW.arch ? '' : 'disabled'}>Continuar</button>
  </div>`);
}
function perkSection() {
  const info = unlockedPerks(loadMeta());
  const avail = info.list.filter((x) => x.unlocked);
  if (avail.length <= 1) return '';
  return `<div class="card">
    <div class="tiny">Ventajas desbloqueadas</div>
    <h3 style="margin:3px 0 8px">¿Empiezas con algo de ventaja?</h3>
    <p class="small dim2">Te lo has ganado con carreras anteriores. Solo puedes elegir una.</p>
    <div class="grid autowide mt-s">
      ${avail.map((x) => `<button class="pick ${(NEW.perk || 'none') === x.id ? 'on' : ''}" data-act="pickPerk" data-key="${x.id}">
        <span class="flag">${x.icon}</span>
        <span class="grow" style="min-width:0"><span class="nm" style="display:block">${esc(x.name)}</span>
        <span class="small dim2">${esc(x.desc)}</span></span>
      </button>`).join('')}
    </div>
  </div>`;
}
ACTIONS.pickPerk = (d) => { NEW.perk = d.key; keepScrollOnce(); screenArchetype(); };
ACTIONS.pickArch = (d) => { NEW.arch = d.key; keepScrollOnce(); screenArchetype(); };
ACTIONS.toIdentity = () => screenIdentity();

/* ---------- Paso 4: nombre, dorsal y equipacion ---------- */
function screenIdentity() {
  const c = COUNTRY_BY_CODE[NEW.country];
  const kit = c.kit;
  const nm = NEW.shirtName || NEW.lastName || 'TU NOMBRE';
  screen(`${brand()}${steps(4)}
  ${NEW.challenge ? `<div class="card" style="border-color:#5b4a1a;background:#191507;padding:12px">
    <div class="row between"><span class="tiny" style="color:var(--gold)">🎯 Reto del día</span>
    <span class="small b">${esc(NEW.challenge.goal.name)}</span></div>
  </div>` : ''}
  <div class="card">
    <h2>Tu camiseta</h2>
    <p class="dim small">Con los colores de ${c.flag} ${esc(c.name)}. Así te van a ver los aficionados durante los próximos veinte años.</p>
    <div class="kitwrap mt">${kitSVG(kit.shirt, kit.trim, kit.ink, nm, NEW.number)}</div>
    <div class="grid g2 mt" style="gap:10px">
      <div class="field"><label class="tiny">Nombre</label>
        <input class="input" data-inp="setFirst" value="${esc(NEW.firstName)}" placeholder="Álvaro" maxlength="16"></div>
      <div class="field"><label class="tiny">Apellido</label>
        <input class="input" data-inp="setLast" value="${esc(NEW.lastName)}" placeholder="Ortega" maxlength="18"></div>
      <div class="field"><label class="tiny">Nombre en la camiseta</label>
        <input class="input" data-inp="setShirt" value="${esc(NEW.shirtName)}" placeholder="${esc(NEW.lastName || 'ORTEGA')}" maxlength="12"></div>
      <div class="field"><label class="tiny">Dorsal</label>
        <input class="input mono" data-inp="setNum" type="number" min="1" max="99" value="${NEW.number}"></div>
    </div>
    <div class="row wrap mt" style="gap:8px">
      <span class="tiny" style="align-self:center">Pie bueno</span>
      ${['Derecho', 'Izquierdo', 'Ambidiestro'].map((f) => `<button class="btn sm ${NEW.foot === f ? 'primary' : 'ghost'}" data-act="setFoot" data-f="${f}">${f}</button>`).join('')}
      <button class="btn sm ghost" data-act="randomName">🎲 Nombre al azar</button>
    </div>
  </div>
  <div class="actionbar row" style="gap:10px">
    <button class="btn ghost" data-act="${NEW.challenge ? 'home' : 'toArch'}">${NEW.challenge ? 'Salir' : 'Atrás'}</button>
    <button class="btn primary grow" data-act="createChar" ${NEW.firstName.trim() && NEW.lastName.trim() ? '' : 'disabled'}>Firmar mi primer contrato</button>
  </div>`);
}
function liveKit() {
  const c = COUNTRY_BY_CODE[NEW.country];
  const w = document.querySelector('.kitwrap');
  if (w) w.innerHTML = kitSVG(c.kit.shirt, c.kit.trim, c.kit.ink, NEW.shirtName || NEW.lastName || 'TU NOMBRE', NEW.number);
  const btn = document.querySelector('[data-act="createChar"]');
  if (btn) btn.disabled = !(NEW.firstName.trim() && NEW.lastName.trim());
}
ACTIONS.setFirst = (d, n) => { NEW.firstName = n.value; liveKit(); };
ACTIONS.setLast = (d, n) => { NEW.lastName = n.value; liveKit(); };
ACTIONS.setShirt = (d, n) => { NEW.shirtName = n.value; liveKit(); };
ACTIONS.setNum = (d, n) => { NEW.number = clamp(parseInt(n.value, 10) || 1, 1, 99); liveKit(); };
ACTIONS.setFoot = (d) => { NEW.foot = d.f; keepScrollOnce(); screenIdentity(); };
ACTIONS.randomName = () => {
  const nm = randomName(NEW.country).split(' ');
  NEW.firstName = nm[0]; NEW.lastName = nm.slice(1).join(' '); NEW.shirtName = '';
  screenIdentity();
};

/* ---------- Crear y elegir destino ---------- */
ACTIONS.createChar = () => {
  const p = createPlayer({
    firstName: NEW.firstName.trim(), lastName: NEW.lastName.trim(), shirtName: NEW.shirtName.trim(),
    number: NEW.number, pos: NEW.pos, country: NEW.country, foot: NEW.foot,
    archetype: NEW.arch, startYear: START_YEAR,
  });
  p.money = 0; p.legacyExtra = 0; p.peakOvr = p.ovr;
  if (NEW.perk && NEW.perk !== 'none') applyPerk(p, NEW.perk);
  p.peakOvr = p.ovr;
  window.G = {
    seasonStart: START_YEAR, player: p, club: null, world: {}, mods: freshMods(),
    objectives: [], step: 'start', queue: [], seasonFeed: [],
    challenge: NEW.challenge || null,
  };
  computeEuroSpots(G);
  if (NEW.legendMode && NEW.legendClub) {
    const club = getClub(NEW.legendClub);
    G.legendClubId = club.id;
    const useAcademy = club.str >= 60;
    G.startOptions = [{
      kind: useAcademy ? 'academy' : 'first',
      club: useAcademy ? academyOf(club) : club, parent: useAcademy ? club : null,
      title: (useAcademy ? 'Cantera del ' : '') + club.name,
      desc: 'El club de tu vida. Aquí empieza y, si aguantas las tentaciones, aquí acaba.',
      pros: ['Es tu casa', 'Toda la afición contigo'], cons: ['Vas a tener ofertas mejores'],
      dev: useAcademy ? 1.12 : 1.0, minsMod: useAcademy ? 0.8 : 1.1,
    }];
  } else {
    G.startOptions = applyTwist(G, startingOptions(G));
  }
  screenStart();
};

/* La condición especial del reto recorta las puertas de salida */
function applyTwist(G, opts) {
  const ch = G.challenge;
  if (!ch || ch.twist.id === 'none') return opts;
  const home = G.player.country;
  let out = opts;
  if (ch.twist.id === 'home') out = opts.filter((o) => (o.parent || o.club).country === home);
  else if (ch.twist.id === 'exile') out = opts.filter((o) => (o.parent || o.club).country !== home);
  else if (ch.twist.id === 'hard') {
    const worst = opts.slice().sort((a, b) => a.club.str - b.club.str)[0];
    out = worst ? [worst] : opts;
  }
  return out.length ? out : opts;
}

function screenStart() {
  const p = G.player;
  const c = COUNTRY_BY_CODE[p.country];
  screen(`${brand()}
  <div class="card">
    <div class="row between wrap" style="gap:12px">
      <div>
        <div class="tiny">Verano de ${START_YEAR}</div>
        <h2 style="font-size:22px">${esc(displayName(p))} ${c.flag}</h2>
        <div class="small dim">${POS_BY_KEY[p.pos].name} · 16 años · pie ${p.foot.toLowerCase()}</div>
      </div>
      <div class="ovr ${ovrTier(p.ovr)}"><b>${p.ovr}</b><span class="tiny">MEDIA</span></div>
    </div>
    <div class="stats mt">
      ${attrsFor(p.pos).map((a) => stat(Math.round(p.attrs[a.key]), a.name)).join('')}
    </div>
    ${p.traits.length ? `<div class="row wrap mt-s" style="gap:6px">${p.traits.map((t) => chip(TRAITS[t].icon + ' ' + TRAITS[t].name, TRAITS[t].bad ? 'bad' : 'on')).join('')}</div>` : ''}
  </div>
  <div class="card">
    <h3>Tres puertas</h3>
    <p class="dim small">Tres clubes te han hecho una propuesta este verano. La que elijas condiciona todo lo que venga después:
    los minutos que vas a tener, lo rápido que vas a crecer y quién te va a ver jugar.</p>
    <div class="col mt">
      ${G.startOptions.map((o, i) => {
        const cl = o.parent || o.club;
        const lg = LEAGUES[cl.league];
        const cc = COUNTRY_BY_CODE[cl.country];
        return `<button class="opt" data-act="chooseStart" data-i="${i}">
          <div class="row" style="gap:11px">
            ${crestSVG(cl, 'crest-lg')}
            <div class="grow" style="min-width:0">
              <div class="t">${esc(o.title)}</div>
              <div class="small dim2">${cc.flag} ${lg ? esc(lg.name) : ''} · nivel de plantilla ${o.club.str}</div>
              <div class="d" style="margin-top:5px">${esc(o.desc)}</div>
              <div class="meta">
                ${o.pros.map((x) => chip('✓ ' + x, 'on')).join('')}
                ${o.cons.map((x) => chip('✕ ' + x, 'bad')).join('')}
              </div>
            </div>
          </div>
        </button>`;
      }).join('')}
    </div>
  </div>`);
}
ACTIONS.chooseStart = (d) => {
  const o = G.startOptions[+d.i];
  G.club = o.club;
  G.player.contract = o.kind === 'academy' ? 3 : 2;
  G.player.wage = wageFor(o.club, G.player, 'sub') * (o.kind === 'academy' ? 0.3 : 0.7);
  G.player.startMinsMod = o.minsMod; G.player.startDev = o.dev;
  G.startOptions = null;
  G.player.history.push({ season: seasonLabel(G), club: o.club.name, note: 'Ficha por ' + o.club.name });
  startSeason(G, true);
};
