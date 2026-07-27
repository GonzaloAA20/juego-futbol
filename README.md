# ⚽ El Camino — Simulador de carrera futbolística

Creas un futbolista de 16 años y llevas su carrera hasta la retirada. Eliges país, posición,
nombre y dorsal, firmas tu primer contrato y a partir de ahí todo son decisiones: entrenar más
o cuidarte, quedarte o salir, forzar un traspaso o ganarte a la afición.

**Se juega abriendo `index.html`.** Nada que instalar, nada que compilar, ningún servidor.
Doble clic y a jugar. Si se lo pasas a un amigo, le basta con ese archivo.

---

## Cómo pasárselo a alguien

La forma buena es publicarlo en **GitHub Pages**: sale un enlace público que cualquiera
abre desde WhatsApp y juega al instante, sin cuentas ni descargas. El repositorio ya trae
el despliegue automatizado en `.github/workflows/pages.yml`; solo faltan dos ajustes que
hay que hacer a mano en GitHub:

1. **Hacer público el repositorio.** Pages es gratis solo en repos públicos.
   `Settings` → `General` → abajo del todo, `Change repository visibility` → `Public`.
   Ojo: esto deja el código a la vista de cualquiera.
2. **Activar Pages.** `Settings` → `Pages` → en `Source`, elegir **GitHub Actions**.

A partir de ahí, cada vez que se suba algo a `main` el juego se reconstruye y se publica solo en:

```
https://gonzaloaa20.github.io/juego-futbol/
```

**En el móvil se puede instalar**: al abrir ese enlace, desde el menú del navegador
(`Añadir a pantalla de inicio`) queda con su icono y se abre a pantalla completa, como una app.

Si prefieres no hacer público el repositorio, la alternativa es mandar directamente el archivo
`index.html`: funciona igual, pero en el móvil abrir un adjunto `.html` es incómodo.

---

## Qué hay dentro

| | |
|---|---|
| **Clubes** | ~700, de 1ª y 2ª división de las ligas grandes y de 1ª de las demás |
| **Ligas** | 49, con ascensos y descensos reales entre divisiones ligadas |
| **Países** | 150+ seleccionables, con bandera, colores de equipación y nivel de selección |
| **Eventos** | 45+ situaciones con varias respuestas cada una |
| **Momentos clave** | 11 escenas interactivas resueltas con tus atributos |
| **Tramas** | 8 arcos narrativos que se desarrollan a lo largo de varias temporadas |
| **Vestuario** | Plantilla con nombres que envejece, crece y ficha cada verano |

### Cómo funciona la simulación

- **El país lo condiciona todo.** Siendo español lo normal es empezar en una cantera de LaLiga
  o en un equipo de Segunda; siendo senegalés, en Francia, Bélgica o Inglaterra; siendo argentino,
  en el fútbol argentino. Salir de un país sin liga profesional modelada es más difícil: menos
  ojeadores y menos contactos.
- **La media es dinámica.** Empiezas sobre 50-60. Creces según minutos, rendimiento, edad y nivel
  del club donde entrenas. Tu techo es secreto y casi nadie llega a 90+. Sobre los 29-33 empieza
  el declive, más tarde si eres portero o central.
- **Todo es probabilidad.** Goles y asistencias salen de una Poisson que mezcla tu posición, tu
  media, el ataque de tu equipo y la dureza de la liga. Un delantero y un central no producen igual.
- **Los porteros tienen su propia hoja**: paradas, goles encajados y porterías a cero.
- **Tienes un rival por el puesto con nombre y apellidos.** Tus minutos no salen de un número
  abstracto del club, sino del compañero concreto que juega donde tú: puedes caer en un equipo
  donde el puesto está libre o detrás de un titular indiscutible. Ese compañero envejece, mejora,
  se lesiona y acaba yéndose, y el club ficha para taparte.
- **Los títulos dependen de dónde estés.** Ganar la Champions exige estar en un club que la juegue.
  Un equipo de Segunda pelea el ascenso y puede dar la campanada en la copa nacional.
- **El Balón de Oro es muy difícil**: necesitas 88+ de media, números enormes y títulos grandes.
  En torno al 1-3 % de las carreras consigue uno.
- **La selección depende de tu país.** Con España necesitas ser de los mejores del país; con
  Afganistán, jugando en una liga decente ya te llaman. Se simulan Mundial, Eurocopa, Copa América,
  Copa Africana, Copa Oro, Copa Asiática, Nations League, categorías inferiores y Juegos Olímpicos.

### Pensado para el móvil

Se juega con una mano y en vertical: nada mide menos de 42 px, los diálogos suben desde
abajo como una hoja al alcance del pulgar, el botón de avanzar vive fijo en la parte inferior,
se respetan las zonas seguras del iPhone y no hay desplazamiento lateral ni siquiera en
pantallas de 320 px. Verificado jugando carreras completas a 320 y 360 px de ancho.

### Qué evita que se haga repetitivo

- **Momentos clave**: el penalti de la final, el minuto 89, la noche europea. Eliges qué haces y
  se resuelve con una probabilidad calculada desde tus atributos, que ves antes de decidir.
- **Tramas largas**: un rival de tu quinta que te persigue toda la carrera, un entrenador que te
  ha borrado, la promesa de volver a casa, una rodilla que no se arregla. Duran varias temporadas.
- **Puntos de evolución**: repartes tú los puntos de entrenamiento cada verano.
- **Rasgos** que se desbloquean jugando: especialista a balón parado, líder, jugador de finales,
  frágil, icono mediático…
- **Objetivos del club** cada temporada, con recompensa si los cumples.
- **Sala de leyendas**: cada carrera terminada queda registrada con su puntuación de legado.

### Números de referencia

Medidos sobre 250 carreras simuladas de un jugador español:

| | |
|---|---|
| Media máxima alcanzada | mediana 78 · p90 86 · p99 92 |
| Edad de retirada | mediana 36 |
| Ganan un Balón de Oro | 2-3 % |
| Ganan una Champions | 6-9 % |
| Llegan a la selección absoluta | 65 % (con Afganistán: 96 %) |

---

## Desarrollo

El juego se escribe en `src/` como módulos separados y se empaqueta en un único `index.html`:

```bash
node build.mjs      # genera index.html a partir de src/
```

No hay dependencias de ejecución. `playwright` solo se usa para las pruebas.

```
src/
  index.template.html   esqueleto HTML
  styles.css            todo el diseño
  data.countries.js     países, banderas, colores, nivel de selección, vías migratorias
  data.clubs.eu.js      clubes de Europa
  data.clubs.world.js   clubes de América, Asia y Oceanía
  data.competitions.js  ligas, copas, competiciones continentales y torneos de selección
  data.events.js        eventos y momentos clave
  data.storylines.js    arcos narrativos largos
  engine.core.js        aleatoriedad, atributos, creación de jugador, escudos y camisetas en SVG
  engine.squad.js       vestuario: compañeros con nombre, competencia por el puesto
  engine.season.js      simulación de temporada, clasificaciones, lesiones, evolución
  engine.market.js      opciones de inicio, ofertas, contratos, cesiones
  engine.awards.js      premios individuales, Balón de Oro, selección, legado
  ui.*.js / main.js     interfaz
```

### Sobre los datos

Los clubes llevan **nivel de plantilla, prestigio, colores y división**, aproximados a la temporada
2025/26. No hay plantillas reales jugador a jugador: quedarían obsoletas en un mes y no aportan a la
simulación. Lo que sí hay es un vestuario generado y coherente con el nivel del club, con
nombres acordes a la nacionalidad de cada futbolista, que da algo mucho más útil: un rival
concreto por el puesto.

Los escudos **no son los reales** (son material con copyright y romperían el archivo único sin
conexión). En su lugar se genera un escudo vectorial con los colores y el patrón de cada club
—rayas, franjas, bandas, mitades— más sus iniciales.

## Guardado

La partida se guarda sola en el `localStorage` del navegador. Cambiar de navegador o borrar los
datos del sitio se lleva la carrera por delante.
