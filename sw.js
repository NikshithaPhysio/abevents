// AB Events & Decors — Service Worker (PWA)
const CACHE_NAME = 'ab-events-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network first for API calls, cache first for static assets
  if(e.request.url.includes('firestore') || e.request.url.includes('cloudinary') || e.request.url.includes('googleapis')) {
    return; // Let Firebase/Cloudinary handle their own requests
  }
  e.respondWith(
    fetch(e.request).then(res => {
      if(res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// Push notification handling
self.addEventListener('push', e => {
  if(!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'AB Events', {
      body: data.body || 'New update from AB Events & Decors',
      icon: 'https://via.placeholder.com/192x192/C9A84C/000000?text=AB',
      badge: 'https://via.placeholder.com/72x72/C9A84C/000000?text=AB',
      vibrate: [200, 100, 200]
    })
  );
});
