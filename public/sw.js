// public/sw.js
/*
 * Service worker del relevamiento. Hace una sola cosa: que la página de
 * relevamiento abra sin señal en la visita. No toca nada más de la app.
 * Subir VERSION cuando cambie la estrategia, para descartar lo guardado antes.
 */
const VERSION = "relevamiento-v1";
const ES_RELEVAMIENTO = /^\/contactos\/[^/]+\/relevamiento\/?$/;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const guardada = await cache.match(request);
        if (guardada) return guardada;
        const respuesta = await fetch(request);
        if (respuesta.ok) cache.put(request, respuesta.clone());
        return respuesta;
      }),
    );
    return;
  }

  if (request.mode === "navigate" && ES_RELEVAMIENTO.test(url.pathname)) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        try {
          const respuesta = await fetch(request);
          if (respuesta.ok && !respuesta.redirected) cache.put(request, respuesta.clone());
          return respuesta;
        } catch {
          const guardada = await cache.match(request);
          if (guardada) return guardada;
          throw new Error("Sin señal y sin copia guardada de esta página");
        }
      }),
    );
  }
});
