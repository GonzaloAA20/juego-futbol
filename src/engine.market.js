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

/* ---------- Interes de un club por el jugador ---------- */
function clubInterest(G, club, ctx) {
  const p = G.player;
  const lg = LEAGUES[leagueOfClub(G, club)];
  if (!lg) return 0;
  const cur = G.club;
  if (cur && (club.id === cur.id || (cur.parent && club.id === cur.parent))) return 0;

  const gap = p.ovr - club.str;
  let s;
  if (gap >= 0) s = 100 - Math.max(0, gap - 7) * 7;     // mejor que ellos: les encanta, pero no pueden pagarlo si les sacas mucho
  else s = 78 + gap * 8;                                 // por debajo de su nivel: menos interes
  if (p.age <= 21 && p.pot - p.ovr >= 6) s += 22 + (p.pot - p.ovr);
  if (p.age <= 18) s -= 8;
  if (p.age >= 31) s -= (p.age - 30) * 13;
  if (p.age >= 35) s -= 30;
  // pasados los 34, nadie ficha a alguien por debajo de su nivel
  if (p.age >= 34 && p.ovr < club.str - 3) return 0;
  s += (p.rep - 30) * 0.28;
  s += ((ctx.rating || 6.6) - 6.6) * 34;
  s += ((ctx.goals || 0) + (ctx.assists || 0) * 0.7) * 1.1;
  if (ctx.mins < 500) s -= 22;
  if (p.injuryHistory >= 3) s -= 8;
  if (p.traits.includes('hothead')) s -= 5;
  if (p.traits.includes('mediastar')) s += 6;

  // los clubes de ligas fuertes son mas exigentes
  s -= Math.max(0, lg.rep - 78) * 0.5;
  // afinidad cultural / scouting
  const country = COUNTRY_BY_CODE[p.country];
  s += Math.log10(countryAffinity(country, club.country)) * 6;
  // salto de liga: no se pasa de la nada a la Premier de un verano para otro
  const curLg = cur ? LEAGUES[leagueOfClub(G, cur)] : null;
  if (curLg) s -= Math.max(0, lg.rep - curLg.rep - 10) * 1.9;
  // si acabas de llegar, ni el club te vende ni nadie se molesta en preguntar
  if ((p.seasonsAtClub || 0) < 1) s -= 16;
  return clamp(s, 0, 130);
}

/* ---------- Generar opciones de mercado tras la temporada ---------- */
function generateMarket(G, rep) {
  const p = G.player;
  const cur = G.club;
  const s = rep.stats;
  const ctx = { rating: s.rating, goals: s.goals, assists: s.assists, mins: s.mins };
  const opts = [];

  /* ¿Te quiere tu club? */
  const role = squadRole(p, cur, competitorGap(G));
  const parentClub = cur.academy ? getClub(cur.parent) : cur;
  let clubWants = true;
  if (cur.academy) {
    // ¿te suben al primer equipo?
    const readiness = p.ovr - parentClub.str;
    if (readiness >= -8 || (p.age >= 19 && readiness >= -13)) {
      opts.push({
        type: 'promote', club: parentClub,
        title: 'Subir al primer equipo del ' + parentClub.name,
        desc: 'El club te sube. Se acabó la cantera: ahora te mides con los mayores.',
        wage: wageFor(parentClub, p, squadRole(p, parentClub).key), years: ri(3, 5),
        tags: ['Sueño cumplido', squadRole(p, parentClub).name],
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
    const keepScore = (p.ovr - cur.str) * 6 + (s.rating - 6.5) * 40 + (p.age <= 26 ? 15 : p.age >= 34 ? -30 : 0) + (s.mins > 900 ? 12 : -14);
    clubWants = keepScore > -20;
    if (clubWants) {
      const nr = squadRole(p, cur);
      opts.push({
        type: 'stay', club: cur,
        title: 'Renovar con el ' + cur.name,
        desc: p.contract <= 1 ? 'El club te pone un contrato nuevo sobre la mesa.' : 'Sigues bajo contrato. Un año más en casa.',
        wage: wageFor(cur, p, nr.key) * (p.traits.includes('loyal') ? 1.06 : 1),
        years: p.age >= 33 ? 1 : ri(2, 4), tags: [nr.name, 'Continuidad'],
      });
    }
  }

  /* Ofertas de fuera */
  const pool = CLUBS.filter((c) => {
    const lg = LEAGUES[leagueOfClub(G, c)];
    if (!lg) return false;
    return Math.abs(c.str - p.ovr) < 26;
  });
  const scored = [];
  for (const c of pool) {
    const it = clubInterest(G, c, ctx);
    if (it > 46) scored.push({ club: c, it: it * rf(0.7, 1.35) });
  }
  scored.sort((a, b) => b.it - a.it);

  // variedad: como mucho un club por liga
  const seenLeague = {};
  const picks = [];
  for (const sc of scored) {
    const lk = leagueOfClub(G, sc.club);
    if (seenLeague[lk]) continue;
    seenLeague[lk] = 1; picks.push(sc);
    if (picks.length >= 6) break;
  }
  const nOffers = clamp(Math.round(picks.length ? gauss(2.1, 1, 0, 3) : 0), 0, 3);
  shuffle(picks).slice(0, nOffers).forEach((sc) => {
    const c = sc.club;
    const nr = squadRole(p, c);
    const lg = LEAGUES[leagueOfClub(G, c)];
    opts.push({
      type: 'transfer', club: c,
      title: 'Fichar por el ' + c.name,
      desc: offerFlavour(G, c, nr),
      wage: wageFor(c, p, nr.key), years: p.age >= 32 ? ri(1, 2) : ri(3, 5),
      tags: [lg.name, nr.name, c.prestige > 80 ? 'Club histórico' : lg.tier === 2 ? 'Segunda división' : 'Primera división'],
      fee: playerValue(p) * rf(0.85, 1.6),
    });
  });

  /* Cesion si no juegas y eres joven */
  if (p.age <= 23 && s.mins < 900 && !cur.academy) {
    const loanPool = CLUBS.filter((c) => {
      const lg = LEAGUES[leagueOfClub(G, c)];
      return lg && c.str < p.ovr + 5 && c.str > p.ovr - 14 && c.id !== cur.id;
    });
    if (loanPool.length) {
      const lc = pickW(loanPool, (c) => countryAffinity(COUNTRY_BY_CODE[p.country], c.country) * (1 / (1 + Math.abs(c.str - p.ovr + 4) / 5)));
      opts.push({
        type: 'loan', club: lc, backTo: cur.id,
        title: 'Cesión al ' + lc.name,
        desc: 'Un año fuera para jugar. Si respondes, vuelves con otro cartel.',
        wage: wageFor(lc, p, 'starter') * 0.7, years: 1,
        tags: ['Cesión', 'Minutos asegurados'],
      });
    }
  }

  /* Si nadie te quiere: queda alguna puerta de servicio, pero no siempre */
  const stillWorthIt = p.age <= 33 || p.ovr >= 66 || chance(clamp(0.75 - (p.age - 33) * 0.18, 0, 0.75));
  if (!opts.length && stillWorthIt) {
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

  /* Retirada */
  if (!opts.length) {
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
  return { options: opts, clubWants };
}

function offerFlavour(G, club, role) {
  const lg = LEAGUES[leagueOfClub(G, club)];
  const bits = [];
  if (club.prestige >= 88) bits.push('Uno de los grandes de Europa llama a tu puerta.');
  else if (club.prestige >= 74) bits.push('Un club con historia que quiere volver a lo más alto.');
  else if (lg.tier === 2) bits.push('Proyecto de ascenso: quieren que seas el líder.');
  else bits.push('Un club que te ha seguido toda la temporada.');
  if (role.key === 'star') bits.push('Te quieren como estandarte del equipo.');
  else if (role.key === 'key') bits.push('Titular desde el primer día.');
  else if (role.key === 'rot' || role.key === 'sub') bits.push('Tendrías que pelear un sitio.');
  const eu = G.euro && G.euro[club.id];
  if (eu) bits.push('Juegan ' + contCompName(club.confed, eu) + ' la temporada que viene.');
  return bits.join(' ');
}

/* ---------- Aplicar el movimiento ---------- */
function applyMove(G, opt) {
  const p = G.player;
  if (opt.type === 'retire') { p.retired = true; return; }
  const prev = G.club;
  if (opt.type === 'loan') { p.loanFrom = opt.backTo; }
  else if (p.loanFrom && opt.type !== 'loan') p.loanFrom = null;
  p.seasonsAtClub = (prev && opt.club && prev.id === opt.club.id) ? (p.seasonsAtClub || 0) + 1 : 0;
  G.club = opt.club;
  p.contract = opt.years || 2;
  p.wage = opt.wage || 0.05;
  if (prev && opt.club && prev.id !== opt.club.id) {
    p.trust = clamp(52 + rf(-6, 10), 30, 80);
    p.fanLove = opt.type === 'promote' ? 68 : clamp(50 + rf(-8, 10), 25, 75);
    p.morale = clamp(p.morale + (opt.club.prestige > (prev.prestige || 0) ? 8 : -2), 25, 100);
  }
  p.value = playerValue(p);
}
