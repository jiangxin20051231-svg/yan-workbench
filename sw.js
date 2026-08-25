const CACHE_NAME = "yan-workbench-v2";
const ASSETS = [
  "/yan-workbench/workbench-mobile.html",
  "/yan-workbench/workbench-desktop.html",
  "/yan-workbench/manifest.json",
  "/yan-workbench/sw.js",
  "/yan-workbench/assets/greet-banner.jpg",
  "/yan-workbench/assets/icon-192.jpg",
  "/yan-workbench/assets/icon-512.jpg",
  "/yan-workbench/assets/apple-touch-icon.jpg",
  "/yan-workbench/assets/favicon.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => caches.match("/yan-workbench/workbench-mobile.html"))
      );
    })
  );
});
