/* ============================================================
   VESTUARIO: companieros con nombre que envejecen, crecen y se van
   ============================================================
   No son plantillas reales (eso quedaria obsoleto en un mes y no aporta
   a la simulacion), pero si un vestuario coherente con el nivel del club:
   te da un rival concreto por el puesto en vez de un numero abstracto. */

/* Nombres ya ocupados: los del vestuario mas el apellido del propio jugador,
   para que no acaben cuatro Ortega en la misma plantilla */
function takenNames(G) {
  const t = new Set();
  if (G && G.player) t.add(displayName(G.player));
  return t;
}

/* Reparto de la plantilla por lineas */
const SQUAD_SHAPE = [
  ['GK', 3], ['CB', 4], ['LB', 2], ['RB', 2],
  ['DM', 2], ['CM', 3], ['AM', 2], ['LW', 2], ['RW', 2], ['ST', 3],
];

/* Nacionalidad de un fichaje: casi siempre local, y cuanto mas grande el club, mas extranjeros */
function squadNationality(club) {
  const local = COUNTRY_BY_CODE[club.country];
  const foreignChance = clamp((club.str - 52) / 90, 0.05, 0.62);
  if (!chance(foreignChance)) return local ? local.code : 'ESP';
  const pool = COUNTRIES.filter((c) => c.code !== club.country && c.tier <= 5);
  return pick(pool).code;
}

function makeTeammate(club, pos, ovrTarget, ageHint, taken) {
  const cc = squadNationality(club);
  const age = ageHint != null ? ageHint : clamp(Math.round(gauss(25.5, 4.2, 17, 37)), 17, 37);
  // los jovenes de la plantilla estan por debajo de su techo, los veteranos ya han caido
  let ovr = ovrTarget;
  if (age <= 20) ovr -= ri(3, 9);
  else if (age >= 33) ovr -= ri(1, 5);
  // un vestuario con cuatro jugadores del mismo apellido canta muchísimo
  let name = randomName(cc);
  for (let t = 0; t < 25 && taken && taken.has(name); t++) name = randomName(cc);
  if (taken) taken.add(name);
  return {
    name, country: cc, pos,
    ovr: clamp(Math.round(ovr), 38, 95),
    pot: clamp(Math.round(ovr + (age <= 21 ? ri(4, 14) : age <= 25 ? ri(0, 6) : 0)), 40, 97),
    age,
  };
}

/* Construye una plantilla acorde al nivel del club */
function buildSquad(G, club) {
  const base = club.str;
  const squad = [];
  const taken = takenNames(G);
  SQUAD_SHAPE.forEach(([pos, n]) => {
    for (let i = 0; i < n; i++) {
      // El titular de cada puesto ronda el nivel del club, a veces por encima y a veces
      // por debajo. Así el puesto que te toca varía de club en club en vez de ser
      // siempre un muro: parte de la gracia es caer donde hay hueco.
      const target = base + (i === 0 ? rf(-2, 3.5) : i === 1 ? rf(-5, 0) : rf(-11, -4));
      squad.push(makeTeammate(club, pos, target, null, taken));
    }
  });
  squad.sort((a, b) => b.ovr - a.ovr);
  return squad;
}

/* Quien te disputa el puesto: el mejor companiero de tu posicion */
function competitorFor(G) {
  const p = G.player;
  const squad = G.squad || [];
  const same = squad.filter((t) => t.pos === p.pos);
  if (!same.length) return null;
  return same.reduce((a, b) => (b.ovr > a.ovr ? b : a));
}

/* Un anio mas para todo el vestuario */
function ageSquad(G, club) {
  const out = [];
  const taken = takenNames(G);
  (G.squad || []).forEach((t) => taken.add(t.name));
  (G.squad || []).forEach((t) => {
    t.age++;
    // crecen o caen como el jugador, pero mas simple
    if (t.age <= 28) t.ovr = clamp(t.ovr + Math.max(0, Math.round((t.pot - t.ovr) * rf(0.1, 0.32))), 38, 97);
    else if (t.age >= 31) t.ovr = clamp(t.ovr - Math.round((t.age - 30) * rf(0.4, 1.3)), 30, 97);
    // se retiran o los traspasan
    const leaves = t.age >= 38 || (t.age >= 35 && chance(0.35)) || chance(0.16);
    if (!leaves) out.push(t);
  });
  // fichajes para rellenar los huecos
  SQUAD_SHAPE.forEach(([pos, n]) => {
    const have = out.filter((t) => t.pos === pos).length;
    for (let i = have; i < n; i++) {
      const target = club.str + (i === 0 ? rf(-2, 3.5) : i === 1 ? rf(-5, 0) : rf(-11, -4));
      const nt = makeTeammate(club, pos, target, null, taken);
      nt.isNew = true;
      out.push(nt);
    }
  });
  out.sort((a, b) => b.ovr - a.ovr);
  return out;
}

/* Sincroniza el vestuario con el club actual */
function syncSquad(G) {
  const club = G.club;
  if (!G.squad || G.squadClubId !== club.id) {
    G.squad = buildSquad(G, club);
    G.squadClubId = club.id;
    G.squad.forEach((t) => { t.isNew = false; });
  } else {
    G.squad = ageSquad(G, club);
  }
  // el fichaje estrella de la pretemporada, si lo hay
  G.newRival = null;
  const comp = competitorFor(G);
  if (comp && comp.isNew && comp.ovr >= G.player.ovr - 2) G.newRival = comp;
  return G.squad;
}

/* Cuanto te penaliza (o te beneficia) el companiero que tienes delante */
function competitorGap(G) {
  const comp = competitorFor(G);
  if (!comp) return 0;
  return G.player.ovr - comp.ovr;
}
