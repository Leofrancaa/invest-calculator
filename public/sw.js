const OFFLINE_CACHE = "invest-calculator-offline-v1";
const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_PAGE, "/icons/icon-192.png"])),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("invest-calculator-offline-") &&
              key !== OFFLINE_CACHE,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method === "GET" &&
    new URL(event.request.url).origin === self.location.origin &&
    new URL(event.request.url).pathname === "/icons/icon-192.png"
  ) {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || fetch(event.request)),
    );
    return;
  }
  if (
    event.request.method !== "GET" ||
    event.request.mode !== "navigate" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    fetch(event.request).catch(
      async () => (await caches.match(OFFLINE_PAGE)) || Response.error(),
    ),
  );
});
