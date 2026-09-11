// src/lib/visita/recursos.test.ts
import { describe, expect, it } from "vitest";
import { extraerRecursos, extraerUrlsDeCss } from "./recursos";

const html = `<!DOCTYPE html><html><head>
<link rel="preload" href="/_next/static/media/archivo-latin.woff2" as="font" crossorigin=""/>
<link rel="stylesheet" href="/_next/static/css/app.css?dpl=dpl_123" data-precedence="next"/>
<script src="/_next/static/chunks/webpack-abc.js" async=""></script>
<script src="/_next/static/chunks/webpack-abc.js" async=""></script>
</head><body><script>self.__next_f.push([1,"2:I[\\"/_next/static/chunks/app/visita/page-def.js\\"]"])</script>
<script>var base="/_next/static/";</script></body></html>`;

const css = `@font-face{font-family:Archivo;src:url(../media/archivo.woff2) format("woff2")}
@font-face{src:url("/_next/static/media/mono.woff2")}
.x{background:url(data:image/svg+xml;base64,AAAA)}
@import url(https://fonts.googleapis.com/css2?family=X);`;

describe("recursos que guarda el service worker", () => {
  it("saca del HTML cada archivo estático una sola vez, sin parámetros", () => {
    expect(extraerRecursos(html)).toEqual([
      "/_next/static/media/archivo-latin.woff2",
      "/_next/static/css/app.css",
      "/_next/static/chunks/webpack-abc.js",
      "/_next/static/chunks/app/visita/page-def.js",
    ]);
  });

  it("saca de la hoja de estilos las tipografías propias, resolviendo rutas relativas", () => {
    expect(extraerUrlsDeCss(css, "/_next/static/css/app.css")).toEqual([
      "/_next/static/media/archivo.woff2",
      "/_next/static/media/mono.woff2",
    ]);
  });

  it("se pueden copiar dentro del service worker porque no usan nada de afuera", () => {
    const copiaRecursos = new Function(`return ${extraerRecursos.toString()}`)();
    const copiaCss = new Function(`return ${extraerUrlsDeCss.toString()}`)();
    expect(copiaRecursos(html)).toEqual(extraerRecursos(html));
    expect(copiaCss(css, "/_next/static/css/app.css")).toEqual(extraerUrlsDeCss(css, "/_next/static/css/app.css"));
  });
});
