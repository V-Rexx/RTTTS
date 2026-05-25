// CityTrack Service Worker
const CACHE_NAME = 'citytrack-v1';
const ASSETS_TO_CACHE = [
  '/driver',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle standard requests online, fallback to cache for static assets if offline
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// Emulated Service Worker background geolocation sharing logic
let watchId = null;

self.addEventListener('message', (event) => {
  if (event.data.type === 'START_TRACKING') {
    console.log('Service Worker started background GPS sharing...');
    // In a real device service worker, this would run geolocations in background
  }
  if (event.data.type === 'STOP_TRACKING') {
    console.log('Service Worker suspended GPS sharing.');
  }
});
