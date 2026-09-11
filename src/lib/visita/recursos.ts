// src/lib/visita/recursos.ts

/*
 * Estas dos funciones se copian tal cual dentro del service worker
 * (src/app/sw.js/route.ts) con Function.prototype.toString. Por eso no pueden usar
 * nada de afuera: ni imports, ni otras funciones o constantes de este archivo.
 * La tercera prueba de recursos.test.ts lo controla.
 */

/** Los archivos de /_next/static/ que nombra el HTML, sin parámetros y sin repetir. */
export function extraerRecursos(html: string): string[] {
  const patron = /\/_next\/static\/[^"'\\\s<>)?]+?\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|ico)(?=[?"'\\\s<>)]|$)/g;
  return Array.from(new Set(html.match(patron) ?? []));
}

/** Las direcciones propias que nombra una hoja de estilos (tipografías), resueltas desde la hoja. */
export function extraerUrlsDeCss(css: string, urlCss: string): string[] {
  const base = "https://base.local";
  const patron = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  const salida: string[] = [];
  let encontrado: RegExpExecArray | null;
  while ((encontrado = patron.exec(css)) !== null) {
    const valor = encontrado[2].trim();
    if (valor.startsWith("data:")) continue;
    const absoluta = new URL(valor, base + urlCss);
    if (absoluta.origin === base) salida.push(absoluta.pathname);
  }
  return Array.from(new Set(salida));
}
