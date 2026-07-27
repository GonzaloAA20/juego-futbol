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
