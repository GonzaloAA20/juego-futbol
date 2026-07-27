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
      text: (G, d) => `El club te propone firmar un contrato de por vida en ${d.club}: menos dinero del que podrías ganar fuera, pero te quedas para siempre.`,
      opts: [
        { l: 'Firmar de por vida', d: 'Renuncias a dinero y a otros retos.', e: (G) => { G.player.contract = 99; G.player.flags.lifer = 1; return { fanLove: 30, morale: 18, wageCut: 0.75, legacyBonus: 200, note: 'Eres de la casa para siempre.' }; }, next: -1 },
        { l: 'Dejar la puerta abierta', d: '', e: { morale: 4, fanLove: -6 }, next: -1 },
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
];

const STORY_BY_ID = Object.fromEntries(STORYLINES.map((s) => [s.id, s]));
