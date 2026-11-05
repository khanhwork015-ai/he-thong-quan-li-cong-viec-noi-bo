/**
 * THANH VŨ MEDIC CS3 - SERVICE WORKER (NETWORK FIRST STRATEGY)
 * Đảm bảo luôn cập nhật mã nguồn mới nhất, dọn sạch cache cũ
 */

const CACHE_NAME = 'tvm-gold-stitch-v3.5';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network First Strategy
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
