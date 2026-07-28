/* ============================================================
   CONTENIDO EXTRA: RIESGOS DE CARRERA, PUESTO A PUESTO Y MÁS VIDA
   ============================================================
   Se añade a EVENTS/MOMENTS ya definidos. Tres bloques:
     1. Sucesos rarísimos que pueden partir una carrera por la mitad.
     2. Situaciones propias de cada posición.
     3. Más vida alrededor del vestuario, el club y la calle.
*/

const isMid = (G) => ['DM', 'CM', 'AM'].includes(G.player.pos);
const isWing = (G) => ['LW', 'RW'].includes(G.player.pos);
const isFull = (G) => ['LB', 'RB'].includes(G.player.pos);
const isCB = (G) => G.player.pos === 'CB';
const isST = (G) => G.player.pos === 'ST';
const bigClub = (G) => (G.club.str || 0) >= 78;

/* Elegir el atributo más importante del puesto: sirve para eventos que premian
   justo lo tuyo sin tener que escribir uno por posición. */
function topAttrKey(p) {
  const w = WEIGHTS[p.pos];
  return Object.keys(w).sort((a, b) => w[b] - w[a])[0];
}

/* ============================================================
   1. LO QUE PUEDE ARRUINARTE LA CARRERA
   ============================================================
   Pesos ridículos y `once`: puedes jugar diez carreras sin ver ninguno. Pero si
   sale y eliges mal, no hay vuelta atrás. Van marcados con `danger` para que el
   juego avise siempre de que ahí te la estás jugando de verdad. */
const RISK_EVENTS = [
{
  id: 'x_supplement', cat: 'Riesgo', w: 0.5, once: true, when: (G) => P(G).age >= 19,
  title: 'El bote sin etiqueta',
  text: () => `Un preparador que no es del club te pasa un bote sin etiqueta. "Es legal, lo toma media Europa, en tres meses eres otro". Nadie del club lo sabe.`,
  opts: [
    { l: 'Tomarlo', d: 'Nadie se va a enterar.', danger: true, e: (G) => {
        const p = G.player;
        if (chance(0.24)) {
          p.flags.doped = 1;
          return { ban: 46, rep: -32, fanLove: -40, morale: -30, trait: 'judas', potential: -5,
            note: 'Control antidopaje en marzo. Positivo. Dos años de sanción, de los que cumples uno entero fuera del fútbol. Tu nombre ya siempre lleva un asterisco.' };
        }
        return { growth: 1.32, fitness: 14, attr: { phy: 3, pac: 2 }, morale: -4,
          note: 'Funciona. Corres más que nunca y nadie pregunta. Duermes un poco peor, eso sí.' };
      } },
    { l: 'Decir que no y callarme', d: '', e: { morale: 4, growth: 1.0 } },
    { l: 'Contárselo al club', d: 'Se acabó para él, y para varios más.', e: { trust: 12, rep: 6, morale: -6, fanLove: 4 } },
  ],
},
{
  id: 'x_betting', cat: 'Riesgo', w: 0.45, once: true, when: (G) => P(G).age >= 20,
  title: 'Una apuesta tonta',
  text: () => `Un amigo de toda la vida te pide un favor: que veas una amarilla en el minuto que él te diga. "Es una apuesta pequeña, no cambia nada del partido".`,
  opts: [
    { l: 'Hacerle el favor', d: 'Es una amarilla. Qué más da.', danger: true, e: (G) => {
        if (chance(0.3)) {
          return { ban: 34, rep: -28, fanLove: -30, trust: -30, money: -3, trait: 'judas',
            note: 'La casa de apuestas detecta el patrón y avisa a la federación. Amaño. Sales en todos los telediarios y el club te aparta del vestuario.' };
        }
        return { money: 1.4, morale: -8, note: 'Sale bien. Cobras. Y a partir de hoy duermes mirando el móvil.' };
      } },
    { l: 'Negarme y cortar con él', d: 'Duele, pero es lo que hay.', e: { morale: -8, attr: { men: 2 } } },
    { l: 'Avisar al departamento de integridad del club', d: '', e: { trust: 10, rep: 4, morale: -10 } },
  ],
},
{
  id: 'x_fix', cat: 'Riesgo', w: 0.3, once: true, when: (G) => (LG(G).tier === 2 || CLUB(G).str < 68) && P(G).age >= 21,
  title: 'La visita en el aparcamiento',
  text: () => `Dos tíos te esperan en el aparcamiento del estadio. Saben dónde vives y cuánto ganas. Solo quieren que el domingo el equipo encaje dos goles en la primera parte. Hay un maletín.`,
  opts: [
    { l: 'Coger el maletín', d: 'Es mucho dinero y es un partido de nada.', danger: true, e: (G) => {
        if (chance(0.35)) {
          return { ban: 72, rep: -45, fanLove: -50, trust: -40, money: 5, trait: 'judas', potential: -8,
            note: 'La UEFA lleva meses siguiendo esa red. Te caen cuatro años. Cuando puedas volver, no vas a ser jugador de fútbol: vas a ser un titular de periódico.' };
        }
        return { money: 5, morale: -22, form: -10, note: 'Nadie investiga nada. Cobras y no vuelves a dormir igual.' };
      } },
    { l: 'Mandarles a la mierda', d: 'Y mirar por el retrovisor un tiempo.', e: { morale: -12, attr: { men: 3 }, fitness: -4 } },
    { l: 'Denunciarlo a la policía', d: 'Con protección y todo.', e: { rep: 10, trust: 12, morale: -14, mins: 0.94, note: 'Declaras. El caso salpica a media liga y tú acabas escoltado un año entero.' } },
  ],
},
{
  id: 'x_crash', cat: 'Riesgo', w: 0.5, once: true, when: (G) => P(G).age >= 18,
  title: 'Las cuatro de la mañana',
  text: () => `Sales de una fiesta con el coche en la puerta. Has bebido. Está a diez minutos de casa y no hay nadie en la carretera.`,
  opts: [
    { l: 'Conducir', d: 'Diez minutos.', danger: true, e: (G) => {
        if (chance(0.28)) {
          return { ban: 16, rep: -25, fanLove: -22, trust: -20, money: -2.5, potential: -7, proneness: 1.55, attr: { pac: -4, phy: -3 },
            note: 'Te sales en una rotonda. Fractura de tibia y peroné, cinco meses de quirófano y rehabilitación, y una portada con tu coche destrozado. Nunca vuelves a correr igual.' };
        }
        return { morale: -4, note: 'Llegas a casa. Al día siguiente te tiemblan las manos al recordarlo.' };
      } },
    { l: 'Llamar a un taxi', d: '', e: { money: -0.02, morale: 2 } },
    { l: 'Dormir allí mismo', d: 'Y aparecer tarde al entrenamiento.', e: { trust: -6, fitness: -4, morale: 4 } },
  ],
},
{
  id: 'x_surgeon', cat: 'Riesgo', w: 0.5, once: true, when: (G) => P(G).injuryHistory >= 2 && P(G).age >= 21,
  title: 'El cirujano milagroso',
  text: () => `Tu rodilla no termina de ir. Un agente te habla de un cirujano en el extranjero: técnica no homologada, mitad de tiempo de recuperación, la mitad de sus pacientes vuelven mejor que antes. La otra mitad no vuelve.`,
  opts: [
    { l: 'Operarme con él', d: 'O vuelves entero, o no vuelves.', danger: true, e: (G) => {
        if (chance(0.52)) {
          return { injuryRisk: 0.6, proneness: 0.7, fitness: 16, attr: { pac: 3, phy: 2 }, money: -1.2, morale: 12,
            note: 'Sale perfecto. La rodilla aguanta como no aguantaba desde los veinte. Le debes media carrera.' };
        }
        return { potential: -9, proneness: 1.7, injuryRisk: 1.5, attr: { pac: -6, phy: -4 }, money: -1.2, morale: -20,
          note: 'La articulación queda rígida. Ocho meses parado y una carrera que a partir de ahora es cuesta arriba.' };
      } },
    { l: 'Seguir el protocolo del club', d: 'Lento, aburrido, seguro.', e: { mins: 0.86, injuryRisk: 0.86, fitness: 6, morale: -4 } },
    { l: 'Infiltrarme y tirar hacia delante', d: '', e: { proneness: 1.3, injuryRisk: 1.4, trust: 8, rating: 0.04 } },
  ],
},
{
  id: 'x_tax', cat: 'Riesgo', w: 0.45, once: true, when: (G) => P(G).wage >= 2,
  title: 'La estructura del asesor',
  text: () => `Tu asesor te presenta un esquema de sociedades para los derechos de imagen. "Lo tiene medio vestuario". Tú no entiendes ni la mitad de lo que te enseña.`,
  opts: [
    { l: 'Firmar donde me diga', d: 'Para eso le pagas.', danger: true, e: (G) => {
        if (chance(0.34)) {
          return { money: -9, rep: -18, fanLove: -14, morale: -18, mins: 0.94,
            note: 'Cuatro años después llega la inspección. Multa millonaria, juicio y titulares durante meses. Te comes tú lo que firmó él.' };
        }
        return { money: 3.2, note: 'Ahorras una fortuna en impuestos. Legal, dice él.' };
      } },
    { l: 'Pagar lo que toca y dormir tranquilo', d: '', e: { money: -0.6, morale: 6 } },
    { l: 'Buscar un segundo asesor que lo revise', d: '', e: { money: -0.2, rep: 2, morale: 4, flag: 'cleanMoney' } },
  ],
},
{
  id: 'x_holiday', cat: 'Riesgo', w: 0.5, once: true, when: (G) => P(G).age >= 19,
  title: 'Vacaciones',
  text: () => `Junio. Un amigo te ha alquilado una moto de agua y otro te habla de hacer heliesquí en Sudamérica. El contrato prohíbe las dos cosas.`,
  opts: [
    { l: 'Ir a por todas', d: 'Son tus vacaciones.', danger: true, e: (G) => {
        if (chance(0.22)) {
          return { ban: 6, potential: -6, proneness: 1.5, injuryRisk: 1.45, money: -1.5, trust: -18, attr: { phy: -3 },
            note: 'Caída fea. Hombro reconstruido, pretemporada entera perdida y el club estudiando romperte el contrato por incumplimiento.' };
        }
        return { morale: 16, fitness: -5, note: 'El mejor verano de tu vida. Vuelves feliz y algo fuera de forma.' };
      } },
    { l: 'Playa, familia y gimnasio', d: '', e: { fitness: 10, morale: 6, growth: 1.04 } },
    { l: 'No parar: pretemporada por mi cuenta', d: '', e: { growth: 1.1, fitness: 8, morale: -8, injuryRisk: 1.12 } },
  ],
},
{
  id: 'x_leak', cat: 'Riesgo', w: 0.5, once: true, when: (G) => P(G).rep >= 55,
  title: 'El vídeo',
  text: () => `A las siete de la mañana tu teléfono no para. Se ha filtrado un vídeo tuyo de una noche privada. No es delito, pero es humillante y está en todas partes.`,
  opts: [
    { l: 'Salir a dar la cara en rueda de prensa', d: '', danger: true, e: (G) => {
        if (chance(0.6)) return { rep: 8, fanLove: 12, morale: 6, attr: { men: 3 }, note: 'Hablas claro, sin excusas. Media liga sale a defenderte. Sales más grande de lo que entraste.' };
        return { rep: -12, fanLove: -14, morale: -22, form: -14, note: 'Te derrumbas delante de treinta cámaras. Ese trozo de vídeo dura más que el original.' };
      } },
    { l: 'Silencio absoluto y abogados', d: '', e: { money: -0.8, morale: -10, rep: -4, form: -6 } },
    { l: 'Pedir la baja unas semanas', d: 'La cabeza también se lesiona.', e: { mins: 0.82, morale: 14, trust: -8, attr: { men: 2 } } },
  ],
},
{
  id: 'x_revenge_tackle', cat: 'Riesgo', w: 0.4, once: true, when: (G) => !isGK(G) && P(G).age >= 20,
  title: 'La pierna',
  text: () => `El que te partió el tobillo hace dos años viene de frente con el balón dividido. Sabes exactamente cómo entrarle para que no vuelva a jugar en un año.`,
  opts: [
    { l: 'Entrarle a matar', d: 'Es tu momento.', danger: true, e: (G) => {
        if (chance(0.55)) {
          return { ban: 14, rep: -14, fanLove: -8, trust: -20, trait: 'hothead', morale: -12,
            note: 'Se queda tendido y no se levanta. Roja, doce partidos de sanción y una imagen que te va a perseguir en cada estadio rival.' };
        }
        return { form: 10, fanLove: 8, rep: 3, trait: 'hothead', note: 'Llegas duro pero limpio. Se levanta tocado y ya no vuelve a buscarte.' };
      } },
    { l: 'Ganarle el balón y seguir', d: '', e: { rating: 0.04, attr: { men: 2 }, trust: 5 } },
    { l: 'Dejarlo pasar', d: 'Ya no te interesa.', e: { morale: 6, attr: { men: 3 } } },
  ],
},
{
  id: 'x_superagent', cat: 'Riesgo', w: 0.6, once: true, when: (G) => P(G).age <= 21 && P(G).pot - P(G).ovr >= 6,
  title: 'El agente que mueve Europa',
  text: () => `El agente más poderoso del continente quiere representarte. Te promete puertas que no se abren solas. A cambio pide un porcentaje de todo lo que ganes el resto de tu vida.`,
  opts: [
    { l: 'Firmar con él', d: 'Puertas abiertas, bolsillo más vacío.', e: { flag: 'superAgent', wageCut: 0.82, rep: 10, morale: 6 } },
    { l: 'Seguir con el agente de siempre', d: 'Es de casa.', e: { morale: 8, fanLove: 4 } },
    { l: 'Representarme yo mismo', d: 'Con un abogado y mucha cara.', danger: true, e: (G) => {
        if (chance(0.45)) return { money: 2, rep: 5, attr: { men: 3 }, note: 'Negocias tú y te llevas hasta el último euro. Te respetan más de lo que esperabas.' };
        return { money: -1, rep: -8, mins: 0.9, morale: -12, note: 'Te comen vivo. Firmas un contrato con cláusulas que no entendiste y te quedas encerrado.' };
      } },
  ],
},
{
  id: 'x_burnout', cat: 'Riesgo', w: 0.45, once: true, when: (G) => P(G).age >= 24 && P(G).career.seasons >= 6,
  title: 'No quiero ir a entrenar',
  text: () => `Llevas tres semanas con un nudo en el estómago cada mañana. No es el cuerpo. Es que no quieres entrar por esa puerta.`,
  opts: [
    { l: 'Aguantar y no decir nada', d: 'Los futbolistas no se cansan.', danger: true, e: (G) => {
        if (chance(0.45)) return { potential: -5, morale: -25, form: -18, rating: -0.12, growth: 0.85,
          note: 'Te rompes por dentro a mitad de temporada. Meses en blanco de los que no se recupera un jugador entero.' };
        return { morale: -10, attr: { men: 2 }, note: 'Aguantas el tirón. Se te pasa. Esta vez.' };
      } },
    { l: 'Parar dos meses y tratarme', d: 'Pierdes media temporada.', e: { mins: 0.6, morale: 24, attr: { men: 5 }, growth: 1.06, trust: -8 } },
    { l: 'Hablarlo con el míster y bajar carga', d: '', e: { mins: 0.9, morale: 14, trust: 6, attr: { men: 3 } } },
  ],
},
{
  id: 'x_captain_mutiny', cat: 'Riesgo', w: 0.5, once: true, when: (G) => P(G).age >= 25 && P(G).rep >= 55,
  title: 'El motín',
  text: () => `Medio vestuario quiere echar al entrenador y te piden que seas tú quien se lo diga al presidente. Si sale bien, mandas tú en el club. Si sale mal, te vas tú.`,
  opts: [
    { l: 'Encabezar el motín', d: 'Todo o nada.', danger: true, e: (G) => {
        if (chance(0.5)) return { trust: 20, rep: 12, fanLove: 8, mins: 1.12, morale: 12, trait: 'leader',
          note: 'Cae el entrenador. El nuevo llega preguntándote a ti cómo quieres jugar.' };
        return { trust: -35, mins: 0.55, fanLove: -18, morale: -22, flag: 'forceMove',
          note: 'El presidente respalda al míster y filtra tu nombre. Te entrenas aparte hasta que alguien te saque de aquí.' };
      } },
    { l: 'Avisar al entrenador de lo que se cuece', d: '', e: { trust: 22, mins: 1.08, morale: -6, fanLove: -4 } },
    { l: 'No meterme', d: '', e: { morale: 2 } },
  ],
},
];

/* ============================================================
   2. CADA PUESTO, SU VIDA
   ============================================================ */
const POS_EVENTS = [
/* ---- PORTERO ---- */
{
  id: 'gk_howler', cat: 'Portería', w: 9, when: isGK,
  title: 'El fallo',
  text: () => `Se te escurre un balón inofensivo entre las manos y entra. El resumen de la jornada abre contigo y el vídeo ya tiene música de circo.`,
  opts: [
    { l: 'Salir a hablar y reírme de mí mismo', d: '', e: { rep: 6, fanLove: 8, morale: 6, attr: { men: 2 } } },
    { l: 'Encerrarme a trabajar el blocaje', d: '', e: { attr: { han: 3, pos: 1 }, morale: -6, growth: 1.06 } },
    { l: 'Culpar al balón y al césped', d: '', e: { rep: -6, fanLove: -8, trust: -6, morale: 4 } },
  ],
},
{
  id: 'gk_sweeper_order', cat: 'Portería', w: 9, when: isGK,
  title: 'Portero-líbero',
  text: () => `El nuevo entrenador quiere que juegues veinte metros fuera del área y saques jugando bajo presión. Es otro deporte respecto a lo que te enseñaron.`,
  opts: [
    { l: 'Adaptarme del todo', d: 'Vas a regalar algún gol por el camino.', e: { attr: { kic: 4, pos: 2, ref: -1 }, trait: 'sweeper', rating: -0.05, growth: 1.08 } },
    { l: 'Quedarme en la línea', d: 'Lo que sabes hacer.', e: { attr: { ref: 2, han: 1 }, trust: -8, mins: 0.92 } },
    { l: 'Negociar un término medio', d: '', e: { attr: { kic: 2, pos: 1 }, trust: 4 } },
  ],
},
{
  id: 'gk_number_one', cat: 'Portería', w: 10, when: (G) => isGK(G) && P(G).age <= 26,
  title: 'La camiseta de titular',
  text: (G) => `El club ficha a un portero con nombre. Uno de los dos va a jugar treinta partidos y el otro va a jugar la copa.`,
  opts: [
    { l: 'Pedir una final: quien mejor lo haga en pretemporada', d: '', e: { mins: 1.1, morale: -6, rating: -0.04, trust: 6 } },
    { l: 'Trabajar callado y esperar mi momento', d: '', e: { mins: 0.82, growth: 1.1, attr: { men: 2 }, trust: 4 } },
    { l: 'Pedir salir cedido a jugarlo todo', d: '', e: { flag: 'wantLoan', morale: 4 } },
  ],
},
{
  id: 'gk_penalty_lab', cat: 'Portería', w: 8, when: isGK,
  title: 'El cuaderno de penaltis',
  text: () => `Un analista te ofrece un dossier con los últimos doscientos penaltis de la liga: pie de apoyo, mirada, altura del tobillo. Son horas y horas de vídeo.`,
  opts: [
    { l: 'Estudiármelo entero', d: '', e: { attr: { pos: 3, men: 2 }, morale: -4, rating: 0.05 } },
    { l: 'Fiarme del instinto', d: '', e: { attr: { ref: 2 }, morale: 4 } },
    { l: 'Contratarle para mí solo', d: '', e: { money: -0.3, attr: { pos: 3, men: 2 }, rating: 0.06, growth: 1.05 } },
  ],
},
{
  id: 'gk_talk_defence', cat: 'Portería', w: 8, when: isGK,
  title: 'La defensa no te escucha',
  text: () => `Tus centrales van a su bola. Les gritas la basculación y ni se giran. Encajáis dos goles idénticos en dos semanas.`,
  opts: [
    { l: 'Montarla en el vestuario', d: '', e: { trust: 6, morale: -6, attr: { men: 2 }, rating: 0.06 } },
    { l: 'Trabajarlo en vídeo con ellos', d: '', e: { attr: { pos: 2, men: 1 }, trust: 8, rating: 0.05 } },
    { l: 'Callarme y parar más', d: '', e: { attr: { ref: 2 }, morale: -4 } },
  ],
},

/* ---- CENTRAL ---- */
{
  id: 'cb_partner', cat: 'Defensa', w: 9, when: isCB,
  title: 'Tu pareja de baile',
  text: () => `El central veterano con el que juegas lleva quince años en esto. Te corrige cada acción y a veces delante de todos.`,
  opts: [
    { l: 'Escucharle como a un profesor', d: '', e: { attr: { def: 3, men: 2 }, growth: 1.1, morale: -4 } },
    { l: 'Plantarle cara', d: 'La pareja se rompe.', e: { attr: { men: 2 }, trust: -8, rating: -0.05, morale: 6 } },
    { l: 'Invitarle a cenar y preguntarle todo', d: '', e: { attr: { def: 2, pos: 1, men: 2 }, trust: 8, morale: 6 } },
  ],
},
{
  id: 'cb_build_up', cat: 'Defensa', w: 9, when: (G) => isCB(G) || G.player.pos === 'DM',
  title: 'Sacar jugando',
  text: () => `El míster quiere salir desde atrás contra un equipo que presiona como si les fuera la vida. Un error tuyo ahí es gol directo.`,
  opts: [
    { l: 'Asumirlo y pedir siempre el balón', d: '', e: { attr: { pas: 3, men: 2 }, rating: -0.04, growth: 1.08, trust: 8 } },
    { l: 'Pelotazo y a correr', d: '', e: { rating: 0.03, trust: -8, growth: 0.95, attr: { phy: 1 } } },
    { l: 'Trabajarlo tres semanas después de entrenar', d: '', e: { attr: { pas: 2, men: 1 }, fitness: -5, growth: 1.06 } },
  ],
},
{
  id: 'cb_striker_taunt', cat: 'Defensa', w: 8, when: isDef,
  title: 'El delantero bocazas',
  text: () => `El nueve rival lleva todo el partido hablándote al oído. Te ha llamado de todo y el árbitro está a otra cosa.`,
  opts: [
    { l: 'Devolvérsela con la lengua', d: '', e: { attr: { men: 2 }, form: 6, rating: -0.03 } },
    { l: 'Anularle sin decir una palabra', d: '', e: { rating: 0.07, attr: { def: 2, men: 2 }, trust: 6 } },
    { l: 'Buscarle las cosquillas para que le expulsen', d: '', e: { rep: -3, form: 8, rating: 0.03 } },
  ],
},
{
  id: 'cb_aerial', cat: 'Defensa', w: 8, when: (G) => isCB(G) || isGK(G),
  title: 'El balón parado',
  text: () => `Habéis encajado cinco goles de córner en dos meses. El segundo entrenador propone dedicarle una hora diaria a la defensa del área pequeña.`,
  opts: [
    { l: 'Ser el primero en apuntarme', d: '', e: { attr: { def: 2, phy: 2, aer: 3 }, trust: 8, fitness: -4 } },
    { l: 'Proponer marcaje al hombre y liderarlo', d: '', e: { attr: { men: 2, def: 2 }, trust: 10, rating: 0.05 } },
    { l: 'Decir que el problema es el portero', d: '', e: { trust: -10, morale: 4, rating: -0.03 } },
  ],
},

/* ---- LATERAL ---- */
{
  id: 'fb_roasted', cat: 'Defensa', w: 9, when: isFull,
  title: 'Te han frito',
  text: () => `El extremo rival te ha pasado seis veces. Seis. El resumen se llama "clase magistral" y sales tú de fondo.`,
  opts: [
    { l: 'Pedirle al analista todos sus vídeos', d: '', e: { attr: { def: 2, pos: 1, men: 2 }, growth: 1.08, morale: -4 } },
    { l: 'Trabajar el uno contra uno a muerte', d: '', e: { attr: { pac: 2, def: 2 }, fitness: -6, growth: 1.06 } },
    { l: 'Pedir ayuda permanente del pivote', d: '', e: { rating: 0.05, attr: { def: 1 }, trust: -4, growth: 0.97 } },
  ],
},
{
  id: 'fb_overlap', cat: 'Defensa', w: 9, when: isFull,
  title: 'Subir o no subir',
  text: () => `El equipo necesita amplitud y tú eres el que más corre del campo. Pero cada vez que subes, dejas veinte metros a tu espalda.`,
  opts: [
    { l: 'Subir siempre', d: 'Más asistencias, más sustos.', e: { assists: 1.25, goals: 1.15, rating: -0.05, fitness: -6, attr: { pac: 2 } } },
    { l: 'Quedarme y defender', d: '', e: { assists: 0.8, rating: 0.06, attr: { def: 2 }, trust: 6 } },
    { l: 'Leer cada partido', d: 'Lo difícil.', e: { attr: { men: 3, pos: 1 }, assists: 1.08, rating: 0.03 } },
  ],
},
{
  id: 'fb_to_cb', cat: 'Defensa', w: 7, when: (G) => isFull(G) && P(G).age >= 27,
  title: 'Te quieren de central',
  text: () => `Con los años has perdido medio metro. El míster te ve por dentro: menos carrera, más cabeza. Es reinventarse o ir al banquillo.`,
  opts: [
    { l: 'Reconvertirme', d: 'Alarga carreras.', e: (G) => { G.player.pos = 'CB'; return { attr: { def: 3, phy: 2, pac: -2 }, mins: 1.12, trust: 10, note: 'Te pasas a central. Nueva vida.' }; } },
    { l: 'Seguir de lateral y compensar corriendo', d: '', e: { fitness: -8, injuryRisk: 1.18, mins: 0.94, attr: { phy: 1 } } },
    { l: 'Pedir salir a un club donde siga de lateral', d: '', e: { flag: 'wantOut', morale: 4 } },
  ],
},

/* ---- MEDIO ---- */
{
  id: 'mid_tactical_foul', cat: 'Medio', w: 8, when: (G) => ['DM', 'CM'].includes(G.player.pos),
  title: 'La falta táctica',
  text: () => `El analista te enseña el dato: el equipo encaja el 40% de los goles en transición. La solución es fea: cortar cada contra con falta.`,
  opts: [
    { l: 'Convertirme en el que corta', d: 'Amarillas seguras.', e: { rating: 0.06, trust: 12, rep: -3, attr: { pos: 2 }, injuryRisk: 1.06 } },
    { l: 'Correr hacia atrás y defender de verdad', d: '', e: { fitness: -6, attr: { phy: 2, def: 2 }, rating: 0.03 } },
    { l: 'No es mi trabajo', d: '', e: { trust: -10, morale: 4 } },
  ],
},
{
  id: 'mid_no_goals', cat: 'Medio', w: 8, when: (G) => isMid(G),
  title: '"No llegas al área"',
  text: () => `La prensa dice que juegas muy bien pero no decides partidos. Los números les dan la razón: nunca apareces en el área rival.`,
  opts: [
    { l: 'Aprender la llegada desde segunda línea', d: '', e: { goals: 1.35, attr: { sho: 3 }, rating: -0.03, growth: 1.06 } },
    { l: 'Doblar mi trabajo de pase y control', d: '', e: { assists: 1.2, attr: { pas: 3 }, rating: 0.05 } },
    { l: 'Ignorar a la prensa', d: '', e: { morale: 8, attr: { men: 2 } } },
  ],
},
{
  id: 'mid_deep_or_free', cat: 'Medio', w: 9, when: (G) => isMid(G),
  title: 'Dos metros más atrás',
  text: () => `El míster te da a elegir: organizar desde muy atrás, con todo el campo delante, o jugar entre líneas y aparecer cerca del área.`,
  opts: [
    { l: 'Organizar desde atrás', d: 'Tocas mil balones.', e: { assists: 1.1, rating: 0.07, attr: { pas: 3, pos: 1 }, goals: 0.7 } },
    { l: 'Jugar entre líneas', d: 'Menos balones, más peligro.', e: { goals: 1.3, assists: 1.15, rating: -0.03, attr: { dri: 2, sho: 1 } } },
    { l: 'Box to box: los dos', d: 'Te vas a dejar los pulmones.', e: { fitness: -10, injuryRisk: 1.2, goals: 1.15, assists: 1.12, attr: { phy: 3 } } },
  ],
},
{
  id: 'mid_setpiece', cat: 'Medio', w: 8, when: (G) => (isMid(G) || isWing(G)) && !P(G).traits.includes('freekick'),
  title: 'Las faltas son de otro',
  text: () => `Las faltas y los córners los tira un compañero que lleva media temporada estrellándolas en la barrera. Puedes reclamarlas.`,
  opts: [
    { l: 'Pedírselas en público', d: '', e: { trait: 'freekick', morale: 6, trust: -6, rep: 4 } },
    { l: 'Retarle a diez tiros después de entrenar', d: '', e: (G) => (chance(0.6)
        ? { trait: 'freekick', attr: { sho: 2 }, trust: 6, note: 'Le ganas 7-3 delante de todos. Las faltas son tuyas.' }
        : { morale: -8, attr: { sho: 1 }, note: 'Te gana. Y encima ahora todos lo saben.' }) },
    { l: 'Dejarlo estar', d: '', e: { morale: 2 } },
  ],
},

/* ---- EXTREMO ---- */
{
  id: 'wg_one_v_one', cat: 'Ataque', w: 9, when: isWing,
  title: 'Encarar siempre',
  text: () => `Eres el que más regates intenta de la liga. También el que más pierde el balón. La grada te adora y el míster no duerme.`,
  opts: [
    { l: 'No cambiar nada', d: 'Eres esto.', e: { goals: 1.15, assists: 1.1, rating: -0.06, fanLove: 10, attr: { dri: 3 } } },
    { l: 'Elegir mejor el momento', d: '', e: { rating: 0.07, attr: { men: 3, pas: 1 }, assists: 1.1, trust: 8 } },
    { l: 'Añadir el pase atrás como plan B', d: '', e: { assists: 1.25, attr: { pas: 3 }, goals: 0.95 } },
  ],
},
{
  id: 'wg_inside', cat: 'Ataque', w: 9, when: isWing,
  title: 'Por dentro o por fuera',
  text: () => `Cambiándote de banda tirarías a puerta con tu pierna buena, pero perderías la línea de fondo y el centro.`,
  opts: [
    { l: 'Cambiarme de banda y tirar a puerta', d: '', e: { goals: 1.35, assists: 0.8, attr: { sho: 3 } } },
    { l: 'Quedarme a pierna natural', d: '', e: { assists: 1.3, goals: 0.9, attr: { pas: 2, pac: 1 } } },
    { l: 'Aprender las dos', d: 'Cuesta una temporada.', e: { growth: 1.12, rating: -0.05, attr: { dri: 2, sho: 1, pas: 1 } } },
  ],
},
{
  id: 'wg_track_back', cat: 'Ataque', w: 8, when: (G) => isWing(G) || isAtk(G),
  title: '"No defiendes"',
  text: () => `El lateral que tienes detrás lleva media temporada quejándose de que no bajas. Tiene razón y todo el vestuario lo sabe.`,
  opts: [
    { l: 'Bajar hasta mi área cada acción', d: '', e: { fitness: -10, trust: 14, rating: 0.03, goals: 0.9, attr: { phy: 2, def: 2 } } },
    { l: 'Decirle que su trabajo es ese', d: '', e: { trust: -12, morale: 6, rating: -0.03 } },
    { l: 'Pactar coberturas con él', d: '', e: { trust: 8, attr: { men: 2, pos: 1 }, rating: 0.04 } },
  ],
},

/* ---- DELANTERO ---- */
{
  id: 'st_drought', cat: 'Ataque', w: 10, when: isST,
  title: 'Once partidos sin marcar',
  text: () => `No entra ni con la mano. La grada ya resopla cuando te llega el balón y tú has empezado a mirar al banquillo antes de tirar.`,
  opts: [
    { l: 'Tirar más aún, hasta que entre', d: '', e: { goals: 1.2, rating: -0.06, morale: -6, attr: { sho: 2 } } },
    { l: 'Jugar para el equipo y olvidarme del gol', d: '', e: { assists: 1.35, rating: 0.06, trust: 10, goals: 0.95, attr: { pas: 2 } } },
    { l: 'Trabajar la definición con el psicólogo', d: '', e: { money: -0.15, attr: { men: 4, sho: 1 }, goals: 1.15, morale: 8 } },
  ],
},
{
  id: 'st_penalties', cat: 'Ataque', w: 8, when: (G) => isAtk(G),
  title: 'Los penaltis',
  text: () => `El capitán lleva años tirándolos. Este año hay premio al pichichi y tú vas segundo por dos goles.`,
  opts: [
    { l: 'Pedírselos al míster', d: '', e: { goals: 1.22, trust: -6, morale: 4, rep: 4 } },
    { l: 'Hablarlo con él en privado', d: '', e: (G) => (chance(0.55)
        ? { goals: 1.2, trust: 4, morale: 6, note: 'Te los cede sin dramas. Buen tío.' }
        : { morale: -6, trust: 2, note: 'Te dice que no y con razón: lleva dos años sin fallar uno.' }) },
    { l: 'Ganármelo marcando desde el juego', d: '', e: { attr: { sho: 2, men: 2 }, rating: 0.04 } },
  ],
},
{
  id: 'st_partner', cat: 'Ataque', w: 8, when: (G) => isAtk(G),
  title: 'El fichaje que juega en tu puesto',
  text: (G) => `El club paga una fortuna por un delantero de tu edad y tu perfil. En rueda de prensa le presentan como "el nueve del futuro".`,
  opts: [
    { l: 'Pedir jugar los dos juntos', d: '', e: { goals: 1.1, assists: 1.15, trust: 6, mins: 1.05 } },
    { l: 'Guerra abierta por el puesto', d: '', e: { mins: 0.95, goals: 1.18, rating: -0.04, morale: -6, attr: { men: 2 } } },
    { l: 'Adelantarme y pedir salir ya', d: '', e: { flag: 'wantOut', morale: 6 } },
  ],
},
{
  id: 'st_false_nine', cat: 'Ataque', w: 7, when: (G) => isAtk(G) && P(G).age >= 26,
  title: 'Falso nueve',
  text: () => `Ya no ganas los sprints que ganabas. El míster te propone bajar a recibir y asociarte en vez de atacar el espacio.`,
  opts: [
    { l: 'Reinventarme', d: '', e: { assists: 1.4, goals: 0.85, attr: { pas: 4, men: 2 }, mins: 1.08, growth: 1.06 } },
    { l: 'Seguir atacando la profundidad', d: '', e: { goals: 1.1, fitness: -6, injuryRisk: 1.15, mins: 0.95 } },
    { l: 'Pedir un equipo que juegue para mí', d: '', e: { flag: 'wantOut', morale: 4 } },
  ],
},
];

/* ============================================================
   3. MÁS VIDA: CLUB, CALLE, DINERO, CABEZA
   ============================================================ */
const LIFE_EVENTS = [
{
  id: 'l_academy_kid', cat: 'Vestuario', w: 8, when: (G) => P(G).age >= 26,
  title: 'El chaval de la cantera',
  text: () => `Un chico de dieciséis entrena con vosotros. Juega en tu puesto y es mejor de lo que tú eras a su edad. Te mira como si fueras un póster.`,
  opts: [
    { l: 'Apadrinarle', d: '', e: { trust: 8, fanLove: 10, legacyBonus: 45, morale: 8 } },
    { l: 'Hacerle la vida imposible', d: 'Que sufra como sufriste tú.', e: { mins: 1.06, fanLove: -10, trust: -8, morale: -4 } },
    { l: 'Ignorarle', d: '', e: {} },
  ],
},
{
  id: 'l_wage_gap', cat: 'Vestuario', w: 8, when: (G) => P(G).age >= 23,
  title: 'La lista de sueldos',
  text: () => `Se filtra la tabla salarial. Ganas la mitad que un compañero que juega mucho menos que tú.`,
  opts: [
    { l: 'Exigir renovación ya', d: '', e: (G) => (chance(0.55)
        ? { wageCut: 1.35, morale: 10, trust: -4, note: 'El club cede y te iguala. Tu agente te besa.' }
        : { morale: -12, trust: -12, mins: 0.92, note: 'El club dice que no y filtra que eres un problema.' }) },
    { l: 'Callarme y rendir', d: '', e: { rating: 0.05, morale: -6, attr: { men: 2 } } },
    { l: 'Filtrarlo a la prensa', d: '', e: { rep: 6, trust: -14, fanLove: -6, morale: 4 } },
  ],
},
{
  id: 'l_charity', cat: 'Vida', w: 7, when: (G) => P(G).money >= 1,
  title: 'El barrio',
  text: () => `El campo donde empezaste se cae a trozos. El presidente del club de tu barrio te llama para pedirte ayuda, muerto de vergüenza.`,
  opts: [
    { l: 'Pagar el campo entero', d: '', e: { money: -1.2, fanLove: 14, rep: 8, morale: 14, legacyBonus: 80 } },
    { l: 'Montar una fundación con mi nombre', d: '', e: { money: -2.2, rep: 14, fanLove: 12, legacyBonus: 140, morale: 10 } },
    { l: 'Mandar material y ya', d: '', e: { money: -0.15, morale: 4, fanLove: 3 } },
  ],
},
{
  id: 'l_invest_bar', cat: 'Dinero', w: 7, when: (G) => P(G).money >= 1.5,
  title: 'El negocio del primo',
  text: () => `Tu primo tiene "la idea del siglo" y solo necesita que pongas el dinero. En el fútbol esta historia acaba mal nueve de cada diez veces.`,
  opts: [
    { l: 'Poner el dinero', d: '', e: (G) => (chance(0.3)
        ? { money: 2.6, morale: 10, note: 'Funciona. Tienes ingresos que no dependen de tus rodillas.' }
        : { money: -1.6, morale: -12, note: 'Cierra en un año. Adiós al dinero y casi a la familia.' }) },
    { l: 'Prestarle una parte y firmar papeles', d: '', e: { money: -0.4, morale: 2 } },
    { l: 'Decirle que no', d: '', e: { morale: -6, money: 0.1 } },
  ],
},
{
  id: 'l_property', cat: 'Dinero', w: 7, when: (G) => P(G).money >= 3,
  title: 'Ladrillo',
  text: () => `Un asesor te propone meter buena parte de lo que tienes en pisos. Aburrido, seguro y a treinta años vista.`,
  opts: [
    { l: 'Invertir a lo grande', d: 'Se te queda la cuenta seca ahora.', e: { money: -3, flag: 'landlord', morale: 6, note: 'Firmas la compra. Dentro de unos años lo vas a agradecer.' } },
    { l: 'Invertir una parte', d: '', e: { money: -1, morale: 4 } },
    { l: 'Prefiero tenerlo a mano', d: '', e: {} },
  ],
},
{
  id: 'l_language', cat: 'Vida', w: 8, when: (G) => CLUB(G).country !== P(G).country,
  title: 'El idioma',
  text: (G) => `Llevas meses aquí y sigues hablando por señas. El vestuario se ríe contigo, pero el míster te da instrucciones que no entiendes.`,
  opts: [
    { l: 'Clases todos los días', d: '', e: { attr: { men: 3 }, trust: 10, rating: 0.05, morale: 6, growth: 1.05 } },
    { l: 'Traductor a todas partes', d: '', e: { money: -0.2, trust: -4, rating: 0.02 } },
    { l: 'Con el fútbol me entiendo', d: '', e: { trust: -8, morale: 4 } },
  ],
},
{
  id: 'l_homesick', cat: 'Vida', w: 8, when: (G) => CLUB(G).country !== P(G).country && P(G).age <= 24,
  title: 'Morriña',
  text: () => `Llamas a casa cada noche. Aquí no conoces a nadie, la comida no te gusta y a las seis de la tarde ya es de noche.`,
  opts: [
    { l: 'Traerme a mi familia', d: '', e: { money: -0.5, morale: 18, rating: 0.05, growth: 1.05 } },
    { l: 'Meterme en la ciudad: gente, cenas, planes', d: '', e: { morale: 12, fitness: -4, fanLove: 6 } },
    { l: 'Aguantar solo', d: '', e: { morale: -12, attr: { men: 3 }, rating: -0.04 } },
  ],
},
{
  id: 'l_ultras', cat: 'Afición', w: 7, when: (G) => P(G).rep >= 45,
  title: 'La grada de animación',
  text: () => `Los ultras te esperan en la ciudad deportiva. No vienen a insultarte: vienen a pedirte que seas su bandera contra la directiva.`,
  opts: [
    { l: 'Ponerme de su lado', d: '', e: { fanLove: 22, trust: -12, rep: 6, morale: 6 } },
    { l: 'Escucharles y no mojarme', d: '', e: { fanLove: 6, attr: { men: 2 } } },
    { l: 'Denunciar la presión al club', d: '', e: { fanLove: -14, trust: 12, rep: 4 } },
  ],
},
{
  id: 'l_journalist', cat: 'Prensa', w: 8,
  title: 'El periodista que te tiene manía',
  text: () => `Hay uno que lleva dos años escribiendo que eres un fraude. Hoy te lo cruzas solo, en un pasillo, sin cámaras.`,
  opts: [
    { l: 'Encararle', d: '', e: (G) => (chance(0.4)
        ? { rep: 5, morale: 10, note: 'Le dices cuatro verdades y se le acaban los argumentos. Cambia el tono.' }
        : { rep: -10, fanLove: -6, morale: -8, note: 'Lo graba con el móvil. Mañana eres tú el que sale mal.' }) },
    { l: 'Darle una exclusiva y comprarle', d: '', e: { rep: 8, morale: -4, trust: -6 } },
    { l: 'Sonreír y seguir andando', d: '', e: { attr: { men: 2 }, morale: 4 } },
  ],
},
{
  id: 'l_doc_series', cat: 'Prensa', w: 6, when: (G) => P(G).rep >= 62,
  title: 'El documental',
  text: () => `Una plataforma quiere seguirte una temporada entera con cámaras dentro de tu casa y del vestuario.`,
  opts: [
    { l: 'Firmar y abrir la puerta', d: '', e: { money: 2.2, rep: 18, trust: -10, morale: -4, trait: 'mediastar' } },
    { l: 'Solo fuera del vestuario', d: '', e: { money: 1, rep: 8 } },
    { l: 'Ni hablar', d: '', e: { trust: 6, morale: 4 } },
  ],
},
{
  id: 'l_boots_deal', cat: 'Dinero', w: 8, when: (G) => P(G).rep >= 50,
  title: 'La marca',
  text: () => `Dos ofertas de botas encima de la mesa: una marca enorme que te va a tener guardado en un cajón, y una pequeña que quiere construir todo alrededor tuyo.`,
  opts: [
    { l: 'La marca grande', d: '', e: { money: 2.4, rep: 6 } },
    { l: 'La marca pequeña', d: '', e: { money: 0.9, rep: 14, morale: 6, fanLove: 6 } },
    { l: 'Negociar por objetivos', d: 'Cobras si rindes.', e: { money: 0.4, rating: 0.04, morale: -4, flag: 'bonusDeal' } },
  ],
},
{
  id: 'l_new_manager_style', cat: 'Entrenador', w: 10,
  title: 'Entrenador nuevo, fútbol nuevo',
  text: (G) => `Llega un técnico con ideas muy marcadas. En su sistema, tu puesto se juega de una forma que no es la tuya.`,
  opts: [
    { l: 'Adaptarme a lo que pida', d: '', e: (G) => { const k = topAttrKey(G.player); return { attr: { [k]: 2, men: 1 }, trust: 12, mins: 1.08, rating: -0.03, growth: 1.06 }; } },
    { l: 'Convencerle de que me deje jugar a lo mío', d: '', e: (G) => (chance(0.45)
        ? { mins: 1.12, rating: 0.08, trust: 8, morale: 10, note: 'Le convences. Te construye el equipo alrededor.' }
        : { mins: 0.78, trust: -14, morale: -10, note: 'No hay debate. Te sienta hasta que entres en el molde.' }) },
    { l: 'Pedir salir si no cuenta conmigo', d: '', e: { flag: 'wantOut', morale: 4, trust: -8 } },
  ],
},
{
  id: 'l_captaincy', cat: 'Vestuario', w: 8, when: (G) => P(G).age >= 25 && P(G).seasonsAtClub >= 2,
  title: 'El brazalete',
  text: (G) => `Se va el capitán. El vestuario te vota a ti, aunque no eres el más veterano.`,
  opts: [
    { l: 'Aceptarlo', d: 'Más responsabilidad, más peso.', e: { trait: 'leader', trust: 14, fanLove: 12, rating: 0.04, morale: -4, legacyBonus: 70 } },
    { l: 'Rechazarlo para centrarme en jugar', d: '', e: { rating: 0.06, morale: 8, trust: -8 } },
    { l: 'Compartirlo con el veterano', d: '', e: { trust: 10, fanLove: 6, attr: { men: 2 }, legacyBonus: 30 } },
  ],
},
{
  id: 'l_relegation_fight', cat: 'Club', w: 8, when: (G) => CLUB(G).str < 70,
  title: 'Enero, últimos puestos',
  text: (G) => `El equipo es colista y hay ofertas para sacarte de aquí en el mercado de invierno. Quedarte puede costarte un descenso en el currículum.`,
  opts: [
    { l: 'Quedarme a salvarlo', d: 'Pase lo que pase.', e: { fanLove: 25, trust: 14, legacyBonus: 60, rating: 0.04, morale: 6 } },
    { l: 'Pedir salir en enero', d: '', e: { flag: 'forceMove', fanLove: -20, trust: -14 } },
    { l: 'Esperar a ver cómo va febrero', d: '', e: { morale: -4 } },
  ],
},
{
  id: 'l_agent_leak', cat: 'Prensa', w: 8, when: (G) => P(G).age >= 21,
  title: 'Tu agente habla de más',
  text: () => `Tu representante ha dicho en la radio que estás "escuchando ofertas". Tú no le habías dicho eso. La grada sí lo ha escuchado.`,
  opts: [
    { l: 'Desmentirlo públicamente', d: '', e: { fanLove: 12, trust: 8, morale: -4 } },
    { l: 'Dejar que corra: me sube el precio', d: '', e: { fanLove: -14, rep: 8, morale: 4 } },
    { l: 'Cambiar de agente', d: '', e: { money: -0.4, morale: 6, rep: -3 } },
  ],
},
{
  id: 'l_fitness_data', cat: 'Entrenamiento', w: 8, when: (G) => P(G).age >= 22,
  title: 'Los datos no engañan',
  text: () => `El departamento de rendimiento te enseña tus números: corres un 12% menos que hace dos años en los últimos veinte minutos.`,
  opts: [
    { l: 'Plan individual de resistencia', d: '', e: { attr: { phy: 3 }, fitness: 10, mins: 1.06, morale: -4 } },
    { l: 'Cambiar mi forma de jugar y ahorrar', d: '', e: { attr: { men: 3, pos: 1 }, rating: 0.05, fitness: 5 } },
    { l: 'Los datos no juegan al fútbol', d: '', e: { morale: 6, trust: -8, fitness: -6 } },
  ],
},
{
  id: 'l_teammate_racism', cat: 'Vestuario', w: 6,
  title: 'La grada',
  text: () => `Un sector del campo rival insulta a un compañero tuyo durante todo el partido. El árbitro no para el juego.`,
  opts: [
    { l: 'Sacar al equipo del campo', d: '', e: { rep: 16, fanLove: 12, trust: -6, morale: 10, legacyBonus: 90 } },
    { l: 'Ir a por el árbitro para que lo pare', d: '', e: { rep: 8, morale: 6, rating: -0.03 } },
    { l: 'Terminar el partido y denunciarlo después', d: '', e: { rep: 6, morale: -6, legacyBonus: 30 } },
  ],
},
{
  id: 'l_kid_born', cat: 'Vida', w: 7, when: (G) => P(G).age >= 24,
  title: 'Vas a ser padre',
  text: () => `Te lo dicen en mitad de la temporada. De repente el fútbol ocupa un poco menos de tu cabeza, y eso puede ser bueno o malo.`,
  opts: [
    { l: 'Volcarme en casa', d: '', e: { morale: 18, fitness: -6, growth: 0.94, attr: { men: 3 } } },
    { l: 'Usarlo como gasolina', d: '', e: { form: 14, rating: 0.05, morale: 10, growth: 1.05 } },
    { l: 'Separar del todo campo y casa', d: '', e: { morale: 6, attr: { men: 2 }, rating: 0.03 } },
  ],
},
{
  id: 'l_old_coach', cat: 'Vida', w: 7, when: (G) => P(G).age >= 27,
  title: 'Tu primer entrenador',
  text: () => `El que te puso las primeras botas está en el hospital. Te llama su hijo: le haría ilusión verte.`,
  opts: [
    { l: 'Ir esa misma noche, aunque haya partido', d: '', e: { trust: -6, morale: 16, legacyBonus: 50, attr: { men: 2 } } },
    { l: 'Ir después del partido', d: '', e: { morale: 10, legacyBonus: 30 } },
    { l: 'Mandarle una camiseta firmada', d: '', e: { morale: -6 } },
  ],
},
{
  id: 'l_contract_clause', cat: 'Club', w: 8, when: (G) => P(G).age >= 22 && P(G).age <= 31,
  title: 'La cláusula',
  text: () => `El club quiere renovarte. Puedes pedir cláusula baja (te podrás ir barato) o dejarla por las nubes (nadie te saca de aquí sin permiso).`,
  opts: [
    { l: 'Cláusula baja y sueldo menor', d: 'Libertad.', e: { wageCut: 0.88, flag: 'lowClause', morale: 6, note: 'Si mañana llama un grande, no te pueden retener.' } },
    { l: 'Cláusula altísima y sueldo alto', d: 'Dinero, pero atado.', e: { wageCut: 1.3, flag: 'highClause', trust: 8, note: 'Cobras más. Salir de aquí ya no depende solo de ti.' } },
    { l: 'No renovar todavía', d: 'A ver cómo va el año.', e: { contractYears: -1, morale: -4, trust: -6 } },
  ],
},
{
  id: 'l_youth_call', cat: 'Selección', w: 8, when: (G) => P(G).age <= 21 && P(G).nt && P(G).nt.level !== 'Absoluta',
  title: 'Doble nacionalidad',
  text: (G) => `Puedes esperar a la selección con la que sueñas o aceptar ya la llamada de otra en la que jugarías todo desde mañana.`,
  opts: [
    { l: 'Esperar a la mía', d: 'Puede no llegar nunca.', e: { morale: -4, attr: { men: 2 }, flag: 'waitNT' } },
    { l: 'Aceptar la otra ya', d: 'Internacional desde mañana.', e: { rep: 10, morale: 12, flag: 'switchedNT' } },
    { l: 'Dejar la decisión para más adelante', d: '', e: {} },
  ],
},
{
  id: 'l_training_ground_fight', cat: 'Vestuario', w: 8,
  title: 'Se lía en el entrenamiento',
  text: () => `Una entrada fuerte, un empujón y de repente estáis quince tíos separándoos. Hay cámaras del club grabando.`,
  opts: [
    { l: 'No dar un paso atrás', d: '', e: { trait: 'hothead', rep: 4, trust: -10, morale: 6 } },
    { l: 'Ser yo el que corta', d: '', e: { trust: 10, attr: { men: 2 }, fanLove: 4 } },
    { l: 'Pedir perdón delante del grupo', d: '', e: { trust: 8, morale: -4, rating: 0.03 } },
  ],
},
{
  id: 'l_night_before', cat: 'Vida', w: 8,
  title: 'La noche antes del derbi',
  text: () => `Un amigo cumple treinta y la fiesta es a dos calles de la concentración. Nadie se enteraría.`,
  opts: [
    { l: 'Escaparme dos horas', d: '', e: (G) => (chance(0.35)
        ? { trust: -22, fanLove: -16, mins: 0.85, morale: -12, note: 'Un vídeo tuyo a las tres de la mañana. El club te multa y te sienta.' }
        : { morale: 10, fitness: -5, note: 'Nadie se entera. Al día siguiente juegas medio dormido.' }) },
    { l: 'Quedarme en la concentración', d: '', e: { fitness: 6, rating: 0.04, trust: 4 } },
    { l: 'Llamarle y felicitarle', d: '', e: { morale: 2, fitness: 3 } },
  ],
},
{
  id: 'l_second_team_loan', cat: 'Club', w: 7, when: (G) => P(G).age <= 20,
  title: 'Bajar al filial una temporada',
  text: () => `El club te propone bajar al filial unos meses para jugar cada domingo en vez de calentar en el primer equipo.`,
  opts: [
    { l: 'Bajar y jugarlo todo', d: '', e: { mins: 1.3, growth: 1.12, rep: -4, morale: -4 } },
    { l: 'Quedarme arriba aunque no juegue', d: '', e: { mins: 0.7, rep: 4, growth: 0.95, trust: 4 } },
    { l: 'Pedir cesión a otro club', d: '', e: { flag: 'wantLoan', morale: 4 } },
  ],
},
{
  id: 'l_veteran_advice', cat: 'Vestuario', w: 8, when: (G) => P(G).age <= 23,
  title: 'El consejo del veterano',
  text: () => `Un tío de treinta y cinco que lo ha ganado todo te para en el parking: "Tienes dos años para decidir qué jugador quieres ser. Luego ya no se elige".`,
  opts: [
    { l: 'Especializarme en lo que mejor hago', d: '', e: (G) => { const k = topAttrKey(G.player); return { attr: { [k]: 4 }, growth: 1.04, rating: 0.04 }; } },
    { l: 'Corregir mi punto débil', d: '', e: (G) => {
        const p = G.player; const list = attrsFor(p.pos).map((a) => a.key);
        const low = list.sort((a, b) => (p.attrs[a] || 50) - (p.attrs[b] || 50))[0];
        return { attr: { [low]: 4 }, growth: 1.06 };
      } },
    { l: 'Ser completo, sin obsesiones', d: '', e: { growth: 1.09, attr: { men: 1 } } },
  ],
},
{
  id: 'l_derby_promise', cat: 'Afición', w: 7, when: (G) => P(G).seasonsAtClub >= 1,
  title: 'La promesa',
  text: () => `Un chaval enfermo te pide en una carta que le dediques un gol en el derbi. Su padre ha colgado la carta en redes y ya la ha visto medio país.`,
  opts: [
    { l: 'Prometérselo en público', d: 'Presión enorme.', e: { rating: -0.05, fanLove: 14, rep: 8, morale: 6, extraGoals: 1 } },
    { l: 'Ir a verle sin cámaras', d: '', e: { morale: 14, legacyBonus: 60, fanLove: 6 } },
    { l: 'Mandarle entradas y una camiseta', d: '', e: { fanLove: 4, morale: 4 } },
  ],
},
{
  id: 'l_sleep_lab', cat: 'Entrenamiento', w: 7, when: (G) => P(G).age >= 23,
  title: 'Dormir es entrenar',
  text: () => `Un especialista del sueño te dice que duermes cinco horas y media de media. La mitad de tus lesiones podrían venir de ahí.`,
  opts: [
    { l: 'Cambiar mi vida entera por el descanso', d: '', e: { money: -0.25, injuryRisk: 0.78, fitness: 12, growth: 1.06, morale: -4 } },
    { l: 'Solo antes de los partidos', d: '', e: { injuryRisk: 0.92, fitness: 5 } },
    { l: 'Nunca he dormido más y aquí sigo', d: '', e: { injuryRisk: 1.12, morale: 4 } },
  ],
},
{
  id: 'l_boo', cat: 'Afición', w: 8, when: (G) => P(G).fanLove <= 45,
  title: 'Te pitan',
  text: (G) => `Sales al campo y tu propio estadio te silba al escuchar tu nombre por megafonía.`,
  opts: [
    { l: 'Callarles con un partidazo', d: '', e: (G) => (chance(0.5)
        ? { rating: 0.12, fanLove: 22, form: 14, note: 'Partidazo y ovación al cambiarte. Se acabó el asunto.' }
        : { rating: -0.08, fanLove: -12, morale: -12, note: 'Te sale un partido horrible. Ahora te van a pitar más.' }) },
    { l: 'Hacerles un gesto', d: '', e: { fanLove: -18, rep: 6, morale: 6, trust: -8 } },
    { l: 'Ir a aplaudirles al final', d: '', e: { fanLove: 12, morale: -4, attr: { men: 2 } } },
  ],
},
{
  id: 'l_shirt_number', cat: 'Club', w: 6, when: (G) => P(G).seasonsAtClub >= 1,
  title: 'El dorsal del ídolo',
  text: (G) => `Se retira la leyenda del club y su dorsal queda libre. Te lo ofrecen a ti. Con él viene todo el peso de su historia.`,
  opts: [
    { l: 'Cogerlo', d: 'Toda la presión encima.', e: { fanLove: 12, rep: 8, rating: -0.04, morale: 6, legacyBonus: 50 } },
    { l: 'Quedarme con el mío', d: '', e: { morale: 6, fanLove: -3 } },
    { l: 'Pedir que lo retiren para siempre', d: '', e: { fanLove: 16, rep: 4, legacyBonus: 40 } },
  ],
},
];

EVENTS.push(...RISK_EVENTS, ...POS_EVENTS, ...LIFE_EVENTS);

/* ============================================================
   4. MÁS MOMENTOS DE PARTIDO
   ============================================================ */
const EXTRA_MOMENTS = [
{
  id: 'm_gk_sweeper', when: isGK,
  title: 'Balón a la espalda',
  text: () => `Pase largo por encima de tu defensa. El delantero sale disparado y tú estás quince metros fuera del área.`,
  opts: [
    { l: 'Salir a por todas y despejar de cabeza', a: ['pos', 'pac'], base: 0.5,
      win: { text: 'Llegas antes y despejas de cabeza en la frontal. Aplausos de todo el campo.', e: { rating: 0.08, form: 10, trust: 8 } },
      lose: { text: 'Llegas tarde. Te la pica y entra despacio. Gol.', e: { form: -12, trust: -10, rating: -0.06 } } },
    { l: 'Volver a la portería y achicar', a: ['pos', 'ref'], base: 0.62,
      win: { text: 'Vuelves a tiempo, achicas bien y le sacas el mano a mano.', e: { rating: 0.06, form: 8 } },
      lose: { text: 'Le da tiempo a controlar y fusilarte.', e: { form: -8, rating: -0.04 } } },
  ],
},
{
  id: 'm_gk_cross_storm', when: isGK,
  title: 'Lluvia de centros',
  text: () => `Minuto 88, ganáis 1-0 y el rival mete a dos torres al área. Va a llover balón durante cinco minutos.`,
  opts: [
    { l: 'Salir a por todos los balones', a: ['aer', 'han'], base: 0.48,
      win: { text: 'Sales limpio a tres centros seguidos. El área es tuya.', e: { rating: 0.1, fanLove: 10, form: 12, attr: { aer: 1 } } },
      lose: { text: 'Sales a por uno que no era y te lo meten a puerta vacía.', e: { form: -14, trust: -12, rating: -0.08 } } },
    { l: 'Quedarme en la línea y blocar', a: ['ref', 'pos'], base: 0.66,
      win: { text: 'Dos paradas abajo y a correr. Victoria fea y merecida.', e: { rating: 0.06, form: 8 } },
      lose: { text: 'Un rechace muerto acaba dentro en el descuento.', e: { form: -10, morale: -8 } } },
  ],
},
{
  id: 'm_cb_last_man', when: (G) => isDef(G),
  title: 'Último hombre',
  text: () => `Le roban un balón a tu medio y el delantero rival se planta solo delante de ti. Detrás no hay nadie.`,
  opts: [
    { l: 'Aguantar de pie y temporizar', a: ['def', 'men'], base: 0.55,
      win: { text: 'Le achicas el espacio, la manda fuera y vuelve tu equipo. Defensa de manual.', e: { rating: 0.09, trust: 10, form: 10, attr: { def: 1 } } },
      lose: { text: 'Te la pasa por debajo de las piernas y marca.', e: { form: -12, rating: -0.07, trust: -8 } } },
    { l: 'Entrarle a por el balón', a: ['def', 'pac'], base: 0.42,
      win: { text: 'Entradón limpio. El campo se levanta como si fuera un gol.', e: { rating: 0.1, fanLove: 12, form: 12 } },
      lose: { text: 'Llegas tarde. Penalti y roja.', e: { form: -18, trust: -16, morale: -12, rating: -0.1 } } },
    { l: 'Agarrarle y comerme la roja', a: ['men'], base: 0.7,
      win: { text: 'Falta en la frontal, tarjeta amarilla y salváis el gol. Inteligencia pura.', e: { rating: 0.04, trust: 8 } },
      lose: { text: 'Roja directa. Dejas al equipo con diez media hora.', e: { form: -14, trust: -14, fanLove: -8 } } },
  ],
},
{
  id: 'm_fb_duel', when: isFull,
  title: 'Uno contra uno en la banda',
  text: () => `El extremo más caro de la liga te encara con el campo por delante. El estadio entero mira este duelo.`,
  opts: [
    { l: 'Meterle el cuerpo desde el primer segundo', a: ['phy', 'def'], base: 0.5,
      win: { text: 'Le comes. A la tercera ya no quiere el balón por tu banda.', e: { rating: 0.09, form: 12, trust: 8, attr: { def: 1 } } },
      lose: { text: 'Se te va de cintura y regala el gol. Amarilla incluida.', e: { form: -12, rating: -0.07 } } },
    { l: 'Aguantar de pie y llevarle a la línea', a: ['def', 'men'], base: 0.6,
      win: { text: 'Le llevas siempre a fuera y le mueres el centro. Trabajo silencioso.', e: { rating: 0.07, trust: 8 } },
      lose: { text: 'Te la mete por dentro y asiste. Larga tarde.', e: { form: -10, rating: -0.05 } } },
  ],
},
{
  id: 'm_mid_press_trap', when: (G) => isMid(G),
  title: 'Balón bajo presión',
  text: () => `Recibes de espaldas en tu propia frontal con dos rivales encima. Un error aquí es gol seguro.`,
  opts: [
    { l: 'Girarme y salir jugando', a: ['dri', 'men'], base: 0.45,
      win: { text: 'Giro, dos rivales fuera y arranca el contragolpe del año.', e: { rating: 0.1, assists: 1.1, form: 12, attr: { dri: 1 } } },
      lose: { text: 'Te roban y marcan. La cara del míster lo dice todo.', e: { form: -14, trust: -12, rating: -0.08 } } },
    { l: 'Devolvérsela al central', a: ['pas'], base: 0.78,
      win: { text: 'Sencillo y limpio. Nadie lo aplaude pero salva el momento.', e: { rating: 0.03, trust: 4 } },
      lose: { text: 'El pase sale corto y el delantero se planta solo.', e: { form: -8, rating: -0.05 } } },
    { l: 'Buscar la falta', a: ['men', 'phy'], base: 0.6,
      win: { text: 'Te tiras a tiempo. Falta y respiro para todos.', e: { rating: 0.03 } },
      lose: { text: 'El árbitro dice que no y sigue la jugada. Contra letal.', e: { form: -10, trust: -8 } } },
  ],
},
{
  id: 'm_st_solo', when: (G) => isAtk(G),
  title: 'Mano a mano',
  text: () => `Te plantas solo delante del portero en el minuto 93. Empate a cero y hay un compañero llegando por el otro lado.`,
  opts: [
    { l: 'Definir yo', a: ['sho', 'men'], base: 0.5,
      win: { text: 'Por debajo de las piernas. Gol y locura absoluta.', e: { extraGoals: 1, form: 18, fanLove: 16, rep: 6, rating: 0.1 } },
      lose: { text: 'Se la das al portero en el pecho. La grada se lleva las manos a la cabeza.', e: { form: -14, morale: -12, rating: -0.08 } } },
    { l: 'Pasarla al compañero', a: ['pas', 'men'], base: 0.68,
      win: { text: 'Se la pones para que la empuje. Gol y abrazo eterno.', e: { assists: 1.15, form: 12, trust: 10, rating: 0.06 } },
      lose: { text: 'El pase sale detrás y se pierde. Ocasión al limbo.', e: { form: -10, rating: -0.05 } } },
    { l: 'Recortar al portero primero', a: ['dri', 'pac'], base: 0.44,
      win: { text: 'Le sientas y la metes andando. Golazo de portada.', e: { extraGoals: 1, form: 20, fanLove: 20, rep: 10, rating: 0.1 } },
      lose: { text: 'Te la quita en el recorte. Se acabó el partido.', e: { form: -14, morale: -10 } } },
  ],
},
{
  id: 'm_wg_dribble_or_cross', when: isWing,
  title: 'Línea de fondo',
  text: () => `Llegas a la línea de fondo con el balón controlado. Hay tres compañeros en el área y un defensa aguantándote.`,
  opts: [
    { l: 'Encararle otra vez', a: ['dri', 'pac'], base: 0.46,
      win: { text: 'Le sientas y te vas al segundo palo. Gol tuyo.', e: { extraGoals: 1, form: 14, fanLove: 12, rating: 0.08 } },
      lose: { text: 'Te la roba y arranca la contra. El míster grita desde la banda.', e: { form: -10, trust: -8 } } },
    { l: 'Centro raso al primer palo', a: ['pas'], base: 0.6,
      win: { text: 'Centro venenoso y la empujan dentro. Asistencia.', e: { assists: 1.2, form: 10, rating: 0.06 } },
      lose: { text: 'La despeja el central en el primer palo.', e: { rating: -0.02 } } },
    { l: 'Pararla y esperar la llegada del lateral', a: ['men', 'pas'], base: 0.7,
      win: { text: 'La escondes, llega tu lateral y centra a placer. Gol.', e: { assists: 1.1, trust: 10, rating: 0.05 } },
      lose: { text: 'Tardas demasiado y te encierran contra el córner.', e: { rating: -0.03 } } },
  ],
},
{
  id: 'm_captain_speech', when: (G) => G.player.rep >= 55,
  title: 'El descanso',
  text: () => `0-2 en la final del año. En el vestuario nadie levanta la cabeza y todos te miran a ti.`,
  clutch: true,
  opts: [
    { l: 'Gritar hasta quedarme sin voz', a: ['men'], base: 0.5,
      win: { text: 'Salís otros. Remontada histórica.', e: { form: 20, fanLove: 20, rep: 12, trait: 'leader', rating: 0.08 } },
      lose: { text: 'Se hunden más. Acabáis encajando el tercero.', e: { form: -14, morale: -14 } } },
    { l: 'Hablar bajito, uno por uno', a: ['men', 'pas'], base: 0.62,
      win: { text: 'Nadie grita y todos entienden. La segunda parte es vuestra.', e: { form: 16, trust: 14, rating: 0.07, attr: { men: 2 } } },
      lose: { text: 'No cala. La final se escapa sin épica.', e: { morale: -12, form: -8 } } },
    { l: 'Callarme y demostrarlo en el campo', a: ['men', 'sho', 'ref'], base: 0.44,
      win: { text: 'Partido descomunal en la segunda parte. Título.', e: { form: 22, rep: 14, fanLove: 18, rating: 0.12 } },
      lose: { text: 'Lo intentas solo y no llega. Derrota.', e: { morale: -14, form: -10 } } },
  ],
},
{
  id: 'm_injury_gamble', when: (G) => G.player.age >= 24,
  title: 'Sientes algo',
  text: () => `Notas un latigazo en el sóleo en el minuto 30 de un partido decisivo. Puedes seguir, pero lo notas en cada apoyo.`,
  opts: [
    { l: 'Aguantar los noventa', a: ['men', 'phy'], base: 0.45,
      win: { text: 'Aguantas y ganáis. Al día siguiente la resonancia sale limpia.', e: { fanLove: 12, trust: 14, form: 10, rating: 0.06 } },
      lose: { text: 'Se rompe del todo en el minuto 70. Cuatro meses fuera.', e: { injuryRisk: 1.6, proneness: 1.2, mins: 0.75, morale: -14 } } },
    { l: 'Pedir el cambio', a: ['men'], base: 0.85,
      win: { text: 'Sales a tiempo. Dos semanas y a correr.', e: { injuryRisk: 0.9, trust: -4 } },
      lose: { text: 'Aun saliendo, la resonancia enseña una rotura pequeña.', e: { mins: 0.92, injuryRisk: 1.1 } } },
  ],
},
{
  id: 'm_ref_decision', when: (G) => !isGK(G),
  title: 'El árbitro se equivoca',
  text: () => `Os anulan un gol legal en el 90 y el árbitro ni va al monitor. El campo entero está fuera de sí y tú lo tienes a dos metros.`,
  opts: [
    { l: 'Ir a por él', a: ['men'], base: 0.3,
      win: { text: 'Le hablas con tanta calma que va al VAR. Gol concedido.', e: { form: 14, fanLove: 16, rep: 6 } },
      lose: { text: 'Roja directa por protestar. Dos partidos de sanción.', e: { form: -12, trust: -12, rep: -4 } } },
    { l: 'Contenerme y buscar otro gol', a: ['men', 'sho', 'pas'], base: 0.5,
      win: { text: 'Marcáis otro en el 95. La mejor respuesta posible.', e: { extraGoals: 1, form: 16, rating: 0.07 } },
      lose: { text: 'No llega. Derrota con robo incluido.', e: { morale: -10, form: -6 } } },
    { l: 'Estallar en la rueda de prensa', a: ['men'], base: 0.55,
      win: { text: 'Tus palabras dan la vuelta al país y el árbitro no vuelve a dirigiros.', e: { rep: 12, fanLove: 14, morale: 8 } },
      lose: { text: 'Multa federativa y dos partidos. Encima pagas tú.', e: { money: -0.4, mins: 0.94, rep: -4 } } },
  ],
},
{
  id: 'm_debut_nt', when: (G) => G.player.nt && G.player.nt.level === 'Absoluta',
  title: 'Himno',
  text: () => `Suena tu himno con la camiseta de tu país puesta y ochenta mil personas cantándolo. Tu familia está en la grada.`,
  opts: [
    { l: 'Salir a comerme el partido', a: ['men', 'pac', 'ref'], base: 0.48,
      win: { text: 'Partidazo con tu selección. Al día siguiente eres portada en tu país.', e: { rep: 16, form: 14, morale: 16, rating: 0.06 } },
      lose: { text: 'Te puede la ocasión y te cambian en el descanso.', e: { morale: -12, rep: -4 } } },
    { l: 'Jugar sencillo y disfrutarlo', a: ['men', 'pas'], base: 0.72,
      win: { text: 'Discreto y solvente. El seleccionador ya cuenta contigo.', e: { rep: 8, morale: 14 } },
      lose: { text: 'Pasas desapercibido. No te vuelven a llamar en un año.', e: { rep: -6, morale: -10 } } },
  ],
},
];
MOMENTS.push(...EXTRA_MOMENTS);
