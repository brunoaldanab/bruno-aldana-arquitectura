// src/lib/plano/cotas.ts
import { ladosDeAmbiente, type Lado } from "./ambientes";
import { direccionCara, direccionMuro, esquinasCara, extremosCara, largoCara } from "./caras";
import { tipoDe } from "./electricos";
import type { Abertura, Nivel, NombreCara, PuntoElectrico, RefCara } from "./modelo";
import { ambienteEnPunto, contornoInterior, puntoEnPoligono } from "./superficie";
import {
  distancia,
  normalDerecha,
  normalIzquierda,
  por,
  productoCruz,
  resta,
  suma,
  unitario,
  type Punto,
} from "./vector";

/**
 * Las cotas que el plano dibuja solo. Hay dos clases y se distinguen a simple
 * vista: la del lado de un ambiente es la medida que Bruno carga —se toca y se
 * abre su campo—, y las demás salen del dibujo, así que van siempre con "≈"
 * hasta que la medida que las origina esté tomada.
 */

export type Cota = {
  /** Única en todo el plano: es la clave de React y el identificador del toque. */
  clave: string;
  inicio: Punto;
  fin: Punto;
  /** Hacia dónde se corre el texto respecto de la línea */
  normal: Punto;
  texto: string;
  tomada: boolean;
  /** "amb1:2" cuando tocarla abre la medida de ese lado; null cuando sale del dibujo. */
  toque: string | null;
};

export type CotaLado = Cota & { indice: number; lado: Lado };

const texto = (cm: number, tomada: boolean): string => `${tomada ? "" : "≈ "}${Math.round(cm)}`;

/** Las cotas interiores de un ambiente, corridas "separacion" cm hacia adentro de cada lado. */
export function cotasDeAmbiente(nivel: Nivel, ambienteId: string, separacion: number): CotaLado[] {
  const poligono = contornoInterior(nivel, ambienteId);
  return ladosDeAmbiente(nivel, ambienteId).map((lado, indice) => {
    const medio = por(suma(lado.inicio, lado.fin), 0.5);
    const izquierda = normalIzquierda(lado.direccion);
    const normal = puntoEnPoligono(suma(medio, izquierda), poligono) ? izquierda : normalDerecha(lado.direccion);
    const tomada = lado.medida?.tomada ?? false;
    return {
      clave: `${ambienteId}:${indice}`,
      toque: `${ambienteId}:${indice}`,
      indice,
      inicio: suma(lado.inicio, por(normal, separacion)),
      fin: suma(lado.fin, por(normal, separacion)),
      normal,
      texto: tomada ? String(lado.medida!.valor) : `≈ ${Math.round(lado.largo)}`,
      tomada,
      lado,
    };
  });
}

/**
 * La cadena de cotas de una cara con aberturas, como en un plano de Revit: de
 * la esquina al primer hueco, el ancho de cada hueco, lo que queda entre ellos
 * y el tramo hasta la otra esquina.
 */
export function cotasDeAberturas(nivel: Nivel, separacion: number): Cota[] {
  const porCara = new Map<string, Abertura[]>();
  for (const a of nivel.aberturas) {
    const clave = `${a.muroId}:${a.cara}`;
    porCara.set(clave, [...(porCara.get(clave) ?? []), a]);
  }

  const cotas: Cota[] = [];
  for (const [claveCara, lista] of porCara) {
    const [muroId, cara] = claveCara.split(":") as [string, NombreCara];
    if (!nivel.muros.some((m) => m.id === muroId)) continue;
    const ref = { muroId, cara };
    const u = direccionMuro(nivel, muroId);
    const normal = normalIzquierda(direccionCara(nivel, ref));
    const origen = suma(esquinasCara(nivel, ref).desde, por(normal, separacion));
    const largo = largoCara(nivel, ref);
    const en = (d: number) => suma(origen, por(u, d));

    const tramo = (clave: string, d0: number, d1: number, tomada: boolean) => {
      // Un tramo de menos de un centímetro no se lee: la abertura arranca en la esquina.
      if (d1 - d0 < 1) return;
      cotas.push({ clave, inicio: en(d0), fin: en(d1), normal, texto: texto(d1 - d0, tomada), tomada, toque: null });
    };

    let cursor = 0;
    for (const a of [...lista].sort((x, y) => x.desde.valor - y.desde.valor)) {
      // Solo el primer tramo es la medida cargada en la abertura; los de en medio salen del dibujo.
      const suyo = cursor === 0 && a.desde.tomada;
      tramo(`${a.id}:antes`, cursor, a.desde.valor, suyo);
      tramo(`${a.id}:ancho`, a.desde.valor, a.desde.valor + a.ancho.valor, a.ancho.tomada);
      cursor = Math.max(cursor, a.desde.valor + a.ancho.valor);
    }
    tramo(`${claveCara}:esquina`, cursor, largo, false);
  }
  return cotas;
}

/**
 * Los puntos eléctricos de cada cara, acotados desde la esquina hasta cada uno
 * y de ahí a la siguiente: así en el plano se lee de corrido dónde va cada caja.
 */
export function cotasDeElectricos(nivel: Nivel, separacion: number): Cota[] {
  const porCara = new Map<string, PuntoElectrico[]>();
  for (const e of nivel.electricos) {
    const clave = `${e.muroId}:${e.cara}`;
    porCara.set(clave, [...(porCara.get(clave) ?? []), e]);
  }

  const cotas: Cota[] = [];
  for (const [claveCara, lista] of porCara) {
    const [muroId, cara] = claveCara.split(":") as [string, NombreCara];
    if (!nivel.muros.some((m) => m.id === muroId)) continue;
    const ref = { muroId, cara };
    const u = direccionMuro(nivel, muroId);
    const normal = normalIzquierda(direccionCara(nivel, ref));
    const origen = suma(esquinasCara(nivel, ref).desde, por(normal, separacion));
    const en = (d: number) => suma(origen, por(u, d));

    let cursor = 0;
    for (const e of [...lista].sort((a, b) => a.desde.valor - b.desde.valor)) {
      const suyo = cursor === 0 && e.desde.tomada;
      if (e.desde.valor - cursor >= 1)
        cotas.push({
          clave: `${e.id}:desde`,
          inicio: en(cursor),
          fin: en(e.desde.valor),
          normal,
          texto: texto(e.desde.valor - cursor, suyo),
          tomada: suyo,
          toque: null,
        });
      cursor = e.desde.valor;
    }
  }
  return cotas;
}

/** La altura de cada punto, que en planta no se ve: va como rótulo al lado del código. */
export const alturaDePunto = (e: PuntoElectrico): string => `${e.altura.tomada ? "" : "≈ "}h ${e.altura.valor}`;

export const simboloDePunto = (e: PuntoElectrico): string => tipoDe(e.tipo).simbolo;

/** Hasta dónde llega un rayo antes de chocar contra una de esas caras. Null si no choca con ninguna. */
function alcanceMuro(nivel: Nivel, caras: RefCara[], desde: Punto, direccion: Punto): number | null {
  let mejor: number | null = null;
  for (const ref of caras) {
    const { inicio, fin } = extremosCara(nivel, ref);
    const s = resta(fin, inicio);
    const c = productoCruz(direccion, s);
    if (Math.abs(c) < 1e-9) continue;
    const d = resta(inicio, desde);
    const t = productoCruz(d, s) / c;
    const v = productoCruz(d, direccion) / c;
    if (t > 0 && v >= 0 && v <= 1 && (mejor === null || t < mejor)) mejor = t;
  }
  return mejor;
}

/**
 * Los dos lados de cada columna y su distancia a la pared más cercana en cada
 * eje. Se mide **siempre por adentro del ambiente donde está la columna**: en un
 * relevamiento nadie puede medir una distancia que atraviesa una pared, así que
 * los rayos solo chocan contra las caras de ese ambiente. Una columna que no
 * está dentro de ningún ambiente solo muestra sus lados.
 */
export function cotasDeColumnas(nivel: Nivel, separacion: number): Cota[] {
  const cotas: Cota[] = [];
  for (const c of nivel.columnas) {
    const r = (c.rotacion * Math.PI) / 180;
    const ex = { x: Math.cos(r), y: Math.sin(r) };
    const ey = { x: -Math.sin(r), y: Math.cos(r) };
    const centro = { x: c.x, y: c.y };
    const mitad = { x: c.ancho.valor / 2, y: c.profundidad.valor / 2 };
    const esquina = (sx: number, sy: number) => suma(centro, suma(por(ex, sx * mitad.x), por(ey, sy * mitad.y)));

    cotas.push({
      clave: `${c.id}:ancho`,
      inicio: suma(esquina(-1, 1), por(ey, separacion)),
      fin: suma(esquina(1, 1), por(ey, separacion)),
      normal: ey,
      texto: texto(c.ancho.valor, c.ancho.tomada),
      tomada: c.ancho.tomada,
      toque: null,
    });
    cotas.push({
      clave: `${c.id}:profundidad`,
      inicio: suma(esquina(1, -1), por(ex, separacion)),
      fin: suma(esquina(1, 1), por(ex, separacion)),
      normal: ex,
      texto: texto(c.profundidad.valor, c.profundidad.tomada),
      tomada: c.profundidad.tomada,
      toque: null,
    });

    const ambienteId = ambienteEnPunto(nivel, centro);
    const caras = nivel.ambientes.find((a) => a.id === ambienteId)?.contorno ?? [];
    for (const [eje, direccionEje] of [["x", ex], ["y", ey]] as const) {
      const media = eje === "x" ? mitad.x : mitad.y;
      let mejor: { direccion: Punto; t: number } | null = null;
      for (const signo of [1, -1]) {
        const direccion = por(direccionEje, signo);
        const t = alcanceMuro(nivel, caras, centro, direccion);
        if (t !== null && t > media && (mejor === null || t < mejor.t)) mejor = { direccion, t };
      }
      if (!mejor || mejor.t - media < 1) continue;
      cotas.push({
        clave: `${c.id}:${eje}`,
        inicio: suma(centro, por(mejor.direccion, media)),
        fin: suma(centro, por(mejor.direccion, mejor.t)),
        normal: normalIzquierda(mejor.direccion),
        texto: texto(mejor.t - media, false),
        tomada: false,
        toque: null,
      });
    }
  }
  return cotas;
}

/** Las cotas de un polígono cerrado, corridas hacia adentro. */
function cotasDePoligono(poligono: Punto[], separacion: number, prefijo: string): Cota[] {
  return poligono.map((p, i) => {
    const q = poligono[(i + 1) % poligono.length];
    const u = unitario(resta(q, p));
    const izquierda = normalIzquierda(u);
    const medio = por(suma(p, q), 0.5);
    const normal = puntoEnPoligono(suma(medio, izquierda), poligono) ? izquierda : normalDerecha(u);
    return {
      clave: `${prefijo}:${i}`,
      inicio: suma(p, por(normal, separacion)),
      fin: suma(q, por(normal, separacion)),
      normal,
      texto: texto(distancia(p, q), false),
      tomada: false,
      toque: null,
    };
  });
}

/** En la vista de techo: el contorno de cada zona y el largo de cada viga. */
export function cotasDeTecho(nivel: Nivel, separacion: number): Cota[] {
  const cotas = nivel.techos.flatMap((t) => cotasDePoligono(t.contorno, separacion, t.id));
  for (const v of nivel.vigas) {
    const u = unitario(resta(v.fin, v.inicio));
    const normal = normalIzquierda(u);
    const corrida = por(normal, v.ancho.valor / 2 + separacion);
    cotas.push({
      clave: `${v.id}:largo`,
      inicio: suma(v.inicio, corrida),
      fin: suma(v.fin, corrida),
      normal,
      texto: texto(distancia(v.inicio, v.fin), false),
      tomada: false,
      toque: null,
    });
  }
  return cotas;
}
