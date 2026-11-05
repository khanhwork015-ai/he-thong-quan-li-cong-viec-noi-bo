const CACHE_NAME = 'tvm-stitch-tasks-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/stitch-theme.css',
  './js/app.js',
  './js/auth.js',
  './js/models.js',
  './js/store.js',
  './js/helpers.js',
  './js/components/sidebar.js',
  './js/components/topHeader.js',
  './js/components/dashboardView.js',
  './js/components/workspaceView.js',
  './js/components/taskDrawer.js',
  './js/components/createTaskModal.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('./index.html'))));
});
