// The web build's service worker: every file of the game is checked with the server on each load
// ('no-cache': the browser's copy is used only when the server says it hasn't changed), so after an
// update a browser never runs a mix of old and new modules (the blank screen a returning player
// could get, since GitHub Pages lets browsers keep files for 10 minutes and module imports carry no
// version). Other sites (the fonts) are left alone. Only the web build registers it (index.html);
// the desktop app loads from disk.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => fetch(req)));
});
