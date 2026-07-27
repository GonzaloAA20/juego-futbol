/* ============================================================
   EVENTOS DE TEMPORADA Y MOMENTOS CLAVE
   ============================================================
   Cada evento: { id, cat, w(peso), when(G)->bool, title, text(G)->string,
                  opts: [ { l:etiqueta, d:descripcion, e:efectos|fn, r:resultado(G)->texto } ] }
   Efectos posibles: morale, trust, fanLove, rep, fitness, form, sp, money,
   goals/assists/mins/growth/injuryRisk (multiplicadores), rating, extraGoals,
   trait (anadir rasgo), lose (quitar rasgo), attr {clave:+n}
*/

const P = (G) => G.player;
const CLUB = (G) => G.club;
const LG = (G) => LEAGUES[leagueOfClub(G, G.club)] || { rep: 60, tier: 1, name: 'la liga' };
const isAtk = (G) => ['ST', 'LW', 'RW', 'AM'].includes(G.player.pos);
const isDef = (G) => ['CB', 'LB', 'RB', 'DM'].includes(G.player.pos);
const isGK = (G) => G.player.pos === 'GK';

const EVENTS = [
/* ---------------- ENTRENAMIENTO Y CUERPO ---------------- */
{
  id: 'extra_training', cat: 'Entrenamiento', w: 10,
  title: 'Horas extra',
  text: (G) => `El campo se queda vacío a las seis. Puedes quedarte a tirar faltas hasta que se apaguen las luces, o irte a casa a descansar como todo el mundo.`,
  opts: [
    { l: 'Quedarme a entrenar solo', d: 'Creces más rápido, pero el cuerpo lo paga.', e: { growth: 1.16, injuryRisk: 1.3, fitness: -6, trust: 4 } },
    { l: 'Entrenar lo justo y descansar', d: 'Llegas fresco a los partidos.', e: { fitness: 8, injuryRisk: 0.85, growth: 0.96 } },
    { l: 'Pedir un plan individual al preparador', d: 'Equilibrado y con criterio.', e: { growth: 1.08, fitness: 2, injuryRisk: 0.95, sp: 1 } },
  ],
},
{
  id: 'gym', cat: 'Entrenamiento', w: 8, when: (G) => P(G).age <= 25,
  title: 'El gimnasio',
  text: () => `El preparador físico te dice a la cara que te falta cuerpo para competir contra tíos de 30 años. Tiene razón, pero cambiar eso cuesta.`,
  opts: [
    { l: 'Vivir en el gimnasio', d: 'Físico arriba, algo de agilidad abajo.', e: { attr: { phy: 3, pac: -1, ref: 2 }, injuryRisk: 0.9 } },
    { l: 'Trabajar velocidad y agilidad', d: 'Más chispa, menos aguante.', e: { attr: { pac: 3, phy: -1, ref: 2 } } },
    { l: 'Pasar del tema', d: 'Tú juegas al fútbol, no levantas piedras.', e: { morale: 4, trust: -5, growth: 0.94 } },
  ],
},
{
  id: 'nutrition', cat: 'Vida', w: 7,
  title: 'La báscula no miente',
  text: () => `Vuelves de las vacaciones con dos kilos de más. El míster no dice nada, pero te mira los tobillos cuando entras al vestuario.`,
  opts: [
    { l: 'Contratar un nutricionista', d: 'Cuesta dinero, pero funciona.', e: { money: -0.08, fitness: 10, injuryRisk: 0.85, growth: 1.05 } },
    { l: 'Doble sesión hasta ponerme a punto', d: 'A las bravas.', e: { fitness: 7, injuryRisk: 1.2, morale: -4 } },
    { l: 'Ya bajaré jugando', d: 'Clásico.', e: { fitness: -8, injuryRisk: 1.25, trust: -6 } },
  ],
},
{
  id: 'niggle', cat: 'Cuerpo', w: 8,
  title: 'Molestias',
  text: () => `Notas un pinchazo en el aductor. El doctor dice que con dos semanas de parón se va. El míster dice que el domingo hay partido grande.`,
  opts: [
    { l: 'Infiltrarme y jugar', d: 'El equipo primero. Tu rodilla después.', e: { trust: 10, fanLove: 6, injuryRisk: 1.55, rating: 0.05 } },
    { l: 'Parar dos semanas', d: 'Lo sensato.', e: { trust: -7, injuryRisk: 0.7, mins: 0.93 } },
    { l: 'Ocultarlo y apretar los dientes', d: 'Nadie se entera. De momento.', e: { injuryRisk: 1.9, rep: 2, morale: -3 } },
  ],
},
{
  id: 'recovery_tech', cat: 'Cuerpo', w: 5, when: (G) => P(G).wage > 1,
  title: 'Cámara hiperbárica',
  text: () => `Un compañero se ha montado un centro de recuperación en su casa: crioterapia, cámara hiperbárica, fisios a domicilio. Te ofrece meterte a medias.`,
  opts: [
    { l: 'Invertir en mi cuerpo', d: 'Caro, pero alarga carreras.', e: { money: -0.35, injuryRisk: 0.72, fitness: 8, trait: 'ironman' } },
    { l: 'Con el fisio del club me vale', d: '', e: { money: 0.05 } },
  ],
},

/* ---------------- ENTRENADOR Y VESTUARIO ---------------- */
{
  id: 'new_coach', cat: 'Entrenador', w: 9,
  title: 'Entrenador nuevo',
  text: (G) => `Destituyen al míster. Llega uno nuevo con fama de ${pick(['obsesivo con la presión alta', 'muy defensivo', 'de dar minutos a los jóvenes', 'de tener sus favoritos', 'durísimo en el trato'])}. La primera charla es mañana.`,
  opts: [
    { l: 'Ir a hablar con él el primer día', d: 'Que sepa quién eres.', e: { trust: 9, morale: 3 } },
    { l: 'Callarme y demostrarlo en el campo', d: 'Los hechos.', e: { trust: 3, rating: 0.08, growth: 1.04 } },
    { l: 'Ponerme de perfil', d: 'A ver por dónde sale.', e: { trust: -4, morale: -2 } },
  ],
},
{
  id: 'position_change', cat: 'Entrenador', w: 7, when: (G) => !isGK(G) && P(G).age >= 18,
  title: 'Te cambian de posición',
  text: (G) => `El entrenador quiere probarte en otra demarcación. Dice que ahí puedes ser mucho mejor jugador. Tú llevas toda la vida jugando de ${POS_BY_KEY[P(G).pos].name.toLowerCase()}.`,
  opts: [
    { l: 'Aceptar el cambio', d: 'Reinventarse. Riesgo alto, recompensa alta.', e: (G) => {
      const alt = { ST: 'AM', AM: 'CM', CM: 'DM', DM: 'CB', CB: 'DM', LB: 'LW', RB: 'RW', LW: 'ST', RW: 'ST' }[P(G).pos] || 'CM';
      P(G).pos = alt; P(G).ovr = computeOvr(P(G));
      return { trust: 8, morale: -3, growth: 1.1, note: 'Ahora juegas de ' + POS_BY_KEY[alt].name + '.' };
    } },
    { l: 'Negarme en redondo', d: 'Tú sabes lo que eres.', e: { trust: -12, morale: 5, mins: 0.9 } },
    { l: 'Probarlo solo en entrenamientos', d: 'Sin comprometerte.', e: { trust: 2, sp: 1 } },
  ],
},
{
  id: 'captaincy', cat: 'Vestuario', w: 6, when: (G) => P(G).age >= 24 && squadRole(P(G), CLUB(G)).key !== 'fringe',
  title: 'El brazalete',
  text: (G) => `Se va el capitán. En el vestuario hay dos nombres sobre la mesa y uno es el tuyo.`,
  opts: [
    { l: 'Dar el paso', d: 'Más responsabilidad, más ruido.', e: { trait: 'leader', trust: 12, fanLove: 8, rep: 4, rating: -0.03 } },
    { l: 'Apoyar al otro candidato', d: 'El vestuario lo agradece.', e: { morale: 6, trust: 5 } },
  ],
},
{
  id: 'clash', cat: 'Vestuario', w: 8, when: (G) => P(G).age >= 19,
  title: 'Bronca en el vestuario',
  text: () => `Media hora después de una derrota, un veterano te señala delante de todos. Dice que no corres, que vas a lo tuyo. El vestuario se queda en silencio.`,
  opts: [
    { l: 'Encararme', d: 'No te vas a dejar pisar.', e: { trait: 'hothead', morale: -4, trust: -6, rep: 3, form: 6 } },
    { l: 'Tragar y responder en el campo', d: 'Silencio y trabajo.', e: { rating: 0.1, growth: 1.06, morale: -6 } },
    { l: 'Hablar con él a solas después', d: 'Adulto.', e: { trust: 7, morale: 4, attr: { men: 2 } } },
  ],
},
{
  id: 'veteran_mentor', cat: 'Vestuario', w: 8, when: (G) => P(G).age <= 23,
  title: 'El veterano',
  text: (G) => `Un tío de 34 años que lo ha ganado todo te ofrece llevarte con él: entrenamientos aparte, vídeos, charlas de dos horas sobre cómo leer un partido.`,
  opts: [
    { l: 'Pegarme a él como una lapa', d: 'Aprender de quien sabe.', e: { attr: { men: 4 }, growth: 1.12, sp: 1, morale: 4 } },
    { l: 'Cada uno a lo suyo', d: 'Tú tienes tu camino.', e: { morale: 2 } },
  ],
},
{
  id: 'clique', cat: 'Vestuario', w: 6,
  title: 'Los grupitos',
  text: () => `El vestuario está partido en dos: los que apoyan al entrenador y los que quieren que se vaya. Los dos bandos te tantean.`,
  opts: [
    { l: 'Con el míster', d: 'Si sobrevive, ganas mucho.', e: (G) => chance(0.55) ? { trust: 15, mins: 1.08, note: 'El míster aguanta. Eres intocable.' } : { trust: -8, mins: 0.92, note: 'Lo destituyen. Quedas señalado.' } },
    { l: 'Con el vestuario', d: '', e: (G) => chance(0.5) ? { morale: 8, trust: -10, note: 'Cae el entrenador. El vestuario respira.' } : { morale: -6, trust: -14, mins: 0.85, note: 'El míster se queda. Y no olvida.' } },
    { l: 'No mojarme', d: 'Suiza.', e: { morale: -2, trust: -2 } },
  ],
},

/* ---------------- PRENSA Y REDES ---------------- */
{
  id: 'press_bait', cat: 'Prensa', w: 9, when: (G) => P(G).rep >= 20,
  title: 'Micrófono en la zona mixta',
  text: (G) => `Un periodista te pregunta si crees que mereces jugar más. Detrás tienes al entrenador esperando el autobús.`,
  opts: [
    { l: 'Decir la verdad: merezco jugar más', d: 'Titular garantizado. Del periódico.', e: { rep: 6, trust: -12, fanLove: 4, form: 5 } },
    { l: 'Respuesta de manual', d: 'Aburrido y seguro.', e: { trust: 4, rep: -1 } },
    { l: 'Bromear y salir por peteneras', d: 'Carisma.', e: { rep: 4, fanLove: 5, trait: 'mediastar' } },
  ],
},
{
  id: 'social_storm', cat: 'Prensa', w: 7,
  title: 'Tormenta en redes',
  text: () => `Alguien rescata un tuit tuyo de cuando tenías 15 años. Es una tontería, pero está en todos los telediarios deportivos.`,
  opts: [
    { l: 'Disculparme públicamente', d: 'Se apaga en tres días.', e: { rep: -2, morale: -3, fanLove: 2 } },
    { l: 'Borrar todo y no decir nada', d: '', e: { rep: -1, morale: -5 } },
    { l: 'Reírme del tema en directo', d: 'O sale bien o sale fatal.', e: (G) => chance(0.6) ? { rep: 8, fanLove: 8, note: 'La gente te adora por la naturalidad.' } : { rep: -6, fanLove: -8, note: 'No ha hecho gracia a nadie.' } },
  ],
},
{
  id: 'documentary', cat: 'Prensa', w: 5, when: (G) => P(G).rep >= 45,
  title: 'Un documental sobre ti',
  text: () => `Una plataforma quiere seguirte una temporada entera con cámaras. Dinero fácil y fama mundial. Y cámaras en tu casa.`,
  opts: [
    { l: 'Firmar', d: 'Tu cara en 190 países.', e: { money: 1.6, rep: 14, trait: 'mediastar', morale: -4, rating: -0.05 } },
    { l: 'Solo si respetan mi intimidad', d: 'Versión descafeinada.', e: { money: 0.5, rep: 6 } },
    { l: 'Ni de broma', d: 'Fútbol y punto.', e: { morale: 5, trust: 3, growth: 1.04 } },
  ],
},
{
  id: 'boot_deal', cat: 'Dinero', w: 7, when: (G) => P(G).rep >= 25,
  title: 'Contrato de botas',
  text: () => `Dos marcas te quieren. Una ofrece el doble de dinero. La otra ofrece campaña global, vídeos y estar en el cartel con los mejores.`,
  opts: [
    { l: 'El dinero', d: 'Pájaro en mano.', e: { money: 0.9, rep: 3 } },
    { l: 'El escaparate', d: 'La imagen vale más a largo plazo.', e: { money: 0.35, rep: 10, fanLove: 4 } },
    { l: 'Seguir sin marca', d: 'Libertad total.', e: { morale: 3 } },
  ],
},

/* ---------------- AFICIÓN Y CLUB ---------------- */
{
  id: 'fans_banner', cat: 'Afición', w: 7,
  title: 'Pancarta en el fondo',
  text: (G) => `Los ultras del ${CLUB(G).name} cuelgan una pancarta con tu nombre. Puede ser un homenaje o una amenaza, según cómo acabe el año.`,
  opts: [
    { l: 'Ir a saludarles al final del partido', d: 'Gesto que se recuerda.', e: { fanLove: 12, rep: 3, trust: -2 } },
    { l: 'Mantener las distancias', d: '', e: { fanLove: -3, morale: 2 } },
  ],
},
{
  id: 'charity', cat: 'Vida', w: 6,
  title: 'Volver al barrio',
  text: () => `El club de tu barrio, donde empezaste, está a punto de cerrar. Necesitan 60.000 euros para la temporada que viene.`,
  opts: [
    { l: 'Pagarlo todo', d: 'Sin ruido.', e: { money: -0.06, fanLove: 10, rep: 5, morale: 8, attr: { men: 2 } } },
    { l: 'Organizar un partido benéfico', d: 'Más impacto, más agenda.', e: { fanLove: 8, rep: 8, fitness: -4 } },
    { l: 'No es mi problema', d: '', e: { morale: -4, fanLove: -4 } },
  ],
},
{
  id: 'renewal_pressure', cat: 'Club', w: 7, when: (G) => P(G).contract <= 1 && P(G).age >= 20,
  title: 'Te queda un año',
  text: (G) => `Tu representante te lo dice claro: si llegas a final de contrato, sales gratis y cobras el triple en otro sitio. El club quiere blindarte ya.`,
  opts: [
    { l: 'Renovar ahora y quedarme', d: 'Tranquilidad.', e: (G) => { P(G).contract += 3; return { trust: 10, fanLove: 8, morale: 6 }; } },
    { l: 'Esperar a final de contrato', d: 'Máximo dinero, máximo riesgo.', e: { trust: -14, fanLove: -10, morale: -2, note: 'El club te lo va a hacer pagar.' } },
    { l: 'Renovar con cláusula de salida baja', d: 'Lo mejor de los dos mundos, si cuela.', e: (G) => chance(0.5) ? (() => { P(G).contract += 2; return { trust: 4, note: 'Aceptan. Buena jugada de tu agente.' }; })() : { trust: -6, note: 'Se niegan en redondo.' } },
  ],
},
{
  id: 'wage_cut', cat: 'Club', w: 5, when: (G) => CLUB(G).str < 72,
  title: 'El club no puede pagar',
  text: (G) => `${clubRef(CLUB(G)).replace(/^el /,'El ').replace(/^la /,'La ')} tiene problemas. Piden a la plantilla que aplace tres meses de sueldo.`,
  opts: [
    { l: 'Aceptar sin rechistar', d: 'El vestuario lo ve.', e: { fanLove: 10, trust: 8, money: -0.3, morale: -3 } },
    { l: 'Negarme', d: 'Un contrato es un contrato.', e: { fanLove: -12, trust: -8, morale: 2 } },
    { l: 'Aceptar solo si el club se compromete por escrito', d: '', e: { fanLove: 4, trust: 3, money: -0.1 } },
  ],
},

/* ---------------- AGENTE Y CARRERA ---------------- */
{
  id: 'agent_switch', cat: 'Agente', w: 6, when: (G) => P(G).age >= 18,
  title: 'Cambio de representante',
  text: () => `Una superagencia te ofrece llevarte: contactos en toda Europa, abogados, marketing. Tu agente de siempre es un amigo de tu padre.`,
  opts: [
    { l: 'Fichar por la superagencia', d: 'Se te abren puertas que ni sabías.', e: { rep: 6, money: -0.2, note: 'Tendrás más y mejores ofertas.', flag: 'superAgent' } },
    { l: 'Seguir con el de siempre', d: 'Lealtad.', e: { morale: 6, attr: { men: 1 } } },
  ],
},
{
  id: 'tapping_up', cat: 'Agente', w: 6, when: (G) => P(G).ovr >= 74,
  title: 'Una llamada que no debería existir',
  text: () => `Un director deportivo de otro club te llama directamente al móvil en pleno mes de febrero. Te dice que en verano vienen a por ti.`,
  opts: [
    { l: 'Escuchar y seguir hablando', d: 'Si se filtra, arde todo.', e: (G) => chance(0.7) ? { morale: 8, flag: 'bigOffer', note: 'Nadie se entera. Tienes una puerta abierta.' } : { trust: -16, fanLove: -14, note: 'Se filtra. La afición te silba en su propio campo.' } },
    { l: 'Colgar y contárselo al club', d: 'Puntos de lealtad.', e: { trust: 12, fanLove: 8, trait: 'loyal' } },
  ],
},
{
  id: 'agent_pressure', cat: 'Agente', w: 5, when: (G) => P(G).age >= 26 && P(G).ovr >= 78,
  title: 'La oferta del petrodólar',
  text: () => `Llega una oferta mareante desde una liga con mucho dinero y poca competición. Es cinco veces tu sueldo. Tienes 27 años.`,
  opts: [
    { l: 'Ir por el dinero', d: 'Tu carrera deportiva se congela.', e: (G) => { const c = pickW(clubsOf('KSA1').concat(clubsOf('QAT1'), clubsOf('UAE1')), (x) => x.str); G.pendingMove = c; return { money: 12, rep: -6, growth: 0.7, note: 'Tu agente empieza a negociar con el ' + c.name + '.' }; } },
    { l: 'Rechazarla', d: 'Todavía tienes cosas que ganar.', e: { morale: 5, fanLove: 6, growth: 1.05 } },
  ],
},

/* ---------------- VIDA PERSONAL ---------------- */
{
  id: 'homesick', cat: 'Vida', w: 8, when: (G) => COUNTRY_BY_CODE[P(G).country].code !== CLUB(G).country && P(G).age <= 24,
  title: 'Lejos de casa',
  text: (G) => `Llevas meses fuera. El idioma, la comida, el frío. Un día te sientas en el vestuario y te das cuenta de que no has hablado con nadie en todo el día.`,
  opts: [
    { l: 'Traerme a mi familia', d: 'Estabilidad emocional.', e: { money: -0.3, morale: 14, growth: 1.06 } },
    { l: 'Meterme en clases de idioma y salir más', d: 'Integrarte de verdad.', e: { morale: 8, trust: 6, attr: { men: 2 } } },
    { l: 'Encerrarme en el fútbol', d: 'Solo entrenar.', e: { morale: -8, growth: 1.1, rating: 0.05 } },
  ],
},
{
  id: 'relationship', cat: 'Vida', w: 7, when: (G) => P(G).age >= 19,
  title: 'Vida fuera del campo',
  text: () => `Conoces a alguien. Va en serio. También significa menos horas de vídeo y menos siestas antes de los partidos.`,
  opts: [
    { l: 'Ir en serio', d: 'Feliz fuera, quizá menos obsesivo dentro.', e: { morale: 14, growth: 0.96, injuryRisk: 0.95 } },
    { l: 'Prioridad absoluta al fútbol', d: 'Sacrificio.', e: { morale: -6, growth: 1.1, rating: 0.05 } },
  ],
},
{
  id: 'party', cat: 'Vida', w: 8, when: (G) => P(G).age <= 27,
  title: 'La noche antes',
  text: () => `Un amigo cumple años. La fiesta es el sábado y el domingo hay partido a la una. Nadie del club se va a enterar. Probablemente.`,
  opts: [
    { l: 'Ir un rato y volver pronto', d: 'Control.', e: { morale: 6, fitness: -2 } },
    { l: 'Ir hasta el final', d: 'Que sea lo que Dios quiera.', e: (G) => chance(0.65) ? { morale: 10, fitness: -8, rating: -0.12 } : { morale: -8, trust: -16, rep: -6, fanLove: -10, note: 'Salen las fotos. Portada de todos los diarios.' } },
    { l: 'Quedarme en casa', d: 'Profesional.', e: { trust: 4, rating: 0.05, morale: -3 } },
  ],
},
{
  id: 'family_illness', cat: 'Vida', w: 4,
  title: 'Una llamada a medianoche',
  text: () => `Alguien muy cercano está enfermo. El club te ofrece unos días. La temporada está en el momento decisivo.`,
  opts: [
    { l: 'Irme con los míos', d: 'Hay cosas más importantes.', e: { morale: -6, mins: 0.9, fanLove: 6, attr: { men: 3 } } },
    { l: 'Quedarme y jugar por él', d: 'Fútbol como refugio.', e: { morale: -10, rating: 0.14, form: 8 } },
  ],
},
{
  id: 'money_bad', cat: 'Dinero', w: 5, when: (G) => P(G).wage >= 1.5,
  title: 'Malas inversiones',
  text: () => `Un conocido te mete en un negocio "seguro". Restaurantes, criptomonedas, una promotora inmobiliaria. Lo típico.`,
  opts: [
    { l: 'Meter dinero fuerte', d: '', e: (G) => chance(0.4) ? { money: 2.5, morale: 6, note: 'Sale bien. Muy bien.' } : { money: -2.2, morale: -10, note: 'Lo pierdes casi todo. Menos mal que sigues jugando.' } },
    { l: 'Meter solo un poco', d: '', e: (G) => chance(0.45) ? { money: 0.5 } : { money: -0.4 } },
    { l: 'Ni tocarlo', d: 'Depósito a plazo fijo y a dormir.', e: { money: 0.1, morale: 2 } },
  ],
},

/* ---------------- TÁCTICA Y JUEGO ---------------- */
{
  id: 'set_pieces', cat: 'Juego', w: 7, when: (G) => !isGK(G),
  title: 'Las faltas son de alguien',
  text: () => `El especialista a balón parado se ha ido. El puesto está libre y hay tres candidatos en la plantilla.`,
  opts: [
    { l: 'Quedarme una hora extra cada día tirando faltas', d: '', e: (G) => chance(0.55) ? { trait: 'freekick', attr: { sho: 2 }, note: 'Son tuyas. Y se nota.' } : { attr: { sho: 1 }, fitness: -3, note: 'Se las quedan otros. Pero has mejorado el golpeo.' } },
    { l: 'No es lo mío', d: '', e: { morale: 2 } },
  ],
},
{
  id: 'penalty_taker', cat: 'Juego', w: 6, when: (G) => isAtk(G) && P(G).ovr >= 72,
  title: 'Los penaltis',
  text: () => `Nadie quiere la responsabilidad. Si los coges tú, sumas goles fáciles. Y si fallas uno en el minuto 90, ya sabes lo que pasa.`,
  opts: [
    { l: 'Los tiro yo', d: 'Más goles, más presión.', e: { goals: 1.14, rating: -0.03, rep: 3 } },
    { l: 'Que los tire otro', d: '', e: { morale: 2 } },
  ],
},
{
  id: 'press_system', cat: 'Juego', w: 6,
  title: 'Sistema nuevo',
  text: () => `El entrenador implanta un sistema de presión asfixiante. Correr el doble. Los que no lo entiendan, al banquillo.`,
  opts: [
    { l: 'Estudiar vídeo hasta aprendérmelo', d: '', e: { attr: { men: 2, phy: 1 }, trust: 8, fitness: -4, growth: 1.06 } },
    { l: 'Jugar a lo mío', d: 'Talento por encima del sistema.', e: { trust: -10, mins: 0.9, rating: 0.06 } },
  ],
},
{
  id: 'gk_distribution', cat: 'Juego', w: 6, when: isGK,
  title: 'Portero con los pies',
  text: () => `El míster quiere salir jugando desde atrás. Eso significa que vas a tocar 40 balones por partido con gente encima.`,
  opts: [
    { l: 'Adaptarme', d: 'El portero moderno.', e: { attr: { kic: 4, pos: 1 }, trait: 'sweeper', trust: 8, rating: -0.04 } },
    { l: 'Balonazo arriba y a correr', d: 'Seguro y feo.', e: { attr: { han: 2 }, trust: -6, rating: 0.04 } },
  ],
},
{
  id: 'derby_focus', cat: 'Juego', w: 6,
  title: 'Semana de derbi',
  text: (G) => `Viene el derbi. La ciudad no habla de otra cosa desde el lunes.`,
  opts: [
    { l: 'Motivarme al máximo', d: '', e: { form: 12, injuryRisk: 1.15, rating: 0.06 } },
    { l: 'Tratarlo como un partido más', d: '', e: { rating: 0.02, morale: 2 } },
  ],
},

/* ---------------- MOMENTOS DE CARRERA ---------------- */
{
  id: 'first_call', cat: 'Selección', w: 6, when: (G) => P(G).nt.caps === 0 && P(G).age >= 18 && P(G).ovr >= 70,
  title: 'Dos pasaportes',
  text: (G) => {
    const c = COUNTRY_BY_CODE[P(G).country];
    return `Te llaman de otra federación. Tienes derecho a jugar con ellos por familia. Es una selección más modesta que ${c.flag} ${c.name}, pero ahí serías fijo desde el primer día.`;
  },
  opts: [
    { l: 'Cambiar de selección', d: 'Internacional seguro, menos escaparate.', e: (G) => {
      const pool = COUNTRIES.filter((c) => c.tier >= Math.min(6, COUNTRY_BY_CODE[P(G).country].tier + 2) && c.code !== P(G).country);
      const nw = pick(pool);
      P(G).country = nw.code;
      return { morale: 6, note: 'Ahora eres internacional por ' + nw.flag + ' ' + nw.name + '.' };
    } },
    { l: 'Esperar a mi selección', d: 'Aunque no llegue nunca.', e: { morale: -2, rep: 2 } },
  ],
},
{
  id: 'youth_debut', cat: 'Club', w: 7, when: (G) => P(G).age <= 19 && CLUB(G).academy,
  title: 'Entrenar con los mayores',
  text: (G) => `El primer equipo tiene bajas y te suben a entrenar. Tienes una semana para convencer a alguien.`,
  opts: [
    { l: 'Ir a por todas desde el primer rondo', d: 'Sin miedo.', e: (G) => chance(0.5) ? { trust: 16, mins: 1.25, rep: 5, note: '¡Te quedas arriba!' } : { trust: -4, morale: -5, note: 'Te devuelven al filial. Aún no.' } },
    { l: 'Ir con respeto y aprender', d: '', e: { attr: { men: 2 }, trust: 6, growth: 1.08 } },
  ],
},
{
  id: 'rival_signing', cat: 'Club', w: 7, when: (G) => squadRole(P(G), CLUB(G)).key !== 'star',
  title: 'Te fichan un competidor',
  text: (G) => `El club paga una fortuna por un jugador de tu misma posición. Y viene con cartel de titular.`,
  opts: [
    { l: 'Pelear el puesto', d: 'A muerte.', e: { form: 10, growth: 1.08, mins: 0.98, morale: -4 } },
    { l: 'Pedir salir', d: 'Buscar minutos en otro sitio.', e: { trust: -10, flag: 'wantOut', note: 'Tu agente empieza a mover el mercado.' } },
    { l: 'Hacerme su amigo y aprender de él', d: '', e: { attr: { men: 2 }, morale: 6, growth: 1.05 } },
  ],
},
{
  id: 'relegation_fight', cat: 'Club', w: 6, when: (G) => CLUB(G).str < 72 && LG(G).tier === 1,
  title: 'Peleando abajo',
  text: (G) => `Marzo. ${clubRef(CLUB(G)).replace(/^el /,'El ').replace(/^la /,'La ')} está en descenso. El vestuario huele a miedo.`,
  opts: [
    { l: 'Dar un paso al frente y tirar del carro', d: '', e: { rating: 0.1, form: 10, fanLove: 8, fitness: -5 } },
    { l: 'Ir partido a partido, sin heroicidades', d: '', e: { morale: 2 } },
  ],
},
{
  id: 'sold_out', cat: 'Club', w: 5, when: (G) => P(G).ovr >= 80,
  title: 'Te venden sin avisar',
  text: (G) => `Te enteras por Twitter de que el club ha aceptado una oferta por ti. Nadie te ha llamado.`,
  opts: [
    { l: 'Aceptar y salir con clase', d: '', e: { rep: 3, flag: 'forceMove' } },
    { l: 'Plantarme y negarme a firmar', d: 'Se pudre todo, pero mandas tú.', e: { trust: -20, fanLove: -12, morale: -6, rep: 5 } },
  ],
},
{
  id: 'testimonial', cat: 'Club', w: 4, when: (G) => P(G).age >= 31 && P(G).fanLove >= 70,
  title: 'Partido homenaje',
  text: (G) => `El club quiere organizarte un partido homenaje a final de temporada. Estadio lleno, tus ídolos de vuelta, tu familia en el centro del campo.`,
  opts: [
    { l: 'Aceptar, emocionado', d: '', e: { fanLove: 14, morale: 14, rep: 6, money: 0.4 } },
    { l: 'Todavía no me quiero despedir', d: '', e: { form: 8, morale: 4 } },
  ],
},

/* ---------------- SITUACIONES DURAS ---------------- */
{
  id: 'racism', cat: 'Sociedad', w: 4, when: (G) => COUNTRY_BY_CODE[P(G).country].confed !== 'UEFA' || chance(0.4),
  title: 'Insultos desde la grada',
  text: () => `Un sector del campo rival te dedica insultos racistas durante todo el partido. El árbitro no para el juego.`,
  opts: [
    { l: 'Irme del campo', d: 'Un gesto que da la vuelta al mundo.', e: { rep: 12, fanLove: 10, morale: -6, note: 'Toda la liga se posiciona contigo.' } },
    { l: 'Seguir jugando y responder con un gol', d: '', e: { form: 14, rating: 0.08, morale: -8, extraGoals: 1 } },
    { l: 'Denunciarlo después en rueda de prensa', d: '', e: { rep: 8, morale: -4, attr: { men: 2 } } },
  ],
},
{
  id: 'ref_scandal', cat: 'Sociedad', w: 5,
  title: 'El árbitro',
  text: () => `Te expulsan por una entrada que no existió. El club recurre. Tú te comes tres partidos.`,
  opts: [
    { l: 'Explotar en redes', d: '', e: { rep: 5, morale: 4, mins: 0.95, note: 'Sanción extra por declaraciones.' } },
    { l: 'Aceptar y volver mejor', d: '', e: { form: 8, rating: 0.05 } },
  ],
},
{
  id: 'betting', cat: 'Sociedad', w: 3, when: (G) => P(G).age >= 20,
  title: 'Una propuesta rara',
  text: () => `Un tipo se te acerca en un hotel de concentración. Te ofrece mucho dinero por una tarjeta amarilla en un minuto concreto.`,
  opts: [
    { l: 'Denunciarlo inmediatamente', d: 'Lo correcto.', e: { rep: 6, morale: 6, attr: { men: 2 } } },
    { l: 'Hacerme el loco y alejarme', d: '', e: { morale: -2 } },
    { l: 'Escuchar cuánto ofrece', d: 'Muy mala idea.', e: (G) => chance(0.25) ? { money: 0.4, morale: -12, flag: 'dirty', note: 'Nadie se entera. Por ahora.' } : { rep: -25, fanLove: -30, trust: -30, morale: -20, mins: 0.5, note: 'Te pillan. Sanción, escándalo y tu nombre por el suelo.' } },
  ],
},
{
  id: 'burnout', cat: 'Cuerpo', w: 5, when: (G) => P(G).age >= 24 && P(G).career.apps > 180,
  title: 'Cansancio mental',
  text: () => `Llevas años sin parar: liga, copa, Europa, selección, giras de pretemporada. Un día no tienes ganas de ir a entrenar. Y eso nunca te había pasado.`,
  opts: [
    { l: 'Pedir ayuda a un psicólogo deportivo', d: '', e: { morale: 14, attr: { men: 3 }, rating: 0.06 } },
    { l: 'Pedir descanso y saltarme la gira', d: '', e: { fitness: 12, trust: -8, mins: 0.94, morale: 8 } },
    { l: 'Apretar los dientes', d: '', e: { morale: -8, injuryRisk: 1.3, rating: -0.06 } },
  ],
},
{
  id: 'comeback', cat: 'Cuerpo', w: 6, when: (G) => P(G).injuryHistory >= 2,
  title: 'La vuelta',
  text: () => `Vuelves de una lesión larga. Te da miedo el primer duelo fuerte. Lo sabes tú y lo sabe el rival.`,
  opts: [
    { l: 'Volver poco a poco', d: 'Sin prisa.', e: { injuryRisk: 0.75, mins: 0.9, growth: 0.98 } },
    { l: 'Meter la pierna en el primer balón', d: 'Quitarte el miedo de golpe.', e: (G) => chance(0.7) ? { form: 12, morale: 10, note: 'Miedo superado.' } : { injuryRisk: 1.6, morale: -10, note: 'Vuelves a notar el mismo pinchazo.' } },
  ],
},
{
  id: 'own_goal', cat: 'Juego', w: 5,
  title: 'El error',
  text: (G) => `Un fallo tuyo cuesta un partido decisivo. Está en bucle en todas las redes con música de circo.`,
  opts: [
    { l: 'Salir a dar la cara en rueda de prensa', d: '', e: { rep: 5, fanLove: 6, trust: 6, morale: -4 } },
    { l: 'Encerrarme y no hablar con nadie', d: '', e: { morale: -12, form: -10 } },
    { l: 'Usarlo como combustible', d: '', e: { form: 14, rating: 0.08, morale: -4 } },
  ],
},

/* ---------------- OPORTUNIDADES ---------------- */
{
  id: 'academy_scout', cat: 'Carrera', w: 5, when: (G) => P(G).age >= 30,
  title: 'Pensando en el futuro',
  text: () => `Un club te ofrece empezar a sacarte el título de entrenador mientras aún juegas. Robaría horas a tu descanso.`,
  opts: [
    { l: 'Sacarme el título', d: 'Entiendes mejor el juego.', e: { attr: { men: 4 }, fitness: -4, growth: 1.04, flag: 'coachBadge' } },
    { l: 'Todavía soy jugador', d: '', e: { morale: 4 } },
  ],
},
{
  id: 'legend_meeting', cat: 'Carrera', w: 5, when: (G) => P(G).ovr >= 78,
  title: 'Un ídolo te llama',
  text: () => `Una leyenda de tu posición, retirada hace años, te invita a comer. Quiere darte tres consejos. Solo tres.`,
  opts: [
    { l: 'Escuchar y aplicarlo todo', d: '', e: { attr: { men: 3 }, sp: 2, growth: 1.08, morale: 6 } },
    { l: 'Escuchar por educación', d: '', e: { morale: 3 } },
  ],
},
{
  id: 'video_game_cover', cat: 'Dinero', w: 4, when: (G) => P(G).rep >= 60,
  title: 'Portada del videojuego',
  text: () => `Te quieren en la portada del videojuego de fútbol más vendido del mundo. Millones de chavales van a jugar contigo.`,
  opts: [
    { l: 'Aceptar', d: '', e: { money: 2.2, rep: 12, fanLove: 6, trait: 'mediastar' } },
    { l: 'Rechazar', d: '', e: { morale: 3, growth: 1.03 } },
  ],
},
{
  id: 'youth_academy', cat: 'Carrera', w: 4, when: (G) => P(G).age >= 28 && P(G).wage >= 2,
  title: 'Tu propia escuela',
  text: () => `Quieres montar una escuela de fútbol gratuita en tu ciudad. Cuesta dinero y tiempo, pero es lo que hubieras querido tener de crío.`,
  opts: [
    { l: 'Montarla', d: '', e: { money: -1.2, fanLove: 16, rep: 8, morale: 12, legacyBonus: 60 } },
    { l: 'Más adelante', d: '', e: {} },
  ],
},
{
  id: 'olympics', cat: 'Selección', w: 4, when: (G) => P(G).age <= 23 && P(G).nt.caps > 0,
  title: 'Los Juegos Olímpicos',
  text: () => `La selección olímpica te quiere, pero tu club se niega a cederte: son seis semanas en pleno verano.`,
  opts: [
    { l: 'Presionar para ir', d: 'Un sueño.', e: { trust: -10, fitness: -8, rep: 6, morale: 10, flag: 'olympics' } },
    { l: 'Quedarme e ir a la pretemporada', d: '', e: { trust: 8, fitness: 6 } },
  ],
},
{
  id: 'winter_window', cat: 'Club', w: 6, when: (G) => P(G).age >= 19,
  title: 'Mercado de invierno',
  text: () => `Enero. Llega una oferta a mitad de temporada. Salir ahora significa romper el año por la mitad.`,
  opts: [
    { l: 'Escuchar la oferta', d: '', e: { flag: 'winterMove', morale: 4, trust: -6, note: 'Tu cabeza ya está en otro sitio.' } },
    { l: 'Terminar la temporada aquí', d: '', e: { trust: 8, fanLove: 6, form: 6 } },
  ],
},
{
  id: 'shirt_number', cat: 'Club', w: 5, when: (G) => P(G).fanLove >= 60,
  title: 'El dorsal mítico',
  text: (G) => `Queda libre el dorsal más importante del club. Llevarlo es un honor y una lápida: el que lo llevó antes es una leyenda.`,
  opts: [
    { l: 'Cogerlo', d: 'Presión máxima.', e: (G) => { P(G).number = pick([7, 9, 10, 1, 4]); return { rep: 8, fanLove: 6, rating: -0.04, form: 6, note: 'Ahora llevas el ' + P(G).number + '.' }; } },
    { l: 'Dejarlo libre por respeto', d: '', e: { fanLove: 6, morale: 4 } },
  ],
},
];

/* ============================================================
   MOMENTOS CLAVE (interactivos, con probabilidad real)
   ============================================================ */
const MOMENTS = [
{
  id: 'last_minute', when: (G) => !isGK(G),
  title: 'Minuto 89',
  text: (G) => `Empate a uno. Balón suelto en la frontal del área. Te sale a los pies y el estadio se levanta.`,
  opts: [
    { l: 'Chutar a puerta', a: ['sho', 'men'], base: 0.34,
      win: { text: '¡GOLAZO! Se cuela por la escuadra. El campo se cae.', e: { extraGoals: 1, form: 14, fanLove: 10, rep: 5, rating: 0.08 } },
      lose: { text: 'Se te va por encima del larguero. Silencio incómodo.', e: { form: -6, morale: -4 } } },
    { l: 'Buscar el pase al compañero mejor colocado', a: ['pas', 'men'], base: 0.52,
      win: { text: 'Pase medido y gol de tu compañero. Asistencia y abrazo.', e: { assists: 1.1, form: 8, trust: 6, rating: 0.05 } },
      lose: { text: 'El pase sale largo. Ocasión perdida.', e: { form: -3 } } },
    { l: 'Encarar y buscar el penalti', a: ['dri', 'pac'], base: 0.30,
      win: { text: 'Te llevas al defensa por delante. ¡Penalti y amarilla para él!', e: { extraGoals: 1, rep: 4, form: 10 } },
      lose: { text: 'El árbitro entiende que te has tirado. Amarilla para ti.', e: { form: -8, rep: -3 } } },
  ],
},
{
  id: 'penalty_final', when: (G) => !isGK(G) && G.player.ovr >= 68,
  title: 'Penalti en la final',
  text: () => `Tanda de penaltis. Quinto lanzamiento. Si marcas, título. Ochenta mil personas y tú.`,
  clutch: true,
  opts: [
    { l: 'Fuerte y a un lado', a: ['sho', 'men'], base: 0.74,
      win: { text: '¡Lo revientas! Título. La gente salta las vallas.', e: { form: 18, fanLove: 16, rep: 10, morale: 15, rating: 0.1 } },
      lose: { text: 'El portero adivina. Te quedas mirando el césped.', e: { morale: -18, form: -12, fanLove: -6 } } },
    { l: 'Panenka', a: ['men', 'dri'], base: 0.52,
      win: { text: 'Picada al centro. El portero se tira. Icono instantáneo.', e: { form: 20, fanLove: 20, rep: 16, morale: 18, trait: 'clutch' } },
      lose: { text: 'El portero se queda quieto. La atrapa con las manos. Meme eterno.', e: { morale: -25, rep: -10, fanLove: -14, form: -16 } } },
    { l: 'Esperar al portero y colocarla', a: ['men', 'sho'], base: 0.68,
      win: { text: 'Frío como el hielo. Dentro.', e: { form: 15, fanLove: 12, rep: 8, morale: 12 } },
      lose: { text: 'Se te va rozando el palo. Silencio.', e: { morale: -16, form: -10 } } },
  ],
},
{
  id: 'gk_penalty', when: isGK,
  title: 'Penalti en el 92',
  text: () => `Le pitan penalti a tu equipo en el último minuto. Vas ganando 1-0. Todo depende de ti.`,
  clutch: true,
  opts: [
    { l: 'Estudiar su carrera y esperar', a: ['pos', 'men'], base: 0.28,
      win: { text: '¡PARADÓN! Te quedas quieto y la sacas con el pie. Locura.', e: { form: 20, fanLove: 18, rep: 12, rating: 0.12 } },
      lose: { text: 'La coloca abajo. Empate en el último suspiro.', e: { form: -8, morale: -6 } } },
    { l: 'Tirarme antes a un lado', a: ['ref'], base: 0.22,
      win: { text: '¡Adivinas el lado y la sacas! El estadio explota.', e: { form: 18, fanLove: 15, rep: 10 } },
      lose: { text: 'Te tiras antes de tiempo y la manda al otro lado.', e: { form: -6 } } },
    { l: 'Calentarle la cabeza al lanzador', a: ['men'], base: 0.34,
      win: { text: 'Le dices dos cosas al oído. La manda a la grada.', e: { form: 16, rep: 8, trait: 'clutch' } },
      lose: { text: 'Ni caso. Gol y el árbitro te amonesta.', e: { form: -8, rep: -3 } } },
  ],
},
{
  id: 'derby_moment',
  title: 'Derbi, minuto 70',
  text: (G) => `0-0 en el derbi. El rival más duro te está buscando desde el minuto uno. Te acaba de dar un codazo sin balón delante del árbitro.`,
  opts: [
    { l: 'Devolvérsela', a: ['phy', 'men'], base: 0.35,
      win: { text: 'Le ganas el duelo físico. Se retira lesionado y el campo corea tu nombre.', e: { form: 12, fanLove: 12, rep: 4 } },
      lose: { text: 'Roja directa. Dejas al equipo con diez.', e: { form: -14, trust: -14, fanLove: -8, morale: -10 } } },
    { l: 'Ignorarlo y jugar', a: ['men'], base: 0.72,
      win: { text: 'Te concentras y das la asistencia del partido. La mejor venganza.', e: { assists: 1.12, form: 10, trust: 8 } },
      lose: { text: 'Te come la cabeza todo el partido. No apareces.', e: { rating: -0.08, form: -6 } } },
    { l: 'Provocarle para que se caliente él', a: ['men', 'dri'], base: 0.5,
      win: { text: 'Pica. Roja para él. Superioridad y victoria.', e: { form: 12, rep: 5, rating: 0.05 } },
      lose: { text: 'Os expulsan a los dos. El míster está furioso.', e: { trust: -10, form: -8 } } },
  ],
},
{
  id: 'ucl_night', when: (G) => G.euro && G.euro[(G.club.parent || G.club.id)],
  title: 'Noche europea',
  text: (G) => `Himno de la Champions. Estadio lleno. Enfrente, uno de los mejores equipos del continente y tú en el once.`,
  opts: [
    { l: 'Salir a comerme el mundo', a: ['men', 'pac', 'ref'], base: 0.46,
      win: { text: 'Partidazo. Al día siguiente estás en las portadas de media Europa.', e: { rep: 14, form: 14, rating: 0.1, growth: 1.08 } },
      lose: { text: 'Te viene grande. Cambio en el descanso.', e: { morale: -10, trust: -6, form: -8 } } },
    { l: 'Jugar sencillo y no fallar', a: ['men', 'pas', 'pos'], base: 0.72,
      win: { text: 'Discreto pero impecable. El míster lo valora.', e: { trust: 8, rating: 0.05, growth: 1.03 } },
      lose: { text: 'Un error tuyo acaba en gol. Larga noche.', e: { morale: -8, trust: -8 } } },
  ],
},
{
  id: 'debut',
  title: 'Tu debut',
  text: (G) => `Calientas en la banda. El míster te mira, mira el marcador y te llama. Vas a debutar con ${clubRef(G.club)}.`,
  opts: [
    { l: 'Pedir el balón desde el primer segundo', a: ['men', 'dri', 'ref'], base: 0.48,
      win: { text: 'Cuatro toques, un regate y una ovación. Nadie olvida un debut así.', e: { form: 14, trust: 12, fanLove: 10, rep: 6, sp: 1 } },
      lose: { text: 'Nervios. Pierdes tres balones seguidos y te sustituyen.', e: { morale: -8, trust: -5 } } },
    { l: 'Ir a lo seguro', a: ['men'], base: 0.78,
      win: { text: 'Sin alardes, sin errores. Debut cumplido.', e: { trust: 6, morale: 8, sp: 1 } },
      lose: { text: 'Se te ve pequeño en el campo. Al banquillo.', e: { morale: -6 } } },
  ],
},
{
  id: 'title_decider',
  title: 'Última jornada',
  text: (G) => `Depende de vosotros. Si ganáis, título. Si empatáis, se lo lleva el otro. Minuto 80, 1-1, y llega un balón a tu zona.`,
  clutch: true,
  opts: [
    { l: 'Asumir el riesgo', a: ['sho', 'dri', 'ref'], base: 0.38,
      win: { text: '¡La metes! Campeones. Te llevan a hombros hasta el vestuario.', e: { extraGoals: 1, form: 20, fanLove: 22, rep: 14, morale: 18 } },
      lose: { text: 'Fallas y en el contragolpe encajáis. Se escapa la liga.', e: { form: -16, fanLove: -14, morale: -18 } } },
    { l: 'Jugar en corto y sostener el balón', a: ['pas', 'men'], base: 0.62,
      win: { text: 'Aguantáis el resultado y los otros pinchan. ¡Campeones por los pelos!', e: { form: 14, fanLove: 12, morale: 14, trust: 10 } },
      lose: { text: 'Os acorralan y encajáis en el 90. Se acabó.', e: { form: -12, morale: -14 } } },
  ],
},
{
  id: 'transfer_ultimatum', when: (G) => G.player.age >= 21 && G.player.ovr >= 75,
  title: 'Último día de mercado',
  text: () => `Quedan cuatro horas. Un club grande ha puesto el dinero sobre la mesa. Tu club dice que no te vende. Tu agente te dice que fuerces la máquina.`,
  opts: [
    { l: 'Forzar la salida', a: ['men'], base: 0.5,
      win: { text: 'El club cede a última hora. Te vas.', e: { rep: 6, morale: 10, flag: 'forceMove', note: 'Saldrás en el mercado de verano sí o sí.' } },
      lose: { text: 'Se cierra el mercado y sigues aquí. Con todos enfadados.', e: { trust: -18, fanLove: -14, morale: -10 } } },
    { l: 'Quedarme y darlo todo', a: ['men'], base: 0.85,
      win: { text: 'La afición te lo reconoce. Eres uno de los suyos.', e: { fanLove: 14, trust: 10, form: 8 } },
      lose: { text: 'Te quedas, pero la cabeza sigue en la otra ciudad.', e: { form: -8, morale: -6 } } },
  ],
},
{
  id: 'injury_moment',
  title: 'Sensación rara',
  text: () => `Sprint largo, minuto 60, y notas un tirón en el gemelo. Puedes seguir. Probablemente.`,
  opts: [
    { l: 'Pedir el cambio', a: ['men'], base: 0.9,
      win: { text: 'Sales a tiempo. Una semana de descanso y listo.', e: { injuryRisk: 0.8, fitness: 4 } },
      lose: { text: 'Aun así, la resonancia dice rotura pequeña.', e: { injuryRisk: 1.2 } } },
    { l: 'Aguantar hasta el final', a: ['phy', 'men'], base: 0.4,
      win: { text: 'Aguantas y marcas en el 88. Épico.', e: { extraGoals: 1, form: 12, fanLove: 10 } },
      lose: { text: 'Rotura. Seis semanas fuera por no parar a tiempo.', e: { injuryRisk: 2.1, morale: -10 } } },
  ],
},
{
  id: 'young_talent', when: (G) => G.player.age >= 27,
  title: 'El chaval de la cantera',
  text: () => `Un chico de 17 años entrena con vosotros y es distinto. Juega en tu posición. La prensa ya lo llama "el nuevo tú".`,
  opts: [
    { l: 'Apadrinarle', a: ['men'], base: 0.85,
      win: { text: 'Le ayudas y el vestuario entero lo ve. Tu figura crece.', e: { fanLove: 10, trust: 10, rep: 4, legacyBonus: 40 } },
      lose: { text: 'Te come el puesto más rápido de lo que pensabas.', e: { mins: 0.85, morale: -8 } } },
    { l: 'Marcar territorio', a: ['men', 'phy'], base: 0.55,
      win: { text: 'Le pasas por encima en los entrenamientos. Mensaje claro.', e: { form: 10, mins: 1.06 } },
      lose: { text: 'Queda feo y el vestuario se pone de su lado.', e: { trust: -10, fanLove: -8 } } },
  ],
},
];

/* ---------- Probabilidad de un momento clave ---------- */
function momentChance(G, opt) {
  const p = G.player;
  const attrs = (opt.a || []).filter((k) => p.attrs[k] != null);
  const avg = attrs.length ? attrs.reduce((s, k) => s + p.attrs[k], 0) / attrs.length : p.ovr;
  let prob = opt.base + (avg - 62) * 0.0075 + (p.form / 900) + (p.morale - 60) / 1400;
  if (p.traits.includes('clutch')) prob += 0.09;
  if (p.traits.includes('hothead') && opt.base < 0.5) prob -= 0.03;
  return clamp(prob, 0.05, 0.95);
}
