// Service worker: red primero (para que las actualizaciones lleguen enseguida), caché como respaldo offline.
const CACHE = 'bb-v6';
const ARCHIVOS = ['./', 'index.html', 'estilo.css', 'manifest.webmanifest', 'fuentes/PressStart2P-Regular.ttf', 'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/icono-180.png',
  'js/main.js', 'js/juego.js', 'js/hud.js', 'js/sprites.js', 'js/props.js', 'js/escenario.js', 'js/pixel.js', 'js/fuente-datos.js', 'js/audio.js', 'js/entrada.js', 'js/datos.js', 'js/ropa.js'];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).catch(() => {})); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('bb-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((k) => k.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))));
});
