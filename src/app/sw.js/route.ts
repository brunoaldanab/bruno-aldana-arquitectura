// src/app/sw.js/route.ts
import { extraerRecursos, extraerUrlsDeCss } from "@/lib/visita/recursos";

export const dynamic = "force-static";

/**
 * El service worker del modo visita. Se arma en la compilación con la versión de la
 * publicación escrita adentro: cada deploy es un service worker distinto, el teléfono
 * lo instala solo, guarda la app nueva y descarta la vieja.
 *
 * El código de adentro no usa comillas invertidas ni `${` propios: todo lo que se
 * interpola es de este archivo.
 */
const VERSION = process.env.VERSION_APP ?? "desarrollo";

const CODIGO = `/* Service worker del modo visita · versión ${VERSION} · generado por src/app/sw.js/route.ts */
const VERSION = ${JSON.stringify(VERSION)};
const CACHE = "visita-" + VERSION;
const ESTATICOS = ["/manifest.webmanifest", "/icon.png", "/apple-icon.png", "/firma-horizontal-blanco.svg"];
const extraerRecursos = ${extraerRecursos.toString()};
const extraerUrlsDeCss = ${extraerUrlsDeCss.toString()};

async function precargar() {
  const cache = await caches.open(CACHE);
  const pagina = await fetch("/visita", { cache: "no-store" });
  if (!pagina.ok || pagina.redirected) throw new Error("No se pudo bajar /visita");
  const recursos = extraerRecursos(await pagina.clone().text());
  const hojas = recursos.filter(function (r) { return r.endsWith(".css"); });
  const fuentes = [];
  for (const hoja of hojas) {
    const respuesta = await fetch(hoja);
    if (!respuesta.ok) throw new Error("No se pudo bajar " + hoja);
    fuentes.push(...extraerUrlsDeCss(await respuesta.text(), hoja));
  }
  await cache.addAll(Array.from(new Set(ESTATICOS.concat(recursos, fuentes))));
  await cache.put("/visita", pagina);
}

self.addEventListener("install", function (event) {
  event.waitUntil(precargar().then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (claves) { return Promise.all(claves.filter(function (c) { return c !== CACHE; }).map(function (c) { return caches.delete(c); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname === "/visita") {
    event.respondWith(
      caches.open(CACHE)
        .then(function (cache) { return cache.match("/visita"); })
        .then(function (guardada) { return guardada || fetch(request); })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || ESTATICOS.includes(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async function (cache) {
        const guardada = await cache.match(request, { ignoreSearch: true });
        if (guardada) return guardada;
        const respuesta = await fetch(request);
        if (respuesta.ok && url.pathname.startsWith("/_next/static/")) cache.put(request, respuesta.clone());
        return respuesta;
      })
    );
  }
});
`;

export function GET() {
  return new Response(CODIGO, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
