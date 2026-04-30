import { ScramjetServiceWorker } from "/scram/scramjet.bundle.js";

const sw = new ScramjetServiceWorker();

self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

self.addEventListener("fetch", (event) => {
  if (sw.route(event)) {
    event.respondWith(sw.fetch(event));
  }
});
