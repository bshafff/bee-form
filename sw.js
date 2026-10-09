// ============================================
// SERVICE WORKER - BEE FORM PWA
// VERSION 7 - Cache Chart.js untuk offline
// ============================================

const CACHE_NAME = 'bee-form-v7';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Chart.js - WAJIB di-cache agar trend bisa tampil offline
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
];

// ==================== INSTALL ====================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        urlsToCache.map(url =>
          cache.add(url).catch(err => console.warn('Gagal cache:', url, err))
        )
      )
    )
  );
  self.skipWaiting();
});

// ==================== ACTIVATE ====================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// ==================== FETCH ====================
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Jangan intercept request ke Apps Script / Google API (harus selalu real-time)
  if (url.includes('script.google') ||
      url.includes('googleapis.com') ||
      url.includes('gstatic.com')) {
    return;
  }

  // Hanya handle GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache semua response sukses (basic = same-origin, cors = CDN)
        if (response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;

          // Fallback untuk navigasi ke index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        })
      )
  );
});
