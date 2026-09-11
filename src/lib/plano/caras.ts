// src/lib/plano/caras.ts
import type { Muro, Nivel, RefCara } from "./modelo";
import {
  interseccion,
  normalIzquierda,
  por,
  productoCruz,
  productoEscalar,
  resta,
  suma,
  unitario,
  type Punto,
} from "./vector";

/**
 * Las caras de los muros vistas como un grafo. Cada cara es un recorrido con
 * sentido que deja su ambiente a la izquierda en pantalla: la cara izquierda
 * va de "desde" a "hasta", la derecha al revés. Así, seguir "la cara que gira
 * más a la izquierda" en cada nodo da la vuelta a un ambiente.
 */

type Grafo = {
  nodos: Map<string, Punto>;
  muros: Map<string, Muro>;
  salientes: Map<string, RefCara[]>;
};

// El nivel nunca se muta, así que el grafo se arma una vez por objeto.
const cache = new WeakMap<Nivel, Grafo>();

function grafo(nivel: Nivel): Grafo {
  const guardado = cache.get(nivel);
  if (guardado) return guardado;
  const nodos = new Map(nivel.nodos.map((n) => [n.id, { x: n.x, y: n.y }]));
  const muros = new Map(nivel.muros.map((m) => [m.id, m]));
  const salientes = new Map<string, RefCara[]>();
  const agregar = (nodo: string, ref: RefCara) => salientes.set(nodo, [...(salientes.get(nodo) ?? []), ref]);
  for (const m of nivel.muros) {
    agregar(m.desde, { muroId: m.id, cara: "izquierda" });
    agregar(m.hasta, { muroId: m.id, cara: "derecha" });
  }
  const g = { nodos, muros, salientes };
  cache.set(nivel, g);
  return g;
}

export const mismaCara = (a: RefCara, b: RefCara): boolean => a.muroId === b.muroId && a.cara === b.cara;

export const caraOpuesta = (ref: RefCara): RefCara => ({
  muroId: ref.muroId,
  cara: ref.cara === "izquierda" ? "derecha" : "izquierda",
});

/** Todas las caras del nivel, en el orden de los muros. */
export const todasLasCaras = (nivel: Nivel): RefCara[] =>
  nivel.muros.flatMap((m) => [
    { muroId: m.id, cara: "izquierda" as const },
    { muroId: m.id, cara: "derecha" as const },
  ]);

export function nodosDeCara(nivel: Nivel, ref: RefCara): { inicio: string; fin: string } {
  const m = grafo(nivel).muros.get(ref.muroId)!;
  return ref.cara === "izquierda" ? { inicio: m.desde, fin: m.hasta } : { inicio: m.hasta, fin: m.desde };
}

export function posicionNodo(nivel: Nivel, nodoId: string): Punto {
  return grafo(nivel).nodos.get(nodoId)!;
}

/** Dirección del recorrido de la cara (no la del muro). */
export function direccionCara(nivel: Nivel, ref: RefCara): Punto {
  const { inicio, fin } = nodosDeCara(nivel, ref);
  return unitario(resta(posicionNodo(nivel, fin), posicionNodo(nivel, inicio)));
}

/** La recta de la cara: el eje corrido medio espesor hacia el lado del ambiente. */
export function lineaCara(nivel: Nivel, ref: RefCara): { punto: Punto; direccion: Punto } {
  const m = grafo(nivel).muros.get(ref.muroId)!;
  const direccion = direccionCara(nivel, ref);
  const inicio = posicionNodo(nivel, nodosDeCara(nivel, ref).inicio);
  return { punto: suma(inicio, por(normalIzquierda(direccion), m.espesor.valor / 2)), direccion };
}

export function siguienteCara(nivel: Nivel, ref: RefCara): RefCara {
  const d = direccionCara(nivel, ref);
  const { fin } = nodosDeCara(nivel, ref);
  let mejor = caraOpuesta(ref);
  let mejorGiro = -Math.PI;
  for (const s of grafo(nivel).salientes.get(fin) ?? []) {
    if (s.muroId === ref.muroId) continue;
    const ds = direccionCara(nivel, s);
    // Con y hacia abajo, girar a la izquierda en pantalla da producto cruz negativo.
    const giro = Math.atan2(-productoCruz(d, ds), productoEscalar(d, ds));
    if (giro > mejorGiro) {
      mejorGiro = giro;
      mejor = s;
    }
  }
  return mejor;
}

export function anteriorCara(nivel: Nivel, ref: RefCara): RefCara {
  const { inicio } = nodosDeCara(nivel, ref);
  for (const s of grafo(nivel).salientes.get(inicio) ?? []) {
    const llegada = caraOpuesta(s);
    if (mismaCara(siguienteCara(nivel, llegada), ref)) return llegada;
  }
  return caraOpuesta(ref);
}

/** Donde se cortan dos caras seguidas; si son paralelas, cada una termina en la proyección del nodo. */
export function esquinaEntre(nivel: Nivel, llega: RefCara, sale: RefCara, delLadoDe: "llega" | "sale"): Punto {
  const a = lineaCara(nivel, llega);
  const b = lineaCara(nivel, sale);
  const corte = llega.muroId === sale.muroId ? null : interseccion(a.punto, a.direccion, b.punto, b.direccion);
  if (corte) return corte;
  const propia = delLadoDe === "llega" ? llega : sale;
  const linea = delLadoDe === "llega" ? a : b;
  const nodo = posicionNodo(nivel, nodosDeCara(nivel, llega).fin);
  const m = grafo(nivel).muros.get(propia.muroId)!;
  return suma(nodo, por(normalIzquierda(linea.direccion), m.espesor.valor / 2));
}

/** Esquinas de la cara en el sentido de su recorrido. */
export function extremosCara(nivel: Nivel, ref: RefCara): { inicio: Punto; fin: Punto } {
  return {
    inicio: esquinaEntre(nivel, anteriorCara(nivel, ref), ref, "sale"),
    fin: esquinaEntre(nivel, ref, siguienteCara(nivel, ref), "llega"),
  };
}

/** Esquinas de la cara en el nodo "desde" y en el nodo "hasta" del muro (ajuste 4). */
export function esquinasCara(nivel: Nivel, ref: RefCara): { desde: Punto; hasta: Punto } {
  const { inicio, fin } = extremosCara(nivel, ref);
  return ref.cara === "izquierda" ? { desde: inicio, hasta: fin } : { desde: fin, hasta: inicio };
}

export function largoCara(nivel: Nivel, ref: RefCara): number {
  const { inicio, fin } = extremosCara(nivel, ref);
  return productoEscalar(resta(fin, inicio), direccionCara(nivel, ref));
}

/** Dirección del muro, de "desde" a "hasta". */
export function direccionMuro(nivel: Nivel, muroId: string): Punto {
  return direccionCara(nivel, { muroId, cara: "izquierda" });
}

/** Centímetros sobre la cara desde su esquina del nodo "desde", en el sentido del muro. */
export function distanciaEnCara(nivel: Nivel, ref: RefCara, p: Punto): number {
  return productoEscalar(resta(p, esquinasCara(nivel, ref).desde), direccionMuro(nivel, ref.muroId));
}

/** Muros y caras que salen de un nodo. */
export function carasSalientes(nivel: Nivel, nodoId: string): RefCara[] {
  return grafo(nivel).salientes.get(nodoId) ?? [];
}
