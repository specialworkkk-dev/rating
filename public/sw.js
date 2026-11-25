// Review Booster service worker.
// Deliberately minimal: it never caches pages or data (owners must always
// see live numbers). It only shows a friendly offline page when a page can't
// load because there's no internet.
const CACHE = "rb-shell-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only page loads; everything else goes straight to the network as usual.
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
