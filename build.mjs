#!/usr/bin/env node
/**
 * Empaqueta todo src/ en un unico index.html autocontenido.
 * Sin dependencias: node build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(ROOT, 'src', p), 'utf8');

// El orden importa: datos -> motor -> interfaz -> arranque.
const SCRIPTS = [
  'data.countries.js',
  'data.clubs.eu.js',
  'data.clubs.world.js',
  'data.competitions.js',
  'data.events.js',
  'data.storylines.js',
  'engine.core.js',
  'engine.season.js',
  'engine.market.js',
  'engine.awards.js',
  'ui.shared.js',
  'ui.create.js',
  'ui.game.js',
  'main.js',
];

const css = src('styles.css');
const js = SCRIPTS.map((f) => `/* ===== ${f} ===== */\n${src(f)}`).join('\n\n');

const html = src('index.template.html')
  .replace('/*__CSS__*/', () => css)
  .replace('/*__JS__*/', () => js);

writeFileSync(join(ROOT, 'index.html'), html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`index.html generado (${kb} KB)`);

/* Variante para publicar como pagina alojada: sin <!doctype>, <html>, <head> ni <body>,
   porque el alojamiento envuelve el contenido en su propio esqueleto. */
const hosted = `<title>El Camino · Simulador de carrera de fútbol</title>
<style>
/* El juego vive en una sola atmósfera, como el marcador de un estadio de noche.
   Se fija el fondo oscuro pase lo que pase con el tema del visor. */
html, :root[data-theme="light"], :root[data-theme="dark"] { background: #070b10; color-scheme: dark; }
${css}
</style>
<div id="app"></div>
<script>
${js}
</script>`;
writeFileSync(join(ROOT, 'dist.hosted.html'), hosted);
console.log(`dist.hosted.html generado (${(Buffer.byteLength(hosted) / 1024).toFixed(0)} KB)`);
