// Service worker: guarda el juego y three.js para jugar sin conexión.
const VERSION = 'rz-v7-2';
const ARCHIVOS = ['./', 'index.html', 'style.css', 'game.js', 'world.js', 'props.js', 'zombis.js', 'armas.js', 'audio.js', 'efectos.js', 'datos.js', 'fisica.js', 'sangre.js', 'infinito.js', 'mapas.js', 'zonas.js', 'autos.js', 'texturas.js', 'ambiente.js',
  'manifest.webmanifest', 'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/apple-touch-icon.png', 'iconos/icono-maskable-512.png',
  'fuentes/butcherman.woff2', 'fuentes/bangers.woff2', 'fuentes/barlow-medium.woff2', 'fuentes/barlow-bold.woff2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // archivos del juego: red primero (para recibir arreglos), caché si no hay conexión
    e.respondWith(fetch(req).then(r => { const copia = r.clone(); if (r.ok) caches.open(VERSION).then(c => c.put(req, copia)); return r; }).catch(() => caches.match(req, { ignoreSearch: true })));
  } else if (url.hostname === 'esm.sh') {
    // three.js: versión fija, caché primero
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const copia = r.clone(); if (r.ok) caches.open(VERSION).then(c => c.put(req, copia)); return r; })));
  }
});
