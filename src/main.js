/* ============================================================
   ARRANQUE
   ============================================================ */
window.G = null;

(function boot() {
  try {
    screenHome();
  } catch (err) {
    document.getElementById('app').innerHTML =
      '<div class="card"><h2>Algo ha fallado al arrancar</h2><pre class="small dim" style="white-space:pre-wrap">'
      + String(err && err.stack || err) + '</pre></div>';
  }
})();

// Guardar al cerrar la pestaña
window.addEventListener('beforeunload', () => { if (window.G && !window.G.player.retired) saveGame(window.G); });

/* Manifiesto generado en memoria: así el juego se puede "añadir a la pantalla de
   inicio" del móvil y abrirse a pantalla completa, sin dejar de ser un solo archivo.
   Si el navegador o la política de seguridad lo bloquean, no pasa nada: se ignora. */
(function installable() {
  try {
    const icon = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">'
      + '<rect width="512" height="512" rx="112" fill="#0d8f6a"/>'
      + '<text x="256" y="366" font-size="300" text-anchor="middle">\u26BD</text></svg>');
    const manifest = {
      name: 'El Camino · Simulador de carrera',
      short_name: 'El Camino',
      description: 'Crea un futbolista de 16 años y llévalo hasta la retirada.',
      start_url: location.pathname,
      scope: location.pathname,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#070b10',
      theme_color: '#070b10',
      lang: 'es',
      icons: [
        { src: icon, sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
        { src: icon, sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
      ],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
    const link = document.createElement('link');
    link.rel = 'manifest'; link.href = url;
    document.head.appendChild(link);
  } catch (e) { /* sin manifiesto se juega exactamente igual */ }
})();
