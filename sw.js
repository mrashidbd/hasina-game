// Service worker: offline-first cache for the whole game.
// Bump VERSION whenever you deploy changes so players get the update.
const VERSION = 'kto-v16';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/game.js',
  './js/map.js',
  './js/config.js',
  './js/assets.js',
  './js/data/enemies.js',
  './js/data/heroes.js',
  './js/data/sounds.js',
  './js/data/asset-manifest.js',
  './js/lasso.js',
  './js/share.js',
  './js/audio.js',
  './js/i18n.js',
  './js/perks.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

// Install: fetch every file fresh from the network (cache: 'reload'), never from the
// browser's HTTP cache (GitHub Pages lets it keep files ~10 min), so a new VERSION is
// never filled with old files.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

// Activate: drop old caches, take over open pages, and if this replaced an older version,
// reload those pages so players get the new release right away (this also works for pages
// still running old code, which can't listen for updates themselves).
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter((k) => k !== VERSION);
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.clients.claim();
    if (!old.length) return; // first install: nothing stale on screen
    const wins = await self.clients.matchAll({ type: 'window' });
    await Promise.all(wins.map((w) => w.navigate(w.url).catch(() => {})));
  })());
});

// Stale-while-revalidate: serve from cache instantly, refresh in background. The refresh
// skips the HTTP cache too (no-cache = revalidate with the server).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const fresh = e.request.mode === 'navigate'
    ? new Request(e.request.url, { cache: 'no-cache' })
    : new Request(e.request, { cache: 'no-cache' });
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const network = fetch(fresh)
        .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
