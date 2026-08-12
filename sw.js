/* Minimal offline shell for Boss Says (GitHub Pages / local). */
const CACHE = "bosssays-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./js/physics.js",
  "./js/map.js",
  "./js/notifications.js",
  "./js/fx.js",
  "./js/meta.js",
  "./js/game.js",
  "./js/render.js",
  "./js/audio.js",
  "./js/main.js",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () {
        /* partial cache ok */
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      const net = fetch(event.request)
        .then(function (res) {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return res;
        })
        .catch(function () {
          return cached;
        });
      return cached || net;
    })
  );
});
