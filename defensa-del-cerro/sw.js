/* Defensa del Cerro — service worker: precache + cache-first para jugar sin conexión.
   Si cambiás archivos, subí la versión de CACHE para que los teléfonos instalados se actualicen. */
const CACHE = 'defensa-cerro-v1';
const ASSETS = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/main.js', 'js/data.js', 'js/sim.js', 'js/render.js', 'js/sprites.js', 'js/audio.js', 'js/bot.js',
  'fonts/lilita-one.woff2', 'fonts/nunito.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-192.png', 'icons/maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon-32.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('defensa-cerro-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // red primero para la página (así llegan las actualizaciones), con respaldo offline
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); return res; })
      .catch(() => caches.match('index.html', { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
