const CACHE_NAME = 'sismo-alerta-v1';
const urlsToCache = [
  '/sismodetectoreltecnicoluis/',
  '/sismodetectoreltecnicoluis/index.html',
  '/sismodetectoreltecnicoluis/icon-192.png',
  '/sismodetectoreltecnicoluis/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Always fetch network first, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
