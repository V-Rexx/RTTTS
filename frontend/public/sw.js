// CityTrack driver service worker.
//
// GPS trade-off: the spec for this worker called for it to watch GPS
// position directly (navigator.geolocation.watchPosition) and POST it to
// the backend, so tracking would keep running even if the driver's tab
// isn't focused. That's not a reliability quirk we can code around — the
// Geolocation API is only exposed on `Window`; it does not exist on
// `self`/`navigator` inside any Worker context, service workers included.
// There is no browser where `self.navigator.geolocation` is defined here.
//
// So the actual GPS watch + throttled POST to /api/buses/location happens
// in the page (see DriverPage.jsx's handleStartShift/watchPosition call) —
// that's the only context where the API is available. This worker's role
// is limited to what a service worker actually can do: make the driver
// console installable as a PWA (app-shell caching below) and acknowledge
// the START_TRACKING/STOP_TRACKING handshake so the messaging contract
// still exists for a future Background Sync-based retry queue if one is
// ever added.

const CACHE_NAME = 'citytrack-driver-v2';
const APP_SHELL = ['/driver', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

// Network-first: always try to get the latest app shell/assets, only
// falling back to cache when offline. Cache-first here is what caused a
// browser that had ever loaded the driver page to keep serving a stale
// index.html referencing JS/CSS chunk hashes that no longer exist after
// the next deploy — a 404 that blanked the whole page.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

let tracking = false;

self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  if (type === 'START_TRACKING') {
    tracking = true;
    event.source?.postMessage({ type: 'TRACKING_ACK', tracking });
  }

  if (type === 'STOP_TRACKING') {
    tracking = false;
    event.source?.postMessage({ type: 'TRACKING_ACK', tracking });
  }
});
