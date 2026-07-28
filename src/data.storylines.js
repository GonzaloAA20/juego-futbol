/* ============================================================
   TRAMAS LARGAS (arcos de varias temporadas)
   ============================================================
   Cada arco: { id, title, start(G), stages:[ {text(G,d), opts:[{l,d,e,next}]} ] }
   El estado vive en G.player.arcs[id] = { stage, data, done }
   `next`: indice de la siguiente etapa, o -1 para cerrar el arco.
   Si una etapa no fija `next`, avanza a la siguiente.
*/

const STORYLINES = [
{
  id: 'nemesis',
  title: 'El otro',
  start: (G) => G.player.age >= 17 && G.player.age <= 22,
  init: (G) => ({ rival: randomName(pick(['ESP', 'ENG', 'FRA', 'BRA', 'ARG', 'GER', 'ITA'])), score: 0 }),
  stages: [
    {
      text: (G, d) => `Hay otro chaval de tu quinta del que todo el mundo habla: ${d.rival}. Mismo puesto, misma edad. Los periódicos os comparan cada domingo y siempre sales perdiendo tú.`,
      opts: [
        { l: 'Obsesionarme con superarle', d: 'Cada entrenamiento, con su cara en la cabeza.', e: { growth: 1.12, form: 8, morale: -4 }, score: 2 },
        { l: 'Ignorar el ruido', d: 'Tu camino es tuyo.', e: { morale: 8, attr: { men: 2 } }, score: 0 },
        { l: 'Escribirle por privado', d: 'A lo mejor no sois enemigos.', e: { morale: 6, attr: { men: 1 } }, score: 1 },
      ],
    },
    {
      text: (G, d) => `${d.rival} acaba de fichar por un grande de Europa por una cifra récord. Tú sigues donde estabas. En una entrevista dicen que él es "el mejor de su generación".`,
      opts: [
        { l: 'Responder en el campo, sin hablar', d: '', e: { rating: 0.1, growth: 1.08, form: 10 }, score: 2 },
        { l: 'Contestarle en prensa', d: 'Se lía.', e: { rep: 8, fanLove: 4, trust: -6, form: 6 }, score: 1 },
        { l: 'Felicitarle públicamente', d: 'Clase.', e: { rep: 4, morale: 6, attr: { men: 2 } }, score: 0 },
      ],
    },
    {
      text: (G, d) => `Os cruzáis en un partido grande. Prensa, cámaras, el duelo del que todos hablan. ${d.rival} contra ti, cara a cara por fin.`,
      opts: [
        { l: 'Salir a comérmelo', d: '', e: (G) => chance(0.55) ? { form: 16, rep: 12, extraGoals: 1, note: 'Le pasas por encima. Se acabó la comparación.' } : { form: -10, rep: -4, note: 'Él marca dos. Tú, nada.' }, score: 2 },
        { l: 'Jugar mi partido', d: '', e: { rating: 0.08, growth: 1.05, morale: 4 }, score: 1 },
      ],
    },
    {
      text: (G, d) => `Años después, ${d.rival} y tú coincidís en un acto. Ya no hay comparaciones, solo dos tipos que se han pasado media vida midiéndose.`,
      opts: [
        { l: 'Darle un abrazo', d: 'Se cierra el círculo.', e: { morale: 14, rep: 4, legacyBonus: 60 }, next: -1 },
        { l: 'Un apretón de manos y poco más', d: '', e: { morale: 4 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'coach_war',
  title: 'El míster no te quiere',
  start: (G) => G.player.trust < 45 && G.player.age >= 19,
  init: () => ({}),
  stages: [
    {
      text: (G) => `El entrenador te ha borrado. No entras en las convocatorias y en los entrenamientos te pone con los descartes. No te ha dado ni una explicación.`,
      opts: [
        { l: 'Pedirle una reunión cara a cara', d: '', e: (G) => chance(0.45) ? { trust: 18, mins: 1.12, note: 'Aclaráis las cosas. Vuelves a la lista.' } : { trust: -8, note: 'Te escucha veinte segundos y te echa del despacho.' } },
        { l: 'Reventar en el entrenamiento cada día', d: 'Que no le quede otra.', e: { growth: 1.12, fitness: -6, form: 8 } },
        { l: 'Filtrar a la prensa que quieres salir', d: '', e: { trust: -18, rep: 6, flag: 'wantOut' } },
      ],
    },
    {
      text: (G) => `El equipo lleva cinco derrotas seguidas. La prensa pide tu titularidad. El míster está a un partido de ser destituido.`,
      opts: [
        { l: 'Apoyarle públicamente', d: 'Jugada arriesgada.', e: (G) => chance(0.5) ? { trust: 22, mins: 1.15, note: 'Sobrevive, y desde ese día eres intocable.' } : { trust: 0, note: 'Cae igualmente. Al menos quedas bien.' } },
        { l: 'Guardar silencio', d: '', e: { morale: -2 } },
        { l: 'Dejar caer que el problema es él', d: '', e: { trust: -12, rep: 4, morale: 4 } },
      ],
    },
    {
      text: (G) => `Se acabó: destituyen al entrenador. El nuevo llega y en su primera rueda de prensa dice tu nombre.`,
      opts: [
        { l: 'Aprovechar la segunda vida', d: '', e: { trust: 25, mins: 1.2, form: 14, morale: 12 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'homecoming',
  title: 'La promesa',
  start: (G) => G.player.age >= 22 && G.player.ovr >= 76 && G.club.country !== G.player.country,
  init: (G) => {
    const home = CLUBS.filter((c) => c.country === G.player.country && LEAGUES[c.league]);
    return { club: home.length ? pickW(home, (c) => c.prestige).name : 'tu equipo de siempre' };
  },
  stages: [
    {
      text: (G, d) => `En una entrevista te preguntan por ${d.club}, el club de tu infancia. Te sale del alma: "Algún día volveré". El titular da la vuelta al país.`,
      opts: [
        { l: 'Mantenerlo: algún día volveré', d: '', e: { fanLove: 6, rep: 4, morale: 6 } },
        { l: 'Matizarlo al día siguiente', d: '', e: { rep: -2, morale: -2 }, next: -1 },
      ],
    },
    {
      text: (G, d) => `${d.club} está en horas bajas. Su presidente hace público que te espera. En tu ciudad hay pintadas con tu nombre pidiendo que vuelvas.`,
      opts: [
        { l: 'Volver ahora, en el peor momento', d: 'Bajas de nivel, subes de leyenda.', e: (G) => {
          const c = CLUBS.find((x) => x.name === (G.player.arcs.homecoming.data.club));
          if (c) { G.pendingMove = c; }
          return { fanLove: 25, rep: 8, morale: 16, legacyBonus: 120, note: 'Tu agente cierra la vuelta a casa.' };
        }, next: -1 },
        { l: 'Todavía no. Primero ganar más', d: '', e: { morale: -4, rep: 2 } },
      ],
    },
    {
      text: (G, d) => `Ya no eres el de antes y ${d.club} sigue esperando. Es ahora o nunca.`,
      opts: [
        { l: 'Volver a casa a terminar', d: '', e: (G) => {
          const c = CLUBS.find((x) => x.name === (G.player.arcs.homecoming.data.club));
          if (c) G.pendingMove = c;
          return { fanLove: 30, morale: 18, legacyBonus: 150, note: 'Vuelves a casa.' };
        }, next: -1 },
        { l: 'Romper la promesa', d: '', e: { fanLove: -20, morale: -10, rep: -4 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'chronic',
  title: 'La rodilla',
  start: (G) => G.player.injuryHistory >= 2 && G.player.age >= 23,
  init: () => ({}),
  stages: [
    {
      text: () => `El médico te enseña la resonancia. Hay desgaste en el cartílago. Puedes seguir jugando, pero cada temporada te va a doler más.`,
      opts: [
        { l: 'Operarme ya y perder media temporada', d: 'Doloroso ahora, mejor después.', e: { mins: 0.55, injuryRisk: 0.6, growth: 0.9, note: 'Seis meses fuera.' } },
        { l: 'Tratamiento conservador y aguantar', d: '', e: { injuryRisk: 1.35, morale: -4 } },
        { l: 'Cambiar mi forma de jugar', d: 'Menos explosión, más cabeza.', e: { attr: { men: 4, pac: -3, pos: 3 }, injuryRisk: 0.85 } },
      ],
    },
    {
      text: () => `Dos años después. Hay días que no puedes ni bajar escaleras por la mañana. Pero el domingo, cuando pisas el campo, se te olvida.`,
      opts: [
        { l: 'Infiltrarme cada semana para seguir', d: 'Acortas tu carrera.', e: { mins: 1.12, injuryRisk: 1.4, form: 8, note: 'Tu cuerpo pasará factura.' } },
        { l: 'Dosificarme: solo los partidos importantes', d: '', e: { mins: 0.82, injuryRisk: 0.75, rating: 0.06 } },
      ],
    },
    {
      text: () => `El traumatólogo es tajante: "Si sigues, en diez años no vas a poder jugar con tus hijos".`,
      opts: [
        { l: 'Escucharle y bajar el ritmo', d: '', e: { mins: 0.8, injuryRisk: 0.6, morale: 4 }, next: -1 },
        { l: 'Jugar hasta que el cuerpo diga basta', d: '', e: { injuryRisk: 1.5, fanLove: 12, legacyBonus: 80 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'brother',
  title: 'Sangre',
  start: (G) => G.player.age >= 24,
  init: (G) => ({ who: pick(['tu hermano pequeño', 'tu primo', 'tu mejor amigo de la infancia']) }),
  stages: [
    {
      text: (G, d) => `${d.who.charAt(0).toUpperCase() + d.who.slice(1)} juega en tercera y está a punto de dejarlo. Te pide que muevas un hilo para que le hagan una prueba.`,
      opts: [
        { l: 'Llamar al director deportivo', d: 'Quemas un favor.', e: { trust: -4, morale: 10 } },
        { l: 'Pagarle un año de entrenamiento personal', d: '', e: { money: -0.15, morale: 8 } },
        { l: 'Decirle la verdad: no llega', d: 'Duro pero honesto.', e: { morale: -8, attr: { men: 2 } } },
      ],
    },
    {
      text: (G, d) => `Contra todo pronóstico, ${d.who} ha ido subiendo. Ahora juega en una liga profesional. Y este año os enfrentáis.`,
      opts: [
        { l: 'Disfrutar el momento', d: '', e: { morale: 16, fanLove: 6, legacyBonus: 40 }, next: -1 },
        { l: 'No perdonar ni a la familia', d: '', e: { form: 10, rating: 0.06, morale: 4 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'legend_number',
  title: 'La herencia',
  start: (G) => G.player.fanLove >= 72 && G.player.ovr >= 82,
  init: (G) => ({ club: G.club.name }),
  stages: [
    {
      text: (G, d) => `El club quiere retirar la camiseta de una leyenda. En el acto, el propio homenajeado dice ante 60.000 personas que tú eres su heredero.`,
      opts: [
        { l: 'Aceptar la responsabilidad', d: '', e: { rep: 10, fanLove: 12, form: 10, rating: -0.03 } },
        { l: 'Quitarme presión con humildad', d: '', e: { morale: 8, fanLove: 6 } },
      ],
    },
    {
      text: (G, d) => `El club te propone firmar un contrato de por vida en ${d.club}: menos dinero del que podrías ganar fuera, pero te quedas para siempre. Si algún día lo rompes, lo pagas tú: cláusula, legado y la grada.`,
      opts: [
        { l: 'Firmar de por vida', d: 'Renuncias a dinero y a otros retos. Salir después costará una fortuna.', e: (G) => { G.player.contract = 99; G.player.flags.lifer = 1; return { fanLove: 30, morale: 18, wageCut: 0.75, legacyBonus: 200, note: 'Eres de la casa para siempre. Y para siempre es mucho tiempo.' }; }, next: 2 },
        { l: 'Dejar la puerta abierta', d: '', e: { morale: 4, fanLove: -6 }, next: -1 },
      ],
    },
    {
      text: (G, d) => `Dos años después llama el club más grande de Europa. Ofrecen tres veces tu ficha, Champions garantizada y la posibilidad real de ganarlo todo. Y tú firmaste de por vida en ${d.club}.`,
      opts: [
        { l: 'Decir que no y no volver a escuchar', d: 'Cierras esa puerta para siempre.', e: { fanLove: 20, morale: 10, legacyBonus: 180, trait: 'loyal', rating: 0.05 }, next: -1 },
        { l: 'Pedir permiso al club para negociar', d: '', e: (G) => (chance(0.3)
            ? (delete G.player.flags.lifer, { flag: 'forceMove', fanLove: -10, morale: 8, note: 'El presidente te libera del contrato en agradecimiento. Sales por la puerta grande.' })
            : { fanLove: -18, trust: -10, morale: -12, note: 'Se niegan en redondo y filtran que lo pediste. La grada se entera esa misma tarde.' }), next: -1 },
        { l: 'Forzar la salida como sea', d: 'Rompes tu palabra.', danger: true, e: { flag: 'wantOut', fanLove: -25, trust: -18, morale: -8, note: 'Le dices al club que te quieres ir. Ahora solo falta pagar lo que eso cuesta.' }, next: -1 },
      ],
    },
  ],
},
{
  id: 'fall',
  title: 'La caída',
  start: (G) => G.player.age >= 29 && G.player.ovr < G.player.peakOvr - 4,
  init: () => ({}),
  stages: [
    {
      text: (G) => `Ya no llegas a balones que antes cogías con los ojos cerrados. La prensa lo ha empezado a escribir. Tú lo notaste hace meses.`,
      opts: [
        { l: 'Reinventarme como jugador', d: 'Menos físico, más cabeza.', e: { attr: { men: 5, pas: 3, pac: -2, pos: 4 }, growth: 1.1 } },
        { l: 'Negar la evidencia', d: '', e: { morale: 6, growth: 0.9, injuryRisk: 1.2 } },
        { l: 'Aceptar un rol de suplente de lujo', d: '', e: { mins: 0.75, morale: -6, trust: 10, injuryRisk: 0.8 } },
      ],
    },
    {
      text: (G) => `Te ofrecen bajar de liga para seguir siendo importante. O quedarte donde estás y ser el veterano que sale veinte minutos.`,
      opts: [
        { l: 'Bajar de liga y ser protagonista', d: '', e: (G) => {
          const pool = CLUBS.filter((c) => { const l = LEAGUES[leagueOfClub(G, c)]; return l && c.str < G.player.ovr - 4 && c.str > G.player.ovr - 16; });
          if (pool.length) G.pendingMove = pick(pool);
          return { mins: 1.25, morale: 10, note: 'Cambio de aires.' };
        }, next: -1 },
        { l: 'Quedarme aquí hasta el final', d: '', e: { fanLove: 12, mins: 0.8, legacyBonus: 60 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'father',
  title: 'El que te llevaba a entrenar',
  start: (G) => G.player.age >= 20 && G.player.ovr >= 72,
  init: (G) => ({ who: pick(['tu padre', 'tu madre', 'tu abuelo', 'tu primer entrenador']) }),
  stages: [
    {
      text: (G, d) => `${d.who.charAt(0).toUpperCase() + d.who.slice(1)} sigue yendo a todos tus partidos, aunque haya que cruzar media Europa. Este año quiere venir a todos. A todos.`,
      opts: [
        { l: 'Pagarle los viajes y los hoteles', d: '', e: { money: -0.2, morale: 14, form: 6 } },
        { l: 'Que venga solo a los grandes', d: '', e: { morale: 4 } },
      ],
    },
    {
      text: (G, d) => `Después de un partido enorme, ${d.who} te espera en el aparcamiento. No dice nada. Solo te abraza.`,
      opts: [
        { l: 'Dedicarle la temporada en público', d: '', e: { morale: 16, fanLove: 10, rep: 4, legacyBonus: 50 }, next: -1 },
        { l: 'Guardármelo para mí', d: '', e: { morale: 12, attr: { men: 2 } }, next: -1 },
      ],
    },
  ],
},
{
  id: 'ghost_injury',
  title: 'La lesión que nadie encuentra',
  start: (G) => G.player.age >= 22 && G.player.injuryHistory >= 2,
  init: () => ({}),
  stages: [
    {
      text: () => `Llevas ocho meses con un dolor en el pubis que no aparece en ninguna prueba. Cuatro médicos y cuatro diagnósticos distintos. En el club empiezan a mirarte raro.`,
      opts: [
        { l: 'Buscar al quinto médico', d: 'Cuesta dinero y tiempo.', e: { money: -0.4, mins: 0.92, morale: 4 } },
        { l: 'Jugar infiltrado cada domingo', d: '', e: { proneness: 1.25, injuryRisk: 1.35, trust: 12, rating: 0.04 } },
        { l: 'Parar hasta que se vaya', d: '', e: { mins: 0.65, injuryRisk: 0.7, trust: -14, morale: -8 } },
      ],
    },
    {
      text: () => `El dolor sigue. Un fisio te dice algo que nadie te había dicho: "esto no es el pubis, es cómo aterrizas al saltar. Hay que reconstruirte el gesto desde cero".`,
      opts: [
        { l: 'Reconstruirme entero', d: 'Una temporada casi en blanco.', e: { mins: 0.55, growth: 0.9, proneness: 0.62, injuryRisk: 0.6, attr: { phy: 2 }, morale: -10 }, next: 2 },
        { l: 'No tengo una temporada que perder', d: '', e: { proneness: 1.3, injuryRisk: 1.3, rating: 0.05 }, next: 2 },
      ],
    },
    {
      text: (G) => G.player.proneness < 1
        ? `Vuelves. El dolor no está. Saltas distinto, caes distinto y por primera vez en años no piensas en tu cuerpo cuando juegas.`
        : `Sigues jugando con dolor. Ya no recuerdas cómo era hacerlo sin él, y has aprendido a que no se te note en la cara.`,
      opts: [
        { l: 'Contarlo todo en una entrevista', d: '', e: { rep: 10, fanLove: 12, morale: 10, legacyBonus: 70 }, next: -1 },
        { l: 'Guardármelo', d: '', e: { morale: 6, attr: { men: 3 } }, next: -1 },
      ],
    },
  ],
},
{
  id: 'money_pit',
  title: 'El dinero se va',
  start: (G) => G.player.age >= 25 && (G.player.money || 0) >= 4,
  init: () => ({}),
  stages: [
    {
      text: () => `Tu gestor te enseña las cuentas: entre casas, coches, familia y "amigos", te gastas más de lo que ingresas. Y tú ni te habías dado cuenta.`,
      opts: [
        { l: 'Cortar por lo sano y controlarlo yo', d: '', e: { money: 1.2, morale: -8, attr: { men: 2 } } },
        { l: 'Contratar a un profesional de verdad', d: '', e: { money: -0.3, flag: 'goodAdvisor', morale: 6 } },
        { l: 'Ya ganaré más', d: '', e: { money: -1.5, morale: 8 } },
      ],
    },
    {
      text: (G) => `Aparece un negocio que necesita entrada fuerte y promete rentas de por vida. Tu gestor dice que es lo mejor que ha visto en veinte años.`,
      opts: [
        { l: 'Meter todo lo que tengo', d: 'Todo o nada.', danger: true, e: (G) => {
            const good = G.player.flags.goodAdvisor ? 0.62 : 0.34;
            return chance(good)
              ? { money: 6, morale: 16, note: 'Sale redondo. Tienes la vida resuelta juegues lo que juegues.' }
              : { money: -5, morale: -22, form: -10, rating: -0.05, note: 'Se hunde. Pierdes casi todo y te pasas media temporada al teléfono con abogados.' };
          }, next: -1 },
        { l: 'Meter solo una parte', d: '', e: (G) => (chance(0.45)
            ? { money: 1.8, morale: 8, note: 'Buen movimiento. Sin sustos.' }
            : { money: -1.2, morale: -8, note: 'Se pierde, pero no te arruina.' }), next: -1 },
        { l: 'Dejar el dinero quieto', d: '', e: { morale: 4, money: 0.2 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'wonder_pressure',
  title: 'El elegido',
  start: (G) => G.player.age <= 19 && G.player.pot - G.player.ovr >= 10,
  init: (G) => ({ club: G.club.name }),
  stages: [
    {
      text: (G, d) => `Media Europa habla de ti y todavía no has jugado cincuenta partidos. Te comparan con jugadores que ganaron Balones de Oro. En ${d.club} han puesto tu cara en el autobús.`,
      opts: [
        { l: 'Creérmelo y jugar sin miedo', d: '', e: { form: 12, rep: 10, growth: 1.08, rating: -0.03 } },
        { l: 'Bajar el ruido: nada de redes, nada de prensa', d: '', e: { growth: 1.1, attr: { men: 3 }, rep: -6, morale: 6 } },
        { l: 'Rodearme de gente que me proteja', d: '', e: { money: -0.3, morale: 12, attr: { men: 2 } } },
      ],
    },
    {
      text: () => `Primera mala racha de verdad: dos meses sin aparecer y una prensa que ya escribe la palabra "fracaso". Tienes diecinueve años.`,
      opts: [
        { l: 'Salir a dar la cara públicamente', d: '', e: (G) => (chance(0.5)
            ? { rep: 8, form: 12, attr: { men: 3 }, note: 'Hablas como un veterano de treinta. Se acabó el debate.' }
            : { rep: -8, morale: -14, form: -10, note: 'Se te ve pequeño y nervioso. Peor el remedio.' }) },
        { l: 'Refugiarme en el trabajo', d: '', e: { growth: 1.12, form: 6, morale: -6 } },
        { l: 'Pedir salir cedido a jugar tranquilo', d: '', e: { flag: 'wantLoan', morale: 8 } },
      ],
    },
    {
      text: (G) => G.player.ovr >= G.player.pot - 4
        ? `Cinco años después has cumplido todo lo que dijeron de ti. Muy pocos lo consiguen y tú lo sabes mejor que nadie.`
        : `Cinco años después no eres lo que dijeron que serías. Eres bueno. Pero "el elegido" era otra cosa y esa etiqueta pesa.`,
      opts: [
        { l: 'Usarlo como combustible', d: '', e: { growth: 1.08, form: 10, attr: { men: 3 } }, next: -1 },
        { l: 'Hacer las paces con mi carrera', d: '', e: { morale: 18, rating: 0.05, legacyBonus: 60 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'boardroom',
  title: 'El club se rompe',
  start: (G) => G.player.age >= 24 && G.player.seasonsAtClub >= 2,
  init: (G) => ({ club: G.club.name }),
  stages: [
    {
      text: (G, d) => `El ${d.club} lo compra un fondo extranjero. Prometen fichajes, estadio nuevo y Champions en tres años. La mitad del vestuario no se lo cree.`,
      opts: [
        { l: 'Ponerme del lado del proyecto nuevo', d: '', e: { trust: 10, mins: 1.06, fanLove: -8, wageCut: 1.15 } },
        { l: 'Defender lo que había', d: '', e: { fanLove: 16, trust: -10, legacyBonus: 40 } },
        { l: 'Esperar a ver qué pasa', d: '', e: { morale: -4 } },
      ],
    },
    {
      text: (G, d) => `Los nuevos dueños no pagan. Llevas tres meses sin cobrar y el club tiene una denuncia en la federación.`,
      opts: [
        { l: 'Liderar la denuncia del vestuario', d: '', e: { money: 0.8, trust: 12, fanLove: 8, rep: 6, trait: 'leader' } },
        { l: 'Rescindir y quedar libre', d: 'Te vas gratis, pero te vas.', e: { flag: 'forceMove', money: -0.5, fanLove: -6 } },
        { l: 'Aguantar por la afición', d: '', e: { money: -1.2, fanLove: 22, legacyBonus: 90, morale: -8 } },
      ],
    },
    {
      text: (G, d) => `Se resuelve. O el fondo mete el dinero prometido, o el club acaba en manos de sus socios con la mitad de presupuesto. Te piden que digas algo.`,
      opts: [
        { l: 'Comprometerme con el club pase lo que pase', d: '', e: { fanLove: 24, legacyBonus: 120, wageCut: 0.9, trust: 12 }, next: -1 },
        { l: 'Decir que mi futuro depende del proyecto', d: '', e: { rep: 6, fanLove: -12, morale: 4 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'second_life',
  title: 'La segunda vida',
  start: (G) => G.player.age >= 32 && G.player.ovr < G.player.peakOvr - 3,
  init: () => ({}),
  stages: [
    {
      text: () => `Un club de otro continente te ofrece el triple de lo que ganas por dos años. Nadie te va a ver jugar, pero es dinero de retirada.`,
      opts: [
        { l: 'Firmar y cobrar', d: 'Adiós al fútbol de verdad.', e: { money: 5, rep: -10, fanLove: -6, growth: 0.9, flag: 'exotic' } },
        { l: 'Quedarme aquí a competir', d: '', e: { morale: 10, rating: 0.04, growth: 1.03 } },
        { l: 'Bajar de categoría en casa y ser el líder', d: '', e: { mins: 1.15, fanLove: 12, wageCut: 0.7, morale: 8 } },
      ],
    },
    {
      text: () => `Empiezas a pensar en el después. Te ofrecen sacarte el título de entrenador ahora, mientras juegas, o meterte en la tele cuando lo dejes.`,
      opts: [
        { l: 'Sacarme el título de entrenador', d: '', e: { money: -0.3, attr: { men: 4 }, rating: 0.05, legacyBonus: 60 }, next: -1 },
        { l: 'Cerrar el trato con la televisión', d: '', e: { money: 1.6, rep: 10, legacyBonus: 30 }, next: -1 },
        { l: 'Cuando lo deje, ya veré', d: '', e: { morale: 8 }, next: -1 },
      ],
    },
  ],
},
{
  id: 'tournament_hero',
  title: 'El verano de tu vida',
  start: (G) => G.player.nt && G.player.nt.level === 'Absoluta' && G.player.age >= 23 && G.player.ovr >= 78,
  init: () => ({}),
  stages: [
    {
      text: (G) => `Gran torneo con tu selección. El seleccionador te dice en privado que el equipo va a girar alrededor tuyo. Nunca has tenido tanta responsabilidad.`,
      opts: [
        { l: 'Pedir ser el capitán', d: '', e: { rep: 8, form: 10, rating: -0.03, trait: 'leader' } },
        { l: 'Jugar y callar', d: '', e: { rating: 0.06, morale: 6 } },
        { l: 'Pedirle que reparta el peso', d: '', e: { morale: 10, attr: { men: 2 }, rep: -3 } },
      ],
    },
    {
      text: () => `Semifinal, prórroga, y el seleccionador te pregunta si te ves para tirar el penalti decisivo. Estás reventado y llevas dos partidos jugando con molestias.`,
      opts: [
        { l: 'Cogerlo yo', d: '', danger: true, e: (G) => (chance(0.55)
            ? { rep: 22, fanLove: 20, morale: 20, form: 20, trait: 'clutch', legacyBonus: 150, note: 'Lo metes. Pasáis a la final y tu país no habla de otra cosa.' }
            : { rep: -14, morale: -28, form: -20, fanLove: -12, legacyBonus: -60, note: 'Lo fallas. En tu país ese penalti se va a ver en bucle durante veinte años.' }) },
        { l: 'Dárselo a otro', d: '', e: { morale: -6, rep: -4, attr: { men: 1 } } },
      ],
    },
    {
      text: () => `Vuelves del torneo con el país entero pendiente de ti, para bien o para mal. La temporada empieza en dos semanas y no has descansado nada.`,
      opts: [
        { l: 'No parar: aprovechar la ola', d: '', e: { form: 12, fitness: -12, injuryRisk: 1.3, rep: 8 }, next: -1 },
        { l: 'Perderme la pretemporada entera', d: '', e: { fitness: 10, form: -8, trust: -8, injuryRisk: 0.8, morale: 12 }, next: -1 },
      ],
    },
  ],
},
];

const STORY_BY_ID = Object.fromEntries(STORYLINES.map((s) => [s.id, s]));
