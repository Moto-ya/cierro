const CACHE = 'cierro-app-0.8-1795476274';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icono.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'];
// la demostración (carpeta demo/) tiene su propio service worker y su propia caché: aquí no se toca
const ES_DEMO = (k) => k.startsWith('cierro-demo');
const PAGINA = new URL('index.html', self.registration.scope).href;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && !ES_DEMO(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.toLowerCase().includes('/demo/')) return; // la demostración se atiende sola
  // la página principal se pide primero a internet (para ver siempre la última versión); sin señal, la guardada
  if (e.request.mode === 'navigate') {
    const red = fetch(e.request).then((res) => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(PAGINA, copia)); } return res; });
    const espera = new Promise((ok) => setTimeout(ok, 3000)).then(() => caches.match(PAGINA));
    // con mala señal no se espera más de 3 segundos: se abre la versión guardada
    e.respondWith(Promise.race([red, espera]).then((r) => r || red).catch(() => caches.match(PAGINA)));
    return;
  }
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
    const copia = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return res;
  }).catch(() => caches.match(PAGINA))));
});
