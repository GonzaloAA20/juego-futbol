/* ============================================================
   MERCADO: arranque a los 16, ofertas, contratos, cesiones
   ============================================================ */

/* ---------- Sueldos ---------- */
function wageFor(club, p, roleKey) {
  const roleMul = { star: 1.45, key: 1.15, starter: 1.0, rot: 0.75, sub: 0.55, fringe: 0.4 }[roleKey] || 1;
  const base = Math.pow(clamp(club.str, 35, 95) / 60, 3.4) * Math.pow(clamp(p.ovr, 40, 99) / 70, 4) * 0.6;
  const ageMul = p.age <= 19 ? 0.35 : p.age <= 22 ? 0.65 : p.age >= 34 ? 0.8 : 1;
  const repMul = 1 + p.rep / 300 + (p.traits.includes('mediastar') ? 0.18 : 0);
  return Math.max(0.02, base * roleMul * ageMul * repMul * rf(0.9, 1.12));
}

/* ---------- Afinidad de un pais con una liga ---------- */
function countryAffinity(country, clubCountry) {
  if (country.code === clubCountry) return 100;
  if (country.links.includes(clubCountry)) return 14;
  const cc = COUNTRY_BY_CODE[clubCountry];
  if (cc && cc.confed === country.confed) return 5;
  return 1.1;
}

/* ---------- Opciones al empezar (16 anios) ---------- */
function startingOptions(G) {
  const p = G.player;
  const country = COUNTRY_BY_CODE[p.country];
  const homeLeagues = Object.values(LEAGUES).filter((l) => l.country === country.code);
  const hasHome = homeLeagues.length > 0;

  // Cuanto se te ve el talento con 16: no es tu potencial real, es lo que aparenta
  const visible = p.ovr + (p.pot - p.ovr) * rf(0.15, 0.45) + rf(-3, 4);
  const options = [];

  // -- Opcion 1: cantera de un club grande --
  const bigPool = CLUBS.filter((c) => {
    const lg = LEAGUES[c.league];
    if (!lg || lg.tier !== 1) return false;
    if (c.prestige < 62) return false;
    return countryAffinity(country, c.country) >= (hasHome ? 100 : 5);
  });
  // salir de un pais sin liga profesional modelada cuesta mas: menos ojeadores, menos contactos
  const exile = hasHome ? 0 : (country.tier - 2) * 3.5;
  const big = bigPool.length ? pickW(bigPool, (c) => {
    const aff = countryAffinity(country, c.country);
    // cuanto mas grande el club, mas dificil entrar; el talento visible abre puertas
    const reach = Math.exp(-(c.prestige - 58 + exile - (visible - 52) * 1.5) / 13);
    return aff * clamp(reach, 0.01, 8);
  }) : null;
  if (big) {
    options.push({
      kind: 'academy', club: academyOf(big), parent: big,
      title: 'Cantera del ' + big.name,
      desc: big.prestige >= 84
        ? 'Te ficha uno de los grandes de Europa. Formación de élite, pero hay cuarenta chavales más peleando por tu puesto.'
        : big.prestige >= 70
          ? 'Un club de Primera con una cantera seria. Se sale de aquí, pero hay que ganárselo.'
          : 'Un club de Primera modesto te mete en su cantera. No es el Madrid, pero es Primera.',
      pros: ['Mejor formación', 'Escaparate mundial'], cons: ['Muchísima competencia', 'Pocos minutos al principio'],
      dev: 1.18, minsMod: 0.72,
    });
  }

  // -- Opcion 2: primer equipo de un club modesto (mas minutos) --
  const modestPool = CLUBS.filter((c) => {
    const lg = LEAGUES[c.league];
    if (!lg) return false;
    if (c.str > clamp(visible + 16, 52, 70)) return false;
    return countryAffinity(country, c.country) >= (hasHome ? 100 : 5);
  });
  const modest = modestPool.length ? pickW(modestPool, (c) => {
    const lg = LEAGUES[c.league];
    return countryAffinity(country, c.country) * (lg.tier === 2 ? 3 : 1) * (1 / (1 + Math.abs(c.str - visible - 8) / 6));
  }) : null;
  if (modest) {
    options.push({
      kind: 'first', club: modest, parent: null,
      title: modest.name,
      desc: `Te suben al primer equipo. Nivel más bajo, pero vas a jugar de verdad desde el primer día.`,
      pros: ['Minutos garantizados', 'Debut temprano'], cons: ['Entorno menos exigente', 'Menos escaparate'],
      dev: 0.95, minsMod: 1.2,
    });
  }

  // -- Opcion 3: salir fuera --
  const abroadPool = CLUBS.filter((c) => {
    if (c.country === country.code) return false;
    const lg = LEAGUES[c.league];
    if (!lg) return false;
    const aff = countryAffinity(country, c.country);
    if (aff < 5) return false;
    return c.str <= clamp(visible + 26, 60, 88);
  });
  const abroad = abroadPool.length ? pickW(abroadPool, (c) => {
    const aff = countryAffinity(country, c.country);
    const lg = LEAGUES[c.league];
    const reach = Math.exp(-(c.prestige - 52 - (visible - 52) * 1.6) / 15);
    return aff * clamp(reach, 0.01, 6) * (lg.rep / 70);
  }) : null;
  if (abroad) {
    const useAcademy = abroad.prestige > 62 || chance(0.5);
    options.push({
      kind: useAcademy ? 'academy' : 'first',
      club: useAcademy ? academyOf(abroad) : abroad, parent: useAcademy ? abroad : null,
      title: (useAcademy ? 'Cantera del ' : '') + abroad.name,
      desc: `Hacer las maletas con 16 años. ${COUNTRY_BY_CODE[abroad.country].flag} ${COUNTRY_BY_CODE[abroad.country].name}, lejos de casa, todo por descubrir.`,
      pros: ['Liga más potente', 'Salto de nivel'], cons: ['Adaptación dura', 'Sin red de seguridad'],
      dev: 1.08, minsMod: 0.85, abroad: true,
    });
  }

  // Rellenar si falta alguna
  while (options.length < 3) {
    const c = pickW(CLUBS.filter((x) => LEAGUES[x.league] && x.str < visible + 18), (x) => countryAffinity(country, x.country));
    if (!c) break;
    if (options.some((o) => (o.parent || o.club).name === c.name)) continue;
    options.push({
      kind: 'first', club: c, parent: null, title: c.name,
      desc: 'Una oportunidad inesperada. Nadie apostaba por ti aquí.',
      pros: ['Sitio libre en la plantilla'], cons: ['Proyecto sin garantías'],
      dev: 1.0, minsMod: 1.05,
    });
  }
  return options.slice(0, 3);
}

/* ---------- Peso real del jugador en el mercado ----------
   La media no lo es todo. Un pichichi de la Premier campeón de Europa con su
   selección vale mucho más de lo que dice su media, y los clubes grandes lo saben.
   Esto convierte una gran temporada en puertas que antes estaban cerradas. */
function playerStature(G, ctx) {
  const p = G.player;
  let b = 0;
  b += clamp((p.rep - 40) * 0.12, -4, 8);                                    // fama acumulada
  b += clamp((ctx.rating - 6.8) * 5, -6, 6);                                 // cómo has jugado
  b += Math.min(6, ((ctx.goals || 0) + (ctx.assists || 0) * 0.7) * 0.18);    // números
  b += Math.min(7, (ctx.awardPts || 0) * 0.3);                               // premios individuales
  b += Math.min(6, (ctx.titlePts || 0) * 0.16);                              // títulos, club y selección
  if (ctx.ntElite) b += 2.5;
  if (p.age <= 22 && p.pot - p.ovr >= 8) b += 3;                             // proyección
  if ((ctx.mins || 0) < 900) b -= 8;
  if (p.age >= 32) b -= (p.age - 31) * 2.5;
  if (p.traits.includes('mediastar')) b += 1.5;
  return p.ovr + clamp(b, -12, 14);
}

/* ---------- ¿Puede este club venir a por ti? ----------
   Devuelve 0 si está fuera de tu alcance o si te queda pequeño, y si no, lo
   probable que es que se interesen. */
function clubFeasibility(G, club, ctx) {
  const p = G.player;
  const st = ctx.stature;
  const cur = G.club;
  if (cur && (club.id === cur.id || (cur.parent && club.id === cur.parent))) return 0;
  const lg = LEAGUES[leagueOfClub(G, club)];
  if (!lg) return 0;
  if (club.str > st + 3) return 0;          // por encima de tu talla
  if (club.str < st - 17) return 0;         // muy por debajo: ni ellos preguntan ni tú irías

  // Tu nivel real sigue contando: por muy buena que sea la temporada, un 82
  // no aterriza en una plantilla de 93 de un verano para otro.
  let f = Math.exp(-Math.max(0, club.str - p.ovr - 4) / 5);
  // Los clubes con más caché son selectivos con los que no tienen nombre todavía
  f *= Math.exp(-Math.max(0, club.prestige - 76 - (p.rep - 42) * 0.8) / 20);
  if (p.age >= 31) f *= Math.max(0.12, 1 - (p.age - 30) * 0.24);
  if (p.age <= 18) f *= 0.5;
  if ((ctx.mins || 0) < 700) f *= 0.35;
  if (p.injuryHistory >= 4) f *= 0.8;
  if (p.traits.includes('hothead')) f *= 0.88;
  if (p.flags && p.flags.superAgent) f *= 1.3;
  f *= Math.pow(countryAffinity(COUNTRY_BY_CODE[p.country], club.country), 0.18);
  f *= 0.75 + lg.rep / 190;
  return f;
}

/* ---------- Etapa de carrera: hace que la edad se note ---------- */
function careerStage(age) {
  if (age <= 18) return { key: 'promesa', name: 'Promesa', desc: 'Todo por demostrar.' };
  if (age <= 21) return { key: 'irrupcion', name: 'Irrupción', desc: 'El momento de dar el salto.' };
  if (age <= 25) return { key: 'consolidacion', name: 'Consolidación', desc: 'Toca confirmar lo que prometías.' };
  if (age <= 29) return { key: 'plenitud', name: 'Plenitud', desc: 'Tus mejores años. Ahora o nunca.' };
  if (age <= 33) return { key: 'veterania', name: 'Veteranía', desc: 'La experiencia empieza a pesar más que las piernas.' };
  return { key: 'ultimasbalas', name: 'Últimas balas', desc: 'Cada temporada puede ser la última.' };
}

/* ---------- Generar el mercado de verano ---------- */
function generateMarket(G, rep) {
  const p = G.player;
  const cur = G.club;
  const s = rep.stats;
  const lgName = rep.league ? rep.league.name : '';
  const ctx = {
    rating: s.rating, goals: s.goals, assists: s.assists, mins: s.mins,
    awardPts: (G.lastAwards || []).reduce((a, x) => a + x.pts, 0),
    titlePts: (rep.titles || []).concat(rep.ntTitles || [])
      .reduce((a, t) => a + titlePoints(t.name, lgName), 0),
    ntElite: p.nt.level === 'Absoluta' && (COUNTRY_BY_CODE[p.country] || {}).tier <= 2,
  };
  ctx.stature = playerStature(G, ctx);
  G.lastStature = Math.round(ctx.stature);
  const opts = [];

  /* --- 1. Palabra dada a mitad de temporada: aquí no se elige --- */
  if (G.committedTo) {
    const c = getClub(G.committedTo.clubId) || G.committedTo.club;
    if (c) {
      const nr = squadRole(p, c);
      opts.push({
        type: 'transfer', club: c, binding: true,
        title: 'Firmar por el ' + c.name,
        desc: G.committedTo.reason || 'Diste tu palabra en mitad de temporada. El acuerdo ya está cerrado y no hay marcha atrás.',
        wage: wageFor(c, p, nr.key), years: p.age >= 32 ? ri(1, 2) : ri(3, 5),
        tags: ['Acuerdo cerrado', nr.name],
      });
      G.committedTo = null;
      return { options: opts, clubWants: false, binding: true, stature: ctx.stature };
    }
    G.committedTo = null;
  }

  /* --- 2. Cesión en curso --- */
  if (p.loanFrom) {
    const parent = getClub(p.loanFrom);
    const boughtOut = ctx.stature >= cur.str + 2 && s.mins > 1500 && chance(0.55);
    if ((p.loanYears || 0) >= 1) {
      opts.push({
        type: 'stay', club: cur,
        title: 'Seguir cedido en el ' + cur.name,
        desc: 'A la cesión le queda otro año. Sigues creciendo lejos de casa.',
        wage: p.wage, years: 1, tags: ['Cesión en curso', squadRole(p, cur, competitorGap(G)).name],
      });
    }
    if (boughtOut) {
      const nr = squadRole(p, cur);
      opts.push({
        type: 'transfer', club: cur,
        title: 'El ' + cur.name + ' ejecuta la opción de compra',
        desc: 'Han visto suficiente. Te quieren en propiedad.',
        wage: wageFor(cur, p, nr.key), years: ri(3, 5), tags: ['Traspaso definitivo', nr.name],
      });
    }
    if (parent && (p.loanYears || 0) < 1) {
      const pr = squadRole(p, parent);
      opts.push({
        type: 'return', club: parent,
        title: 'Volver al ' + parent.name,
        desc: pr.min >= 0.6
          ? 'Se acabó la cesión y vuelves con otro cartel. Ahora sí cuentan contigo.'
          : 'Se acabó la cesión y toca volver, te guste o no. Ahí sigue la competencia que dejaste.',
        wage: wageFor(parent, p, pr.key), years: Math.max(1, p.contract), tags: ['Fin de cesión', pr.name],
      });
    }
  }

  /* --- 3. ¿Te quiere tu club? --- */
  const role = squadRole(p, cur, competitorGap(G));
  const parentClub = cur.academy ? getClub(cur.parent) : cur;
  let clubWants = true;
  if (!p.loanFrom) {
    if (cur.academy) {
      const readiness = p.ovr - parentClub.str;
      if (readiness >= -8 || (p.age >= 19 && readiness >= -13)) {
        const nr = squadRole(p, parentClub);
        opts.push({
          type: 'promote', club: parentClub,
          title: 'Subir al primer equipo del ' + parentClub.name,
          desc: 'El club te sube. Se acabó la cantera: ahora te mides con los mayores.',
          wage: wageFor(parentClub, p, nr.key), years: ri(3, 5),
          tags: ['Sueño cumplido', nr.name],
        });
      } else if (p.age >= 19) {
        clubWants = false;
      } else {
        opts.push({
          type: 'stay', club: cur, title: 'Seguir en la cantera del ' + parentClub.name,
          desc: 'Un año más de formación. Todavía no te ven listo.',
          wage: Math.max(0.03, wageFor(cur, p, role.key) * 0.5), years: 1, tags: ['Paciencia'],
        });
      }
    } else {
      const keep = (ctx.stature - cur.str) * 5 + (s.rating - 6.5) * 40
        + (p.age <= 26 ? 15 : p.age >= 34 ? -30 : 0) + (s.mins > 900 ? 12 : -14);
      clubWants = keep > -20 && !(p.flags && p.flags.wantOut);
      if (clubWants) {
        opts.push({
          type: 'stay', club: cur,
          title: 'Renovar con el ' + cur.name,
          desc: p.contract <= 1 ? 'El club te pone un contrato nuevo sobre la mesa.' : 'Sigues bajo contrato. Un año más en casa.',
          wage: wageFor(cur, p, role.key) * (p.traits.includes('loyal') ? 1.06 : 1),
          years: p.age >= 33 ? 1 : ri(2, 4), tags: [role.name, 'Continuidad'],
        });
      }
    }
  }

  /* --- 4. Ofertas de fuera, dentro de la banda que te corresponde --- */
  const pool = [];
  for (const c of CLUBS) {
    const f = clubFeasibility(G, c, ctx);
    if (f > 0.03) pool.push({ club: c, f: f * rf(0.55, 1.45) });
  }
  pool.sort((a, b) => b.f - a.f);
  // Como mucho dos clubes por liga: variedad sin que una sola liga cope el mercado
  const perLeague = {};
  const picks = [];
  for (const x of pool) {
    const lk = leagueOfClub(G, x.club);
    perLeague[lk] = (perLeague[lk] || 0) + 1;
    if (perLeague[lk] > 2) continue;
    picks.push(x);
    if (picks.length >= 12) break;
  }

  let nOffers = clamp(Math.round(gauss(2.2, 1, 0, 3)), 0, 3);
  if (p.flags && (p.flags.wantOut || p.flags.forceMove)) nOffers = Math.max(nOffers, 2);
  if (!picks.length) nOffers = 0;

  const chosen = shuffle(picks.slice(0, 8)).slice(0, nOffers);
  /* Si has hecho una temporada grande, al menos una oferta tiene que ser un paso
     adelante de verdad: es justo lo que fallaba antes. No siempre el mismo club,
     porque entonces todas las carreras acaban en el mismo sitio. */
  const bigSeason = ctx.stature >= cur.str + 4 && s.mins > 1200;
  if (bigSeason) {
    const ups = picks.filter((x) => x.club.str > cur.str + 1);
    if (ups.length) {
      const best = pickW(ups.slice(0, 6), (x) => x.f * (1 + x.club.prestige / 130));
      if (best && !chosen.some((x) => x.club.id === best.club.id)) {
        if (chosen.length >= 3) chosen[chosen.length - 1] = best; else chosen.push(best);
      }
    }
  }

  chosen.forEach((x) => {
    const c = x.club;
    const nr = squadRole(p, c);
    const lg = LEAGUES[leagueOfClub(G, c)];
    opts.push({
      type: 'transfer', club: c,
      title: 'Fichar por el ' + c.name,
      desc: offerFlavour(G, c, nr, cur),
      wage: wageFor(c, p, nr.key), years: p.age >= 32 ? ri(1, 2) : ri(3, 5),
      tags: [lg.name, nr.name, c.prestige > 80 ? 'Club histórico' : lg.tier === 2 ? 'Segunda división' : 'Primera división'],
      fee: playerValue(p) * rf(0.85, 1.6),
      stepUp: c.str - cur.str,
    });
  });

  /* --- 5. Cesiones: la vía normal de los jóvenes que no juegan --- */
  const askedLoan = !!(p.flags && p.flags.wantLoan);
  if (!p.loanFrom && !cur.academy && (p.age <= 23 || askedLoan) && p.age <= 25
      && (s.mins < 1200 || role.min < 0.5 || askedLoan)) {
    const loanPool = CLUBS.filter((c) => {
      const lg = LEAGUES[leagueOfClub(G, c)];
      return lg && c.id !== cur.id && c.str < p.ovr + 6 && c.str > p.ovr - 16;
    });
    if (loanPool.length) {
      const lc = pickW(loanPool, (c) => countryAffinity(COUNTRY_BY_CODE[p.country], c.country)
        * (1 / (1 + Math.abs(c.str - p.ovr + 4) / 5)));
      const yrs = chance(askedLoan ? 0.55 : 0.4) ? 2 : 1;
      if (p.flags) delete p.flags.wantLoan;
      opts.push({
        type: 'loan', club: lc, backTo: cur.id, loanYears: yrs,
        title: 'Cesión al ' + lc.name + (yrs === 2 ? ' (dos años)' : ''),
        desc: yrs === 2
          ? 'Dos temporadas fuera para hacerte jugador. Es mucho tiempo, pero vas a jugarlo todo.'
          : 'Un año fuera para jugar. Si respondes, vuelves con otro cartel.',
        wage: wageFor(lc, p, 'starter') * 0.7, years: yrs,
        tags: ['Cesión', yrs === 2 ? 'Dos años' : 'Un año', 'Minutos asegurados'],
      });
    }
  }

  /* --- 6. Si no queda nada --- */
  const realOptions = opts.filter((o) => o.type !== 'retire');
  const stillWorthIt = p.age <= 33 || p.ovr >= 66 || chance(clamp(0.75 - (p.age - 33) * 0.18, 0, 0.75));
  if (!realOptions.length && stillWorthIt) {
    const desperate = CLUBS.filter((c) => {
      const lg = LEAGUES[leagueOfClub(G, c)];
      return lg && c.str <= p.ovr + 2 && c.str >= p.ovr - 18;
    });
    if (desperate.length) {
      const c = pickW(desperate, (x) => countryAffinity(COUNTRY_BY_CODE[p.country], x.country) / (1 + Math.abs(x.str - p.ovr + 6)));
      opts.push({
        type: 'transfer', club: c, title: 'Firmar por el ' + c.name,
        desc: 'La única puerta que sigue abierta. Hay que seguir jugando.',
        wage: wageFor(c, p, 'starter') * 0.8, years: ri(1, 2),
        tags: [LEAGUES[leagueOfClub(G, c)].name, 'Última oportunidad'],
      });
    }
  }

  /* --- 7. Retirada --- */
  if (!opts.filter((o) => o.type !== 'retire').length) {
    opts.push({
      type: 'retire', club: null, forced: true,
      title: 'Colgar las botas',
      desc: 'No queda ni una oferta sobre la mesa. El teléfono lleva todo el verano sin sonar.',
      tags: ['Sin ofertas'],
    });
  } else if (p.age >= 32) {
    opts.push({
      type: 'retire', club: null,
      title: 'Colgar las botas',
      desc: p.age >= 37 ? 'Ha sido un viaje largo. Retirarte ahora, en tus términos.' : 'Dejarlo ya y empezar otra vida.',
      tags: ['Fin de carrera'],
    });
  }
  return { options: opts, clubWants, stature: ctx.stature };
}

function offerFlavour(G, club, role, cur) {
  const lg = LEAGUES[leagueOfClub(G, club)];
  const bits = [];
  const step = cur ? club.str - cur.str : 0;
  if (club.prestige >= 88) bits.push('Uno de los grandes de Europa llama a tu puerta.');
  else if (step >= 6) bits.push('Un salto de nivel claro respecto a donde estás.');
  else if (club.prestige >= 74) bits.push('Un club con historia que quiere volver a lo más alto.');
  else if (lg.tier === 2) bits.push('Proyecto de ascenso: quieren que seas el líder.');
  else if (step <= -5) bits.push('Bajarías de nivel, pero serías el amo del equipo.');
  else bits.push('Un club que te ha seguido toda la temporada.');
  if (role.key === 'star') bits.push('Te quieren como estandarte del equipo.');
  else if (role.key === 'key') bits.push('Titular desde el primer día.');
  else if (role.key === 'rot' || role.key === 'sub') bits.push('Tendrías que pelear un sitio.');
  const eu = G.euro && G.euro[club.id];
  if (eu) bits.push('Juegan ' + contCompName(club.confed, eu) + ' la temporada que viene.');
  return bits.join(' ');
}

/* ---------- Compromisos adquiridos a mitad de temporada ----------
   Si das tu palabra en enero, en verano se cumple: no vuelve a haber elección. */
function commitTo(G, club, reason) {
  if (!club) return '';
  G.committedTo = { clubId: club.id, reason };
  return 'Acuerdo cerrado con el ' + club.name + '. En verano firmas allí, pase lo que pase.';
}

/* Fichaje de invierno de verdad: te vas en enero y juegas media temporada allí */
function moveInWinter(G, club) {
  if (!club) return '';
  const nr = squadRole(G.player, club);
  G.winterMove = { clubId: club.id, years: ri(3, 4), wage: wageFor(club, G.player, nr.key) };
  return 'Te vas al ' + club.name + ' en el mercado de invierno. La media temporada que queda la juegas allí.';
}

/* Un pretendiente coherente con tu momento, para las ofertas que nacen de un evento.
   `step` marca cuánto mejor que tu club actual queremos que sea. */
function suitorClub(G, step) {
  const p = G.player;
  const cur = G.club;
  const base = mainClub(cur) || cur;
  const ctx = {
    stature: p.ovr + clamp((p.rep - 40) * 0.12, -4, 8) + clamp(p.form / 9, -3, 4) + (step || 0),
    mins: 2000, rating: 6.8, goals: 0, assists: 0,
  };
  const pool = [];
  for (const c of CLUBS) {
    if (c.id === base.id) continue;
    if (step > 0 && c.str <= base.str + 1) continue;
    const f = clubFeasibility(G, c, ctx);
    if (f > 0.03) pool.push({ c, f });
  }
  if (!pool.length) return null;
  return pickW(pool, (x) => x.f * (1 + x.c.prestige / 150)).c;
}

/* ---------- Aplicar el movimiento ---------- */
function applyMove(G, opt) {
  const p = G.player;
  if (opt.type === 'retire') { p.retired = true; return; }
  const prev = G.club;

  if (opt.type === 'loan') {
    p.loanFrom = opt.backTo;
    p.loanYears = (opt.loanYears || 1) - 1;
  } else if (opt.type === 'stay' && p.loanFrom) {
    p.loanYears = Math.max(0, (p.loanYears || 1) - 1);   // la cesión sigue corriendo
  } else {
    p.loanFrom = null; p.loanYears = 0;
  }

  p.seasonsAtClub = (prev && opt.club && prev.id === opt.club.id) ? (p.seasonsAtClub || 0) + 1 : 0;
  G.club = opt.club;
  p.contract = opt.years || 2;
  p.wage = opt.wage || 0.05;
  if (p.flags) { delete p.flags.wantOut; delete p.flags.forceMove; }
  if (prev && opt.club && prev.id !== opt.club.id) {
    p.trust = clamp(52 + rf(-6, 10), 30, 80);
    p.fanLove = opt.type === 'promote' || opt.type === 'return' ? 62 : clamp(50 + rf(-8, 10), 25, 75);
    p.morale = clamp(p.morale + (opt.club.prestige > (prev.prestige || 0) ? 8 : -2), 25, 100);
  }
  p.value = playerValue(p);
}
