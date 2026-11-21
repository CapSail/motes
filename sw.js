const V = 'motes-v2';
const FILES = ['./', 'index.html', 'ui.js', 'sim.js', 'guide.js', 'founders.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// network first (always revalidated, so a new version is never mixed with old files); the cache is the fallback when offline or the network is slow
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const fromNet = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r && r.ok) { const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); } return r; });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4500));
  e.respondWith(Promise.race([fromNet, timeout]).catch(() => caches.match(e.request).then(m => m || fromNet)));
});
