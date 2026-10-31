const CACHE_NAME = 'smart-hostel-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through to network
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
