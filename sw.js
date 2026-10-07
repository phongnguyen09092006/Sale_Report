// Service Worker for Offline PWA support — Network-First for code, Cache-First for assets
const CACHE_NAME = 'baocao-hungdung-v2.3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/animations.css',
  './assets/css/tailwind-config.js',
  './assets/js/bundle.js',
  './src/main.js',
  './src/core/constants.js',
  './src/core/parser.js',
  './src/core/date-utils.js',
  './src/core/reporter.js',
  './src/services/storage.js',
  './src/services/exporter.js',
  './src/ui/effects.js',
  './src/ui/toast.js',
  './src/ui/navigation.js',
  './src/ui/modal.js',
  './src/ui/views/report-view.js',
  './src/ui/views/history-view.js',
  './src/ui/views/settings-view.js'
];

const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  'https://cdn.tailwindcss.com'
];

// Install — cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — Network-First for code/scripts/HTML, Cache-First for static fonts/css
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isExternal = EXTERNAL_ASSETS.some(asset => e.request.url.startsWith(asset));
  const isLocal = url.origin === self.location.origin;

  // Network-First for HTML, navigation, and local JS code files to ensure instant updates
  const isHtml = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  const isCode = isHtml || (isLocal && (url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs') || url.pathname.endsWith('.json')));
  if (isCode) {
    e.respondWith(
      fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request).then((cached) => cached || (isHtml ? caches.match('./index.html') : null)))
    );
    return;
  }

  // Cache-First strategy for local and known external assets
  if (isLocal || isExternal) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(e.request).then((response) => {
          if (!response || response.status !== 200) return response;
          // Only cache same-origin or CORS responses
          if (response.type === 'basic' || response.type === 'cors') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Offline fallback
          return caches.match('./index.html');
        });
      })
    );
  }
});
