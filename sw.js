// Keeps the app working with no signal. Bump VERSION when you upload new files.
const VERSION = 'scorecard-v5';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Same-site files: try the network for 3 seconds (so updates arrive), otherwise use the saved copy.
// Calls to Google (your Sheet) are not touched here.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
  e.respondWith(
    Promise.race([fetch(req), timeout])
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./')))
  );
});
