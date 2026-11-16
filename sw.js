// ============================================
// SERVICE WORKER - BEE FORM PWA
// VERSION 10
// ============================================
const CACHE_NAME = 'bee-form-v39';
const urlsToCache = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(urlsToCache.map(url => cache.add(url).catch(err => console.warn('Gagal cache:', url, err))))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.href.includes('script.google') || url.href.includes('googleapis.com') || url.href.includes('gstatic.com') || url.pathname.endsWith('version.json')) return;
  if (req.method !== 'GET') return;
  if (url.searchParams.has('v') || url.searchParams.has('t')) return;

  event.respondWith(
    fetch(req).then(response => {
        if (response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => caches.match(req).then(cached => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('Offline', { status: 503 });
      }))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
