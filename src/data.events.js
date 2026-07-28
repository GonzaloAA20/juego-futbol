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
    { l: 'Escuchar y dar mi palabra', d: 'Si dices que sí, en verano te vas. Sin marcha atrás.',
      tags: ['Te compromete', 'Riesgo de filtración'],
      e: (G) => {
        const c = suitorClub(G, 4);
        if (chance(0.72) && c) return { morale: 8, note: commitTo(G, c, 'Diste tu palabra a mitad de temporada y el club lo dio por cerrado.') };
        return { trust: -16, fanLove: -14, note: 'Se filtra antes de cerrarse nada. La afición te silba en su propio campo.' };
      } },
    { l: 'Colgar y contárselo al club', d: 'Puntos de lealtad.', e: { trust: 12, fanLove: 8, trait: 'loyal' } },
  ],
},
{
  id: 'agent_pressure', cat: 'Agente', w: 5, when: (G) => P(G).age >= 26 && P(G).ovr >= 78,
  title: 'La oferta del petrodólar',
  text: () => `Llega una oferta mareante desde una liga con mucho dinero y poca competición. Es cinco veces tu sueldo. Tienes 27 años.`,
  opts: [
    { l: 'Ir por el dinero', d: 'Tu carrera deportiva se congela. Y ya no hay vuelta atrás.',
      tags: ['Te compromete', 'Frena tu crecimiento'],
      e: (G) => {
        const c = pickW(clubsOf('KSA1').concat(clubsOf('QAT1'), clubsOf('UAE1')), (x) => x.str);
        return { money: 12, rep: -6, growth: 0.7, note: commitTo(G, c, 'Firmaste el precontrato en enero. El dinero ya está en camino.') };
      } },
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
  id: 'rival_signing', cat: 'Club', w: 7, when: (G) => competitorFor(G) && competitorGap(G) < 3,
  title: 'El de tu puesto',
  text: (G) => {
    const c = competitorFor(G);
    const cc = COUNTRY_BY_CODE[c.country];
    return `${cc.flag} ${c.name}, ${c.age} años, ${c.ovr} de media, juega exactamente donde tú. El míster tiene que elegir y esta semana no te ha mirado ni una vez.`;
  },
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
    { l: 'Aceptar y salir con clase', d: 'Te vas en verano al club que ha pagado.',
      tags: ['Cambias de club'],
      e: (G) => { const c = suitorClub(G, 3); return { rep: 3, note: c ? commitTo(G, c, 'El club aceptó la oferta y tú no te opusiste. Está hecho.') : 'La operación se cae y sigues aquí.' }; } },
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

{
  id: 'rival_injured', cat: 'Club', w: 6, when: (G) => competitorFor(G) && competitorGap(G) < 0,
  title: 'Se lesiona el titular',
  text: (G) => {
    const c = competitorFor(G);
    return `${c.name} cae lesionado y se pierde media temporada. El puesto es tuyo durante unos meses. Lo que pase después depende de lo que hagas ahora.`;
  },
  opts: [
    { l: 'Aprovechar cada minuto', d: 'La oportunidad de tu vida.', e: { mins: 1.22, form: 12, growth: 1.1, rating: 0.06 } },
    { l: 'Ir a verle al hospital antes de nada', d: 'Persona antes que futbolista.', e: { mins: 1.12, morale: 8, trust: 6, attr: { men: 2 } } },
    { l: 'Pedir renovación aprovechando el momento', d: 'Frío y calculador.', e: (G) => chance(0.55) ? { wageCut: 1.4, trust: -6, note: 'Cuela: te suben la ficha.' } : { trust: -14, fanLove: -6, note: 'Les parece feo. Y lo recuerdan.' } },
  ],
},
{
  id: 'squad_leader', cat: 'Vestuario', w: 6, when: (G) => P(G).age >= 26 && (G.squad || []).some((t) => t.age <= 19),
  title: 'El más joven del vestuario',
  text: (G) => {
    const kid = (G.squad || []).filter((t) => t.age <= 19).sort((a, b) => b.pot - a.pot)[0];
    return `${kid ? kid.name : 'Un chaval'} tiene ${kid ? kid.age : 18} años, acaba de subir y no le habla nadie. Tú te acuerdas perfectamente de cómo se siente eso.`;
  },
  opts: [
    { l: 'Adoptarle', d: 'Llevarle a todos lados.', e: { trust: 8, morale: 8, fanLove: 5, legacyBonus: 35 } },
    { l: 'Que se espabile como hice yo', d: '', e: { morale: -2 } },
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
    { l: 'Aceptar y marcharme en enero', d: 'Rompes el año por la mitad y juegas media temporada allí.',
      tags: ['Cambias de club YA'],
      e: (G) => {
        const c = suitorClub(G, 2);
        if (!c) return { morale: -4, note: 'La oferta se cae en el último momento. Te quedas.' };
        return { fanLove: -8, note: moveInWinter(G, c) };
      } },
    { l: 'Terminar la temporada aquí', d: 'Se respeta, y se nota en el vestuario.', e: { trust: 8, fanLove: 6, form: 6 } },
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

/* ---------------- ETAPA: PROMESA (16-19) ---------------- */
{
  id: 'first_wage', cat: 'Promesa', w: 9, when: (G) => P(G).age <= 19,
  title: 'Tu primer sueldo',
  text: () => `Te ingresan la primera nómina de tu vida. No es una fortuna, pero para un chaval de tu edad es más dinero del que ha visto nunca nadie de tu familia.`,
  opts: [
    { l: 'Dárselo a mis padres', d: 'Ellos pagaron todos los viajes de niño.', e: { morale: 12, fanLove: 4, attr: { men: 2 } } },
    { l: 'Comprarme el coche', d: 'Todo el vestuario lo va a ver.', e: { money: -0.05, morale: 8, rep: 3, trust: -4 } },
    { l: 'No tocarlo', d: 'Guardarlo entero.', e: { money: 0.06, attr: { men: 1 } } },
  ],
},
{
  id: 'school', cat: 'Promesa', w: 8, when: (G) => P(G).age <= 18,
  title: 'Los estudios',
  text: () => `Estás en segundo de bachillerato y te comen los entrenamientos. El club te deja elegir: seguir compaginando o dejarlo y volcarte en el fútbol.`,
  opts: [
    { l: 'Dejar los estudios', d: 'Todo a una carta.', e: { growth: 1.12, morale: -4, sp: 1 } },
    { l: 'Compaginar como sea', d: 'Duermes cinco horas.', e: { attr: { men: 3 }, fitness: -5, growth: 0.97 } },
    { l: 'Bajar el ritmo del fútbol un año', d: 'Red de seguridad.', e: { growth: 0.9, morale: 8, mins: 0.92 } },
  ],
},
{
  id: 'first_agent', cat: 'Promesa', w: 8, when: (G) => P(G).age <= 19,
  title: 'El primer representante',
  text: () => `Un tipo con traje se presenta en el aparcamiento del campo con una carpeta y promesas. Dice que puede llevarte a Inglaterra en dos años.`,
  opts: [
    { l: 'Firmar con él', d: 'Más ofertas, pero se lleva su parte.', e: { flag: 'superAgent', money: -0.03, rep: 4, note: 'A partir de ahora te llegan más ofertas.' } },
    { l: 'Que hable con mis padres', d: 'Prudente.', e: { attr: { men: 2 }, morale: 4 } },
    { l: 'Mandarle a paseo', d: '', e: { morale: 2 } },
  ],
},
{
  id: 'youth_final', cat: 'Promesa', w: 7, when: (G) => P(G).age <= 19,
  title: 'Final del juvenil',
  text: () => `El juvenil juega una final y te quieren a ti, aunque ya entrenas con los mayores. El míster del primer equipo prefiere que descanses.`,
  opts: [
    { l: 'Jugar la final con mis amigos', d: 'Los de siempre.', e: { morale: 14, fanLove: 6, trust: -6, fitness: -4 } },
    { l: 'Hacer caso al primer equipo', d: '', e: { trust: 10, morale: -5 } },
  ],
},

/* ---------------- ETAPA: IRRUPCIÓN (20-22) ---------------- */
{
  id: 'hype', cat: 'Irrupción', w: 8, when: (G) => P(G).age >= 19 && P(G).age <= 23,
  title: 'El nuevo fulanito',
  text: (G) => `La prensa ha decidido que eres "el nuevo" de alguien. Comparaciones enormes, portadas, y una lupa encima que antes no tenías.`,
  opts: [
    { l: 'Alimentar el personaje', d: 'Vender humo también da dinero.', e: { rep: 12, trait: 'mediastar', rating: -0.05 } },
    { l: 'Quitarle hierro en público', d: '', e: { morale: 6, trust: 5, rep: -2 } },
    { l: 'Ponerme el listón aún más alto', d: '', e: { growth: 1.1, form: 8, morale: -6 } },
  ],
},
{
  id: 'first_big_contract', cat: 'Irrupción', w: 7, when: (G) => P(G).age >= 20 && P(G).age <= 24 && P(G).ovr >= 72,
  title: 'El primer contrato gordo',
  text: () => `Te ponen delante un contrato que multiplica por cinco lo que ganabas. Tu agente quiere cerrarlo ya. Tu padre te dice que no corras.`,
  opts: [
    { l: 'Firmar a lo grande', d: 'Cláusula alta: te ata.', e: (G) => { P(G).contract += 4; return { money: 1.2, morale: 10, trust: 6, note: 'Contrato largo. Salir de aquí ahora es más caro.' }; } },
    { l: 'Firmar corto y renegociar en dos años', d: 'Apuestas por ti.', e: (G) => { P(G).contract = 2; return { rep: 3, morale: 4, note: 'Contrato corto: mandas tú dentro de dos años.' }; } },
    { l: 'No firmar todavía', d: '', e: { trust: -8, morale: -2 } },
  ],
},
{
  id: 'loan_request', cat: 'Irrupción', w: 8, when: (G) => P(G).age >= 19 && P(G).age <= 23 && squadRole(P(G), CLUB(G), competitorGap(G)).min < 0.5,
  title: 'Aquí no juegas',
  text: (G) => `Llevas media temporada calentando. Tu agente te lo dice claro: o sales cedido, o pierdes dos años de tu vida en un banquillo.`,
  opts: [
    { l: 'Pedir salir cedido', d: 'Buscarás cesión en verano.', tags: ['Buscarás cesión'],
      e: { flag: 'wantLoan', morale: 6, trust: -4, note: 'Tu agente moverá una cesión este verano.' } },
    { l: 'Quedarme y pelearlo', d: 'Orgullo.', e: { form: 10, growth: 1.06, morale: -4 } },
  ],
},

/* ---------------- ETAPA: CONSOLIDACIÓN (23-26) ---------------- */
{
  id: 'fatherhood', cat: 'Vida', w: 7, when: (G) => P(G).age >= 23 && P(G).age <= 33,
  title: 'Vas a ser padre',
  text: () => `Te lo dicen un martes por la mañana, antes de entrenar. No te enteras de nada de lo que dice el míster en la charla.`,
  opts: [
    { l: 'Cambiarlo todo por la familia', d: 'Otras prioridades.', e: { morale: 18, growth: 0.94, injuryRisk: 0.92 } },
    { l: 'Usarlo como motor', d: 'Ahora juegas por alguien más.', e: { morale: 10, form: 12, attr: { men: 3 } } },
  ],
},
{
  id: 'house', cat: 'Dinero', w: 6, when: (G) => P(G).age >= 23 && P(G).wage >= 0.8,
  title: 'Echar raíces',
  text: (G) => `Llevas años de alquiler y maletas. Comprarte una casa aquí es decir en voz alta que te quedas.`,
  opts: [
    { l: 'Comprar la casa', d: 'Te asientas.', e: { money: -1.5, morale: 12, fanLove: 8, trust: 4 } },
    { l: 'Seguir de alquiler', d: 'Mantener las opciones abiertas.', e: { morale: -2 } },
  ],
},
{
  id: 'peak_pressure', cat: 'Carrera', w: 7, when: (G) => P(G).age >= 24 && P(G).age <= 28 && P(G).ovr >= 76,
  title: 'Ahora o nunca',
  text: (G) => `Tienes ${P(G).age} años y estás en tu mejor momento. Si vas a dar el salto a un grande, la ventana es esta y dura dos o tres años.`,
  opts: [
    { l: 'Forzar la máquina para salir', d: 'Buscarás un grande sí o sí.', tags: ['Fuerzas tu salida'],
      e: { flag: 'wantOut', trust: -12, morale: 6, note: 'Tu club sabe que quieres irte. No te van a retener.' } },
    { l: 'Confiar en que llegue solo', d: '', e: { form: 6, trust: 4 } },
    { l: 'Renunciar al salto y ser leyenda aquí', d: '', e: { fanLove: 16, trait: 'loyal', morale: 8, legacyBonus: 50 } },
  ],
},

/* ---------------- ETAPA: PLENITUD Y VETERANÍA ---------------- */
{
  id: 'highest_paid', cat: 'Vestuario', w: 6, when: (G) => P(G).age >= 26 && P(G).ovr >= 80,
  title: 'El mejor pagado',
  text: (G) => `Se filtra la tabla de sueldos. Eres el que más cobra del vestuario, y por bastante. En el entrenamiento se nota el ambiente.`,
  opts: [
    { l: 'Asumirlo y rendir', d: 'Que hable el campo.', e: { form: 8, rating: 0.06, morale: -4 } },
    { l: 'Bajarme el sueldo por el grupo', d: 'Gesto enorme.', e: { wageCut: 0.85, trust: 14, fanLove: 12, morale: 8, legacyBonus: 40 } },
    { l: 'Que se fastidien', d: '', e: { morale: 4, trust: -8 } },
  ],
},
{
  id: 'bench_role', cat: 'Veteranía', w: 8, when: (G) => P(G).age >= 31,
  title: 'La charla incómoda',
  text: (G) => `El míster te llama al despacho. Quiere que asumas un rol de suplente de lujo: veinte minutos, liderazgo y ayudar a los jóvenes.`,
  opts: [
    { l: 'Aceptar con dignidad', d: 'Alargas la carrera.', e: { mins: 0.78, trust: 14, injuryRisk: 0.8, morale: -6, legacyBonus: 30 } },
    { l: 'Negarme: yo soy titular', d: 'O juegas, o te vas.', e: { trust: -16, mins: 1.05, morale: 6, flag: 'wantOut' } },
    { l: 'Pedir una última temporada como titular', d: '', e: (G) => chance(0.45) ? { mins: 1.1, trust: 4, note: 'Te da un año más de confianza.' } : { mins: 0.7, trust: -8, note: 'Se niega. Al banquillo.' } },
  ],
},
{
  id: 'life_after', cat: 'Veteranía', w: 6, when: (G) => P(G).age >= 32,
  title: 'Y después, ¿qué?',
  text: () => `Un compañero que se retiró hace dos años te cuenta que lo peor no fue dejar de jugar, fue el vacío del lunes siguiente. Se te queda grabado.`,
  opts: [
    { l: 'Empezar a preparar la retirada', d: 'Cabeza tranquila.', e: { morale: 10, attr: { men: 3 }, growth: 0.96 } },
    { l: 'No pensarlo todavía', d: '', e: { form: 6, morale: -4 } },
    { l: 'Meterme en un proyecto fuera del campo', d: '', e: { money: -0.5, morale: 8, rep: 5, legacyBonus: 40 } },
  ],
},
{
  id: 'farewell', cat: 'Últimas balas', w: 8, when: (G) => P(G).age >= 35,
  title: 'La última vuelta',
  text: (G) => `Con ${P(G).age} años, cada partido puede ser el último en muchos sitios. La gente empieza a despedirse de ti en campos que ni son el tuyo.`,
  opts: [
    { l: 'Anunciar que es mi última temporada', d: 'Homenajes en cada campo.', e: { fanLove: 18, rep: 8, morale: 12, mins: 1.06, legacyBonus: 60 } },
    { l: 'No decir nada y seguir', d: '', e: { morale: 4 } },
  ],
},
{
  id: 'young_hunger', cat: 'Vestuario', w: 6, when: (G) => P(G).age >= 30,
  title: 'Ya no corres como antes',
  text: () => `En el partidillo del martes un chaval de veinte te deja sentado dos veces seguidas. Todo el vestuario se ríe. Tú también, por fuera.`,
  opts: [
    { l: 'Doblar el trabajo físico', d: 'Contra el reloj.', e: { attr: { pac: 2, phy: 2 }, fitness: -6, injuryRisk: 1.2 } },
    { l: 'Jugar con la cabeza, no con las piernas', d: 'Reinventarse.', e: { attr: { men: 4, pos: 3 }, rating: 0.05 } },
  ],
},

/* ---------------- MÁS COSAS QUE PUEDEN PASAR ---------------- */
{
  id: 'coach_faith', cat: 'Entrenador', w: 7,
  title: 'Una charla a solas',
  text: () => `El míster te para al salir del vestuario. "¿Tú qué quieres ser, un buen jugador o uno de los grandes?". No espera respuesta.`,
  opts: [
    { l: 'Pedirle trabajo específico', d: '', e: { growth: 1.12, sp: 1, trust: 8, fitness: -3 } },
    { l: 'Decirle que ya lo sé', d: '', e: { morale: 4, trust: -3 } },
  ],
},
{
  id: 'fans_hostile', cat: 'Afición', w: 6, when: (G) => P(G).fanLove < 45,
  title: 'Te silban los tuyos',
  text: (G) => `Sales a calentar y suena un silbido desde el fondo. Es tu propio campo.`,
  opts: [
    { l: 'Aplaudirles de vuelta', d: 'Retador.', e: (G) => chance(0.4) ? { fanLove: 12, form: 10, note: 'Les ganas. Se da la vuelta el ambiente.' } : { fanLove: -14, morale: -8, note: 'Va a peor. Ahora te silban cada balón.' } },
    { l: 'Callar y trabajar', d: '', e: { form: 8, rating: 0.05, morale: -5 } },
    { l: 'Pedir salir del club', d: '', tags: ['Fuerzas tu salida'], e: { flag: 'wantOut', fanLove: -10, morale: 4 } },
  ],
},
{
  id: 'teammate_death', cat: 'Vida', w: 3,
  title: 'Un vestuario roto',
  text: () => `Un compañero sufre un accidente grave. La liga se para una jornada. En el vestuario no habla nadie.`,
  opts: [
    { l: 'Dedicarle la temporada', d: '', e: { morale: -8, form: 14, fanLove: 10, attr: { men: 3 }, legacyBonus: 30 } },
    { l: 'Costear su recuperación', d: '', e: { money: -0.8, morale: 6, fanLove: 12, rep: 6 } },
  ],
},
{
  id: 'tactic_sacrifice', cat: 'Juego', w: 7, when: (G) => !isGK(G),
  title: 'Sacrificarte por el equipo',
  text: (G) => `El míster te pide un rol más sacrificado: correr para otros, tapar espaldas, renunciar a tus números.`,
  opts: [
    { l: 'Aceptar el sacrificio', d: 'Menos goles, más confianza.', e: { goals: 0.8, assists: 0.9, trust: 16, mins: 1.12, rating: 0.06 } },
    { l: 'Negociar seguir siendo yo', d: '', e: { goals: 1.06, trust: -6 } },
  ],
},
{
  id: 'title_run', cat: 'Club', w: 6, when: (G) => CLUB(G).str >= 78,
  title: 'Abril decisivo',
  text: (G) => `Quedan seis jornadas, estáis a dos puntos del líder y llegan tres finales seguidas. Nadie duerme bien esta semana.`,
  opts: [
    { l: 'Tirar del equipo', d: 'A muerte.', e: { form: 14, rating: 0.08, fitness: -8, injuryRisk: 1.25 } },
    { l: 'Dosificarme para llegar entero', d: '', e: { injuryRisk: 0.82, mins: 0.94, fitness: 6 } },
  ],
},
{
  id: 'national_snub', cat: 'Selección', w: 6, when: (G) => P(G).nt.caps > 0 && P(G).age >= 22,
  title: 'Fuera de la lista',
  text: (G) => `Sale la convocatoria y no estás. Un periodista te pregunta si te sientes injustamente tratado.`,
  opts: [
    { l: 'Explotar públicamente', d: 'Puentes quemados.', e: { rep: 6, morale: -6, note: 'El seleccionador toma nota. Y no para bien.' } },
    { l: 'Responder con goles', d: '', e: { form: 12, rating: 0.07, growth: 1.04 } },
    { l: 'Llamar al seleccionador en privado', d: '', e: { attr: { men: 2 }, morale: 4 } },
  ],
},
{
  id: 'referee_apology', cat: 'Sociedad', w: 5,
  title: 'El árbitro se disculpa',
  text: () => `Un árbitro te llama por teléfono para pedirte perdón por un penalti que no pitó y que os costó el partido. No es habitual.`,
  opts: [
    { l: 'Contarlo en prensa', d: '', e: { rep: 6, morale: 4, note: 'Se lía en el estamento arbitral.' } },
    { l: 'Guardármelo', d: '', e: { attr: { men: 2 }, morale: 6 } },
  ],
},
{
  id: 'sponsor_clash', cat: 'Dinero', w: 5, when: (G) => P(G).rep >= 40,
  title: 'Un patrocinador incómodo',
  text: () => `Te ofrecen mucho dinero por una marca con muy mala fama. Tu agente dice que es dinero, y punto.`,
  opts: [
    { l: 'Firmar', d: '', e: { money: 1.4, rep: 4, fanLove: -10 } },
    { l: 'Rechazarlo y explicar por qué', d: '', e: { fanLove: 12, rep: 6, morale: 6 } },
  ],
},
{
  id: 'training_ground_bust', cat: 'Entrenamiento', w: 6,
  title: 'Instalaciones de otro siglo',
  text: (G) => `El campo de entrenamiento está impracticable, el gimnasio es de los noventa y el fisio es el mismo para toda la plantilla.`,
  opts: [
    { l: 'Pagarme un preparador propio', d: '', e: { money: -0.4, growth: 1.1, injuryRisk: 0.85 } },
    { l: 'Quejarme al club', d: '', e: (G) => chance(0.5) ? { growth: 1.06, trust: -4, note: 'Invierten algo. Algo es algo.' } : { trust: -10, note: 'Te toman por un quejica.' } },
    { l: 'Adaptarme y callar', d: '', e: { injuryRisk: 1.12, trust: 5 } },
  ],
},

{
  id: 'legend_temptation', cat: 'Club', w: 9, when: (G) => G.legendClubId && mainClub(G.club).id === G.legendClubId && P(G).ovr >= 76,
  title: 'La llamada que no querías',
  text: (G) => `Un club muy superior al tuyo pregunta por ti. Sueldo triple, Champions, escaparate mundial. Y tú llevas desde los seis años yendo a este campo.`,
  opts: [
    { l: 'Ni escuchar la oferta', d: 'Aquí naciste y aquí te quedas.',
      e: { fanLove: 20, trust: 12, morale: 10, legacyBonus: 70, trait: 'loyal' } },
    { l: 'Escucharla y decidir en verano', d: 'Se filtra y la grada se entera.', tags: ['Fuerzas tu salida'],
      e: { flag: 'wantOut', fanLove: -18, morale: 5 } },
    { l: 'Usarla para pedir mejor contrato', d: '', e: (G) => chance(0.6)
      ? { wageCut: 1.5, fanLove: -4, note: 'Cuela: te mejoran la ficha para retenerte.' }
      : { fanLove: -12, trust: -8, note: 'Les sienta fatal el órdago.' } },
  ],
},
{
  id: 'shirt_retired', cat: 'Club', w: 4, when: (G) => P(G).age >= 33 && P(G).fanLove >= 80,
  title: 'Van a retirar tu dorsal',
  text: (G) => `El club anuncia que nadie más volverá a llevar tu número. Ni siquiera te has retirado todavía.`,
  opts: [
    { l: 'Aceptar el homenaje', d: '', e: { fanLove: 12, rep: 8, morale: 14, legacyBonus: 90 } },
    { l: 'Pedir que esperen a que me retire', d: 'Todavía queda fútbol.', e: { morale: 8, form: 8, legacyBonus: 40 } },
  ],
},
{
  id: 'mentor_coach', cat: 'Entrenador', w: 6, when: (G) => P(G).age >= 22 && P(G).age <= 30,
  title: 'Un entrenador que te cambia',
  text: () => `Llega un técnico que en tres semanas te hace entender el juego de otra manera. Nunca nadie te había explicado así lo que hay que hacer sin balón.`,
  opts: [
    { l: 'Absorber todo lo que pueda', d: '', e: { attr: { men: 4, pos: 3 }, growth: 1.14, sp: 1 } },
    { l: 'Pedirle sesiones de vídeo a solas', d: '', e: { attr: { men: 3 }, trust: 10, growth: 1.08, fitness: -3 } },
  ],
},
{
  id: 'crowd_favourite', cat: 'Afición', w: 6, when: (G) => P(G).fanLove >= 70,
  title: 'Tu cántico',
  text: (G) => `El fondo se ha inventado un cántico con tu nombre. Lo cantan desde el minuto uno, ganes o pierdas.`,
  opts: [
    { l: 'Devolvérselo cada partido', d: '', e: { fanLove: 10, form: 8, morale: 10 } },
    { l: 'Grabarlo y mandárselo a mi familia', d: '', e: { morale: 14, attr: { men: 1 } } },
  ],
},
{
  id: 'contract_rebel', cat: 'Club', w: 6, when: (G) => P(G).contract <= 1 && P(G).ovr >= 74,
  title: 'Último año de contrato',
  text: () => `Te queda un año. Tu representante quiere que llegues libre para llevarte una prima enorme. El club quiere venderte ya para no perderte gratis.`,
  opts: [
    { l: 'Aguantar hasta quedar libre', d: 'Máximo dinero, máximo desgaste.', tags: ['Te compromete'],
      e: (G) => { P(G).contract = 1; return { money: 2, trust: -18, fanLove: -14, mins: 0.9, note: 'El club te va a tener en el banquillo hasta que acabe.' }; } },
    { l: 'Renovar y quedarme', d: '', e: (G) => { P(G).contract += 3; return { trust: 12, fanLove: 10, morale: 6 }; } },
    { l: 'Pedir que me vendan ahora', d: '', tags: ['Fuerzas tu salida'], e: { flag: 'wantOut', trust: -6 } },
  ],
},
{
  id: 'world_cup_year', cat: 'Selección', w: 7, when: (G) => P(G).nt.caps > 0 && P(G).age >= 21,
  title: 'Año de Mundial',
  text: () => `Es el año. Ir al Mundial depende de llegar en forma y de que el seleccionador te vea. Y quedan seis meses.`,
  opts: [
    { l: 'Todo por llegar a la lista', d: 'Aunque te cueste la temporada de club.', e: { form: 12, fitness: -8, injuryRisk: 1.2, rep: 5 } },
    { l: 'Centrarme en mi club y que sea lo que sea', d: '', e: { trust: 10, rating: 0.05, growth: 1.05 } },
    { l: 'Cuidarme para llegar entero al verano', d: '', e: { mins: 0.9, injuryRisk: 0.75, fitness: 10 } },
  ],
},
{
  id: 'academy_visit', cat: 'Carrera', w: 5, when: (G) => P(G).age >= 26,
  title: 'Vuelta a la cantera',
  text: (G) => `Te invitan a hablar con los chavales del filial. Te sientas donde te sentabas tú y ves treinta caras esperando que digas algo que les sirva.`,
  opts: [
    { l: 'Contarles la verdad, sin épica', d: '', e: { morale: 10, fanLove: 6, attr: { men: 2 }, legacyBonus: 30 } },
    { l: 'Motivarles a lo grande', d: '', e: { morale: 6, rep: 4, fanLove: 5 } },
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
      win: { text: 'El club cede a última hora. Está hecho.', e: (G) => { const c = suitorClub(G, 4); return { rep: 6, morale: 10, note: c ? commitTo(G, c, 'Forzaste la salida y el acuerdo quedó firmado.') : 'Se cierra el mercado con todo acordado de palabra.' }; } },
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

{
  id: 'one_on_one', when: (G) => !isGK(G),
  title: 'Mano a mano',
  text: () => `Te plantas solo delante del portero. El estadio contiene el aire. Todo pasa en medio segundo.`,
  opts: [
    { l: 'Definir cruzado, a placer', a: ['sho', 'men'], base: 0.55,
      win: { text: 'La colocas al palo largo. Impecable.', e: { extraGoals: 1, form: 10, rating: 0.05 } },
      lose: { text: 'El portero adivina y la saca con el pie.', e: { form: -5 } } },
    { l: 'Recortarle y marcar a puerta vacía', a: ['dri', 'pac'], base: 0.42,
      win: { text: 'Le sientas y la metes andando. Golazo de los que se recuerdan.', e: { extraGoals: 1, form: 14, fanLove: 8, rep: 4 } },
      lose: { text: 'Te la quita en el recorte. Ocasión clarísima fallada.', e: { form: -8, morale: -4 } } },
    { l: 'Picarla por encima', a: ['sho', 'dri'], base: 0.38,
      win: { text: 'Vaselina perfecta. La grada se levanta.', e: { extraGoals: 1, form: 12, rep: 6 } },
      lose: { text: 'Se te va alta. Te llevas las manos a la cabeza.', e: { form: -7 } } },
  ],
},
{
  id: 'free_kick', when: (G) => !isGK(G),
  title: 'Falta al borde del área',
  text: () => `Falta peligrosa en el minuto 80. Hay tres compañeros sobre el balón, pero la grada corea tu nombre.`,
  opts: [
    { l: 'Pegarle yo', a: ['sho', 'men'], base: 0.28,
      win: { text: '¡A la escuadra! De esas que salen una vez al año.', e: { extraGoals: 1, form: 16, fanLove: 12, rep: 8, trait: 'freekick' } },
      lose: { text: 'Barrera. Córner y a otra cosa.', e: { form: -3 } } },
    { l: 'Ponerla al área', a: ['pas'], base: 0.32,
      win: { text: 'Centro medido y cabezazo dentro. Asistencia.', e: { assists: 1.15, form: 8, trust: 6 } },
      lose: { text: 'Despeja el central sin problemas.', e: {} } },
    { l: 'Jugarla en corto', a: ['pas', 'men'], base: 0.45,
      win: { text: 'La jugada ensayada funciona y acabáis marcando.', e: { assists: 1.1, form: 7, trust: 8 } },
      lose: { text: 'Se lía y perdéis el balón. El míster levanta las manos.', e: { trust: -5 } } },
  ],
},
{
  id: 'comeback_half', 
  title: '0-2 al descanso',
  text: () => `Vais perdiendo por dos en casa y os han pitado al entrar al túnel. En el vestuario nadie levanta la cabeza.`,
  opts: [
    { l: 'Levantar la voz yo', a: ['men'], base: 0.5,
      win: { text: 'Hablas tú y el equipo sale con otra cara. Remontada.', e: { form: 16, trust: 12, fanLove: 10, trait: 'leader' } },
      lose: { text: 'Nadie te sigue y acabáis 0-4. Peor imposible.', e: { form: -12, morale: -10, trust: -6 } } },
    { l: 'Salir a arreglarlo en el campo', a: ['sho', 'dri', 'ref'], base: 0.4,
      win: { text: 'Metes uno, das otro y acabáis empatando. Partidazo tuyo.', e: { extraGoals: 1, assists: 1.1, form: 14, rating: 0.08 } },
      lose: { text: 'Lo intentas todo y no sale nada. Derrota fea.', e: { form: -8 } } },
    { l: 'Ir partido a partido, sin dramas', a: ['men'], base: 0.7,
      win: { text: 'Ordenados, sacáis un empate digno.', e: { form: 5, trust: 5 } },
      lose: { text: 'Se os cae el partido del todo.', e: { form: -6 } } },
  ],
},
{
  id: 'cup_final', 
  title: 'Final de copa',
  clutch: true,
  text: (G) => `Final. Estadio neutral, familia en la grada, y noventa minutos que pueden cambiar cómo te recuerdan aquí.`,
  opts: [
    { l: 'Jugar sin miedo', a: ['men', 'dri', 'ref'], base: 0.44,
      win: { text: 'Partidazo tuyo y título. Te sacan a hombros.', e: { form: 20, fanLove: 20, rep: 14, morale: 16, rating: 0.1 } },
      lose: { text: 'Te puede la ocasión y os pasan por encima.', e: { form: -14, morale: -12 } } },
    { l: 'Sujetar el partido y esperar el error', a: ['men', 'pos', 'def'], base: 0.6,
      win: { text: 'Partido feo, gol en el 88 y copa a casa.', e: { form: 14, fanLove: 14, trust: 10 } },
      lose: { text: 'Aguantáis hasta que os meten uno. Subcampeones.', e: { form: -8, morale: -8 } } },
  ],
},
{
  id: 'ucl_debut', when: (G) => G.euro && G.euro[(G.club.parent || G.club.id)] === 'ucl' && G.player.career.apps < 120,
  title: 'Tu primera noche de Champions',
  text: () => `Suena el himno. Miras al cielo del estadio y te acuerdas de verlo por la tele en casa de tus padres.`,
  opts: [
    { l: 'Disfrutarlo y soltarme', a: ['men', 'dri'], base: 0.5,
      win: { text: 'Te sale el partido de tu vida. Europa entera pregunta quién eres.', e: { rep: 16, form: 16, growth: 1.12, rating: 0.1 } },
      lose: { text: 'Se te hace enorme. Cambio en el 60.', e: { morale: -10, trust: -6 } } },
    { l: 'Agarrarme a lo que sé hacer', a: ['men', 'pas', 'pos'], base: 0.74,
      win: { text: 'Sobrio y sin fallos. El míster te lo reconoce.', e: { trust: 10, rep: 6, growth: 1.05 } },
      lose: { text: 'Pasas desapercibido en tu gran noche.', e: { morale: -5 } } },
  ],
},
{
  id: 'nt_debut_moment', when: (G) => G.player.nt.caps > 0 && G.player.nt.caps < 12,
  title: 'Himno y escalofrío',
  text: (G) => `${COUNTRY_BY_CODE[G.player.country].flag} Suena tu himno con la camiseta de tu selección puesta. En la grada están los tuyos.`,
  opts: [
    { l: 'Salir a comerme el campo', a: ['men', 'pac'], base: 0.48,
      win: { text: 'Debut soñado. El seleccionador te señala como fijo.', e: { rep: 12, form: 14, morale: 14 } },
      lose: { text: 'Nervios. Sales en el descanso.', e: { morale: -8 } } },
    { l: 'Ir a lo seguro en mi debut', a: ['men'], base: 0.78,
      win: { text: 'Cumples sin brillar. Habrá más días.', e: { rep: 5, morale: 8 } },
      lose: { text: 'Ni fu ni fa. Tardarán en volver a llamarte.', e: { morale: -6 } } },
  ],
},
{
  id: 'ex_club', when: (G) => G.player.history.filter((h) => h.rating != null).length >= 3,
  title: 'Contra tu ex equipo',
  text: () => `Vuelves al campo donde te hiciste jugador, pero con la camiseta contraria. Te reciben con una mezcla de aplausos y silbidos.`,
  opts: [
    { l: 'Marcar y no celebrarlo', a: ['sho', 'men'], base: 0.42,
      win: { text: 'Marcas, bajas la cabeza y pides perdón. Media grada te aplaude igual.', e: { extraGoals: 1, fanLove: 8, rep: 6, form: 12 } },
      lose: { text: 'No aparece tu gol y te vas silbado.', e: { form: -6 } } },
    { l: 'Marcar y celebrarlo a lo grande', a: ['sho'], base: 0.4,
      win: { text: 'Golazo y celebración provocadora. Te odian y a ti te da igual.', e: { extraGoals: 1, form: 14, rep: 8, fanLove: -6 } },
      lose: { text: 'Fallas y encima te pitan cada balón.', e: { form: -10, morale: -6 } } },
  ],
},
{
  id: 'relegation_final_day', when: (G) => G.club.str < 74,
  title: 'Última jornada, todo en juego',
  text: () => `Depende de vosotros: si ganáis os salváis, si perdéis bajáis. Cuarenta mil personas conteniendo la respiración.`,
  clutch: true,
  opts: [
    { l: 'Echarme el equipo a la espalda', a: ['men', 'sho', 'ref'], base: 0.42,
      win: { text: 'Decides tú el partido. Te llevan en volandas por la ciudad.', e: { extraGoals: 1, form: 18, fanLove: 22, rep: 8, legacyBonus: 40 } },
      lose: { text: 'No sale. Descenso, y la imagen tuya llorando en el césped da la vuelta al país.', e: { form: -16, morale: -16 } } },
    { l: 'Jugar sin riesgos y sufrir', a: ['men', 'def', 'pos'], base: 0.6,
      win: { text: 'Un 0-0 horrible que sabe a gloria. Salvados.', e: { form: 10, fanLove: 12, morale: 10 } },
      lose: { text: 'Un error tonto en el 85 os condena.', e: { form: -14, morale: -14 } } },
  ],
},
{
  id: 'gk_sweeper_moment', when: isGK,
  title: 'Balón a la espalda de tu defensa',
  text: () => `Pase largo por encima de tu línea. El delantero corre y tú tienes que decidir en dos segundos si sales de tu área.`,
  opts: [
    { l: 'Salir a cortar fuera del área', a: ['kic', 'men'], base: 0.5,
      win: { text: 'Llegas antes y despejas de cabeza. Ovación.', e: { form: 10, trust: 8, rating: 0.05 } },
      lose: { text: 'Llegas tarde, le derribas y ves la roja.', e: { form: -14, trust: -12, morale: -8 } } },
    { l: 'Quedarme y achicar en la portería', a: ['pos', 'ref'], base: 0.62,
      win: { text: 'Le achicas bien y le sacas el disparo con el cuerpo.', e: { form: 8, rating: 0.04 } },
      lose: { text: 'Te la pica y entra. Gol evitable.', e: { form: -8, trust: -5 } } },
  ],
},
{
  id: 'gk_shootout', when: isGK,
  title: 'Tanda de penaltis',
  clutch: true,
  text: () => `Se va a los penaltis. Tú contra cinco. Es literalmente para lo que llevas entrenando toda la vida.`,
  opts: [
    { l: 'Estudiar a cada lanzador', a: ['pos', 'men'], base: 0.4,
      win: { text: 'Paras dos. Héroe absoluto. Título.', e: { form: 22, fanLove: 22, rep: 16, morale: 18, trait: 'clutch' } },
      lose: { text: 'Los meten todos. Nada que reprocharte, pero duele igual.', e: { form: -8, morale: -10 } } },
    { l: 'Jugar con la cabeza del rival', a: ['men'], base: 0.44,
      win: { text: 'Bailoteo, gestos, y dos fallos suyos. Pasáis.', e: { form: 20, fanLove: 16, rep: 14 } },
      lose: { text: 'Solo consigues que se motiven. Eliminados.', e: { form: -10, rep: -3 } } },
    { l: 'Adivinar y volar', a: ['ref'], base: 0.33,
      win: { text: 'Vuelo espectacular y una parada de portada.', e: { form: 18, rep: 12, morale: 14 } },
      lose: { text: 'Te tiras al lado contrario una y otra vez.', e: { form: -8 } } },
  ],
},
{
  id: 'counter_attack', when: (G) => !isGK(G),
  title: 'Contragolpe, tres contra dos',
  text: () => `Robáis un balón y os lanzáis. Tres vosotros, dos ellos, cuarenta metros por delante y el estadio de pie.`,
  opts: [
    { l: 'Conducir hasta el final y disparar', a: ['pac', 'sho'], base: 0.4,
      win: { text: 'Conduces sesenta metros y la clavas. Gol de highlight.', e: { extraGoals: 1, form: 14, rep: 6 } },
      lose: { text: 'Te precipitas y la mandas fuera con dos compañeros solos.', e: { form: -8, trust: -6 } } },
    { l: 'Abrir al compañero que llega solo', a: ['pas', 'men'], base: 0.66,
      win: { text: 'Pase de gol perfecto. Abrazo y asistencia.', e: { assists: 1.15, form: 10, trust: 8 } },
      lose: { text: 'El pase sale pasado y se pierde la ocasión.', e: { form: -4 } } },
  ],
},
{
  id: 'aerial_duel', when: (G) => !isGK(G),
  title: 'Córner en el 93',
  text: () => `Último córner del partido, empate a uno. Sube hasta el portero. Tú te vas al primer palo.`,
  opts: [
    { l: 'Atacar el primer palo', a: ['phy', 'men'], base: 0.32,
      win: { text: 'Te anticipas y la peinas dentro. ¡Victoria en el último segundo!', e: { extraGoals: 1, form: 16, fanLove: 14 } },
      lose: { text: 'Te gana la posición el central y despeja.', e: { form: -3 } } },
    { l: 'Quedarme a la frontal para el rechace', a: ['sho', 'men'], base: 0.3,
      win: { text: 'Te cae el rechace y la enchufas por abajo. Locura.', e: { extraGoals: 1, form: 15, rep: 5 } },
      lose: { text: 'El rechace se va a la grada. Se acaba el partido.', e: {} } },
    { l: 'Quedarme atrás por si hay contra', a: ['def', 'men'], base: 0.72,
      win: { text: 'Cortas la contra que les habría dado el partido. Poco vistoso, muy valioso.', e: { trust: 10, rating: 0.05 } },
      lose: { text: 'Aun así os cogen y encajáis en el descuento.', e: { form: -10, trust: -6 } } },
  ],
},
{
  id: 'provocation', 
  title: 'Te buscan las cosquillas',
  text: () => `Un rival lleva todo el partido diciéndote cosas al oído. En la última acción te dice algo sobre tu familia.`,
  opts: [
    { l: 'Contestarle con las manos', a: ['phy'], base: 0.2,
      win: { text: 'Nadie lo ve y él se calla el resto del partido.', e: { form: 6 } },
      lose: { text: 'Roja directa y tres partidos de sanción. Un desastre.', e: { form: -16, trust: -16, mins: 0.88, morale: -10 } } },
    { l: 'Sonreírle y marcarle', a: ['men', 'sho'], base: 0.4,
      win: { text: 'Le marcas y le señalas la boca. Silencio absoluto.', e: { extraGoals: 1, form: 14, rep: 8, attr: { men: 2 } } },
      lose: { text: 'No consigues quitártelo de la cabeza en todo el partido.', e: { rating: -0.06, form: -6 } } },
    { l: 'Pedir al árbitro que actúe', a: ['men'], base: 0.5,
      win: { text: 'El árbitro le amonesta y se acabó el problema.', e: { form: 4, attr: { men: 1 } } },
      lose: { text: 'El árbitro pasa y encima te dice que juegues.', e: { form: -5 } } },
  ],
},
{
  id: 'injury_final', 
  title: 'Lesionado en una final',
  clutch: true,
  text: () => `Notas un pinchazo fuerte en el minuto 30 de una final. Puedes seguir apretando los dientes o pedir el cambio.`,
  opts: [
    { l: 'Aguantar hasta el final', a: ['men', 'phy'], base: 0.35,
      win: { text: 'Aguantas cojo, marcas y ganáis. Épica pura.', e: { extraGoals: 1, form: 20, fanLove: 22, rep: 12, legacyBonus: 50, injuryRisk: 1.3 } },
      lose: { text: 'Te rompes del todo en el 50. Te sacan en camilla y encima perdéis.', e: { injuryRisk: 2.2, morale: -14, form: -12 } } },
    { l: 'Pedir el cambio y no arriesgar', a: ['men'], base: 0.85,
      win: { text: 'Sales a tiempo. Es una molestia menor y estarás listo pronto.', e: { injuryRisk: 0.85, morale: -6 } },
      lose: { text: 'Aun saliendo pronto, la resonancia no es buena.', e: { injuryRisk: 1.2, morale: -8 } } },
  ],
},
{
  id: 'pichichi_race', when: (G) => isAtk(G) && G.player.ovr >= 74,
  title: 'La pelea por el Pichichi',
  text: () => `Última jornada. Estás empatado a goles con otro delantero por el trofeo. Os pitan un penalti y hay otro compañero que también lo quiere.`,
  opts: [
    { l: 'Cogerlo yo', a: ['sho', 'men'], base: 0.66,
      win: { text: 'Lo metes y te llevas el trofeo de goleador.', e: { extraGoals: 1, rep: 10, form: 12, morale: 10 } },
      lose: { text: 'Lo fallas, pierdes el trofeo y encima el vestuario te mira raro.', e: { morale: -12, trust: -8, form: -10 } } },
    { l: 'Cedérselo a mi compañero', a: ['men'], base: 0.8,
      win: { text: 'Lo mete él y te abraza. El vestuario entero lo ve.', e: { trust: 14, fanLove: 10, morale: 8, legacyBonus: 25 } },
      lose: { text: 'Lo falla. Ni trofeo ni gol.', e: { morale: -6 } } },
  ],
},
{
  id: 'manager_row', when: (G) => G.player.trust < 55,
  title: 'Te cambian en el 55',
  text: () => `Te sustituyen sin haber hecho nada mal. Al pasar por el banquillo, el míster ni te mira.`,
  opts: [
    { l: 'Tirar el peto y sentarme lejos', a: ['men'], base: 0.25,
      win: { text: 'Al día siguiente hablan y te da la razón.', e: { trust: 6, rep: 3 } },
      lose: { text: 'Multa interna y una semana con el filial.', e: { trust: -16, mins: 0.9, morale: -8 } } },
    { l: 'Aplaudir y sentarme', a: ['men'], base: 0.85,
      win: { text: 'Profesional. El míster lo valora y te repone.', e: { trust: 10, mins: 1.05 } },
      lose: { text: 'Ni lo nota. Sigues fuera.', e: { morale: -4 } } },
  ],
},
{
  id: 'last_dance', when: (G) => G.player.age >= 34,
  title: 'Puede que la última',
  text: (G) => `Con ${G.player.age} años y el cuerpo justo, sales al campo sabiendo que un partido así igual no vuelve.`,
  opts: [
    { l: 'Vaciarme del todo', a: ['men', 'phy'], base: 0.45,
      win: { text: 'Sale una actuación de las de antes. El campo entero de pie.', e: { form: 16, fanLove: 16, rep: 8, legacyBonus: 40 } },
      lose: { text: 'Las piernas ya no dan. Cambio en el 60 y aplauso de consolación.', e: { morale: -8, fitness: -8 } } },
    { l: 'Administrarme y leer el partido', a: ['men', 'pas', 'pos'], base: 0.72,
      win: { text: 'Sin correr, lo controlas todo. Clase pura.', e: { rating: 0.08, trust: 8, form: 8 } },
      lose: { text: 'Te pasa el partido por encima.', e: { rating: -0.06, form: -6 } } },
  ],
},

{
  id: 'bench_impact', when: (G) => squadRole(G.player, G.club, competitorGap(G)).min < 0.55,
  title: 'Sales en el 70',
  text: () => `Vais perdiendo y el míster te llama para los últimos veinte minutos. Es la ventana que llevas meses esperando.`,
  opts: [
    { l: 'Buscar el gol desde el primer balón', a: ['sho', 'pac'], base: 0.34,
      win: { text: 'Entras y marcas a los cuatro minutos. El míster no te va a poder sentar la semana que viene.', e: { extraGoals: 1, mins: 1.18, trust: 14, form: 14 } },
      lose: { text: 'Te precipitas en todo y pasas sin pena ni gloria.', e: { trust: -6 } } },
    { l: 'Jugar sencillo y ordenar al equipo', a: ['pas', 'men'], base: 0.6,
      win: { text: 'Ordenas el ataque y acabáis empatando. El míster toma nota.', e: { trust: 12, mins: 1.1, rating: 0.05 } },
      lose: { text: 'Veinte minutos intrascendentes.', e: {} } },
  ],
},
{
  id: 'captain_moment', when: (G) => G.player.traits.includes('leader') || G.player.age >= 28,
  title: 'El brazalete pesa',
  text: () => `Un compañero se derrumba en el vestuario a media temporada. Todos te miran a ti.`,
  opts: [
    { l: 'Parar todo y hablar con él', a: ['men'], base: 0.72,
      win: { text: 'Le levantas y el vestuario entero se une. Vuelve a ser el de antes.', e: { trust: 12, morale: 10, form: 8, legacyBonus: 25 } },
      lose: { text: 'No encuentras las palabras. Se va del club en enero.', e: { morale: -8 } } },
    { l: 'Dejarle espacio', a: ['men'], base: 0.5,
      win: { text: 'Necesitaba aire. Vuelve solo.', e: { morale: 4 } },
      lose: { text: 'Se hunde más y arrastra al grupo.', e: { form: -8, morale: -6 } } },
  ],
},
{
  id: 'weather_game',
  title: 'Campo impracticable',
  text: () => `Diluvia. El balón no rueda, el campo es un barrizal y el árbitro decide que se juega igual.`,
  opts: [
    { l: 'Adaptarme: pelotazos y segundas jugadas', a: ['phy', 'men'], base: 0.6,
      win: { text: 'Te sale un partido de guerrero y sacáis los tres puntos.', e: { form: 10, trust: 8 } },
      lose: { text: 'Te comen físicamente. Partido para olvidar.', e: { rating: -0.06 } } },
    { l: 'Insistir en jugar al fútbol', a: ['dri', 'pas'], base: 0.35,
      win: { text: 'En medio del barro, sacas la jugada del año.', e: { extraGoals: 1, rep: 6, form: 12 } },
      lose: { text: 'Pierdes cinco balones en tu campo. El míster está rojo.', e: { trust: -10, rating: -0.08 } } },
  ],
},
{
  id: 'legend_return', when: (G) => G.legendClubId && mainClub(G.club).id !== G.legendClubId,
  title: 'Vuelves a tu casa como rival',
  text: (G) => `Se juega en el campo donde te hiciste futbolista, y esta vez estás en el equipo de enfrente.`,
  opts: [
    { l: 'Pedir no celebrar si marco', a: ['men'], base: 0.8,
      win: { text: 'Marcas, no lo celebras y el estadio entero se pone en pie a aplaudirte.', e: { extraGoals: 1, fanLove: 14, rep: 8, morale: 10 } },
      lose: { text: 'No hay gol que celebrar. Te vas con una sensación rara.', e: { morale: -6 } } },
    { l: 'Ir a por todas, sin sentimentalismos', a: ['sho', 'men'], base: 0.45,
      win: { text: 'Les endosas dos. Profesional por encima de todo.', e: { extraGoals: 1, form: 12, fanLove: -6 } },
      lose: { text: 'Ni juegas bien ni te lo perdonan.', e: { form: -8, fanLove: -8 } } },
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
