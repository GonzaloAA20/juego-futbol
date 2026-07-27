/* Ligas, copas y competiciones internacionales. */

/* [clave, nombre, pais, division(1|2), reputacion, ligaSuperior, ligaInferior,
    copaNacional, supercopa, plazasChampions, plazasEuropaLeague, plazasConference] */
const LEAGUE_ROWS = [
  ['ESP1','LaLiga','ESP',1,97,null,'ESP2','Copa del Rey','Supercopa de España',5,2,1],
  ['ESP2','LaLiga Hypermotion','ESP',2,72,'ESP1',null,'Copa del Rey','',0,0,0],
  ['ENG1','Premier League','ENG',1,99,null,'ENG2','FA Cup','Community Shield',5,2,1],
  ['ENG2','EFL Championship','ENG',2,76,'ENG1',null,'FA Cup','',0,0,0],
  ['ITA1','Serie A','ITA',1,93,null,'ITA2','Copa Italia','Supercopa de Italia',5,2,1],
  ['ITA2','Serie B','ITA',2,70,'ITA1',null,'Copa Italia','',0,0,0],
  ['GER1','Bundesliga','GER',1,94,null,'GER2','DFB-Pokal','Supercopa de Alemania',5,2,1],
  ['GER2','2. Bundesliga','GER',2,71,'GER1',null,'DFB-Pokal','',0,0,0],
  ['FRA1','Ligue 1','FRA',1,88,null,'FRA2','Copa de Francia','Trofeo de Campeones',4,2,1],
  ['FRA2','Ligue 2','FRA',2,66,'FRA1',null,'Copa de Francia','',0,0,0],
  ['POR1','Liga Portugal','POR',1,82,null,'POR2','Copa de Portugal','Supercopa de Portugal',3,2,1],
  ['POR2','Liga Portugal 2','POR',2,60,'POR1',null,'Copa de Portugal','',0,0,0],
  ['NED1','Eredivisie','NED',1,81,null,'NED2','Copa de los Países Bajos','Supercopa Neerlandesa',2,2,1],
  ['NED2','Eerste Divisie','NED',2,58,'NED1',null,'Copa de los Países Bajos','',0,0,0],
  ['BEL1','Pro League','BEL',1,78,null,null,'Copa de Bélgica','Supercopa de Bélgica',2,1,2],
  ['TUR1','Süper Lig','TUR',1,79,null,null,'Copa de Turquía','Supercopa de Turquía',2,2,1],
  ['SCO1','Scottish Premiership','SCO',1,70,null,null,'Copa de Escocia','',1,1,2],
  ['GRE1','Superliga de Grecia','GRE',1,71,null,null,'Copa de Grecia','',1,1,2],
  ['SUI1','Super League','SUI',1,70,null,null,'Copa de Suiza','',1,1,2],
  ['AUT1','Bundesliga austríaca','AUT',1,71,null,null,'Copa de Austria','',1,1,2],
  ['DEN1','Superliga danesa','DEN',1,70,null,null,'Copa de Dinamarca','',1,1,2],
  ['NOR1','Eliteserien','NOR',1,66,null,null,'Copa de Noruega','',1,1,2],
  ['SWE1','Allsvenskan','SWE',1,65,null,null,'Copa de Suecia','',1,1,2],
  ['POL1','Ekstraklasa','POL',1,67,null,null,'Copa de Polonia','',1,1,2],
  ['CZE1','Chance Liga','CZE',1,68,null,null,'Copa de Chequia','',1,1,2],
  ['CRO1','HNL','CRO',1,66,null,null,'Copa de Croacia','',1,1,2],
  ['SRB1','Superliga de Serbia','SRB',1,64,null,null,'Copa de Serbia','',1,1,2],
  ['UKR1','Premier League ucraniana','UKR',1,67,null,null,'Copa de Ucrania','',1,1,2],
  ['RUS1','Premier League rusa','RUS',1,70,null,null,'Copa de Rusia','',0,0,0],
  ['ROU1','SuperLiga','ROU',1,62,null,null,'Copa de Rumanía','',1,1,2],
  ['ISR1','Ligat ha\'Al','ISR',1,63,null,null,'Copa de Israel','',1,1,2],
  ['BRA1','Brasileirão Serie A','BRA',1,84,null,'BRA2','Copa de Brasil','Supercopa de Brasil',0,0,0],
  ['BRA2','Brasileirão Serie B','BRA',2,66,'BRA1',null,'Copa de Brasil','',0,0,0],
  ['ARG1','Liga Profesional','ARG',1,80,null,null,'Copa Argentina','Supercopa Argentina',0,0,0],
  ['URU1','Primera División uruguaya','URU',1,68,null,null,'Copa Uruguay','',0,0,0],
  ['COL1','Liga BetPlay','COL',1,72,null,null,'Copa Colombia','Superliga',0,0,0],
  ['CHI1','Primera División chilena','CHI',1,68,null,null,'Copa Chile','',0,0,0],
  ['ECU1','LigaPro','ECU',1,69,null,null,'Copa Ecuador','',0,0,0],
  ['PAR1','División Profesional','PAR',1,67,null,null,'Copa Paraguay','',0,0,0],
  ['PER1','Liga 1','PER',1,64,null,null,'Copa Perú','',0,0,0],
  ['MEX1','Liga MX','MEX',1,79,null,'MEX2','Copa MX','Campeón de Campeones',0,0,0],
  ['MEX2','Liga de Expansión','MEX',2,58,'MEX1',null,'Copa MX','',0,0,0],
  ['USA1','Major League Soccer','USA',1,72,null,null,'US Open Cup','Campeones Cup',0,0,0],
  ['JPN1','J1 League','JPN',1,72,null,null,'Copa del Emperador','Supercopa de Japón',0,0,0],
  ['KOR1','K League 1','KOR',1,69,null,null,'Copa de Corea','',0,0,0],
  ['KSA1','Saudi Pro League','KSA',1,76,null,null,'Copa del Rey de Campeones','Supercopa Saudí',0,0,0],
  ['QAT1','Qatar Stars League','QAT',1,66,null,null,'Copa del Emir','',0,0,0],
  ['UAE1','UAE Pro League','UAE',1,65,null,null,'Copa del Presidente','',0,0,0],
  ['AUS1','A-League','AUS',1,64,null,null,'Australia Cup','',0,0,0],
];

const LEAGUES = {};
LEAGUE_ROWS.forEach((r) => {
  LEAGUES[r[0]] = {
    key: r[0], name: r[1], country: r[2], tier: r[3], rep: r[4],
    up: r[5], down: r[6], cup: r[7], supercup: r[8],
    ucl: r[9], uel: r[10], uecl: r[11],
  };
});

/* Competiciones continentales por confederacion */
const CONTINENTAL = {
  UEFA: { elite: 'UEFA Champions League', second: 'UEFA Europa League', third: 'UEFA Conference League', superCup: 'Supercopa de Europa' },
  CONMEBOL: { elite: 'Copa Libertadores', second: 'Copa Sudamericana', third: null, superCup: 'Recopa Sudamericana' },
  CONCACAF: { elite: 'Concacaf Champions Cup', second: 'Copa Centroamericana', third: null, superCup: null },
  AFC: { elite: 'AFC Champions League Elite', second: 'AFC Champions League Two', third: null, superCup: null },
  OFC: { elite: 'OFC Champions League', second: null, third: null, superCup: null },
  CAF: { elite: 'CAF Champions League', second: 'CAF Confederation Cup', third: null, superCup: null },
};

/* Torneos de seleccion absoluta. anio = verano en el que se disputa. */
const NT_TOURNAMENTS = [
  { name: 'Mundial', emoji: '🌍', confed: '*', every: 4, base: 2026, prestige: 100 },
  { name: 'Eurocopa', emoji: '🇪🇺', confed: 'UEFA', every: 4, base: 2028, prestige: 88 },
  { name: 'Copa América', emoji: '🏆', confed: 'CONMEBOL', every: 4, base: 2028, prestige: 80 },
  { name: 'Copa Oro', emoji: '🥇', confed: 'CONCACAF', every: 2, base: 2027, prestige: 62 },
  { name: 'Copa Africana de Naciones', emoji: '🌍', confed: 'CAF', every: 2, base: 2027, prestige: 70 },
  { name: 'Copa Asiática', emoji: '🌏', confed: 'AFC', every: 4, base: 2027, prestige: 62 },
  { name: 'Copa de Naciones de la OFC', emoji: '🌊', confed: 'OFC', every: 4, base: 2028, prestige: 40 },
  { name: 'Final Four de la Nations League', emoji: '🎖️', confed: 'UEFA', every: 2, base: 2027, prestige: 55 },
  { name: 'Finalissima', emoji: '⚔️', confed: 'CONMEBOL', every: 4, base: 2029, prestige: 58 },
];

/* Torneos de categorias inferiores */
const YOUTH_TOURNAMENTS = [
  { name: 'Mundial Sub-17', emoji: '🌱', maxAge: 17, every: 2, base: 2027, prestige: 40 },
  { name: 'Mundial Sub-20', emoji: '🌿', maxAge: 20, every: 2, base: 2027, prestige: 50 },
  { name: 'Europeo Sub-21', emoji: '🇪🇺', maxAge: 21, every: 2, base: 2027, prestige: 48, confed: 'UEFA' },
  { name: 'Juegos Olímpicos', emoji: '🥇', maxAge: 23, every: 4, base: 2028, prestige: 58 },
];

/* Devuelve los torneos internacionales que se juegan el verano de `year` */
function tournamentsInYear(year, confed) {
  return NT_TOURNAMENTS.filter((t) => {
    if (t.confed !== '*' && t.confed !== confed) return false;
    const d = year - t.base;
    return d >= 0 && d % t.every === 0;
  });
}

function youthTournamentsInYear(year, confed) {
  return YOUTH_TOURNAMENTS.filter((t) => {
    if (t.confed && t.confed !== confed) return false;
    const d = year - t.base;
    return d >= 0 && d % t.every === 0;
  });
}

/* Nombre de la fase alcanzada segun un valor 0..1 */
const ROUND_NAMES = [
  [0.02, 'campeón'], [0.06, 'subcampeón'], [0.14, 'semifinales'],
  [0.30, 'cuartos de final'], [0.55, 'octavos de final'], [1.01, 'fase de grupos'],
];
