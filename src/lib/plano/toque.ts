// src/lib/plano/toque.ts
import { indiceLadoDeMuro } from "./ambientes";
import { direccionMuro, extremosCara, posicionNodo } from "./caras";
import { centroAbertura } from "./elementos";
import { posicionPunto } from "./electricos";
import type { Nivel, NombreCara } from "./modelo";
import { ambienteEnPunto, puntoEnPoligono } from "./superficie";
import { areaConSigno, distancia, normalIzquierda, por, productoEscalar, resta, suma, type Punto } from "./vector";

/**
 * Qué elemento hay bajo el dedo. Los muros miden 15 cm y en la pantalla del
 * teléfono eso son pocos píxeles: por eso cada toque lleva un radio en
 * centímetros que la pantalla calcula desde el tamaño del dedo.
 */
export type Seleccion =
  | { tipo: "nodo"; id: string }
  | { tipo: "muro"; id: string; cara: NombreCara; punto: Punto; ambienteId: string | null; indice: number | null }
  | { tipo: "abertura"; id: string }
  | { tipo: "columna"; id: string }
  | { tipo: "electrico"; id: string }
  | { tipo: "ambiente"; id: string }
  | { tipo: "techo"; id: string }
  | { tipo: "moldura"; id: string }
  | { tipo: "viga"; id: string };

export function distanciaASegmento(p: Punto, a: Punto, b: Punto): number {
  const ab = resta(b, a);
  const l2 = productoEscalar(ab, ab);
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, productoEscalar(resta(p, a), ab) / l2));
  return distancia(p, suma(a, por(ab, t)));
}

const ejeMuro = (nivel: Nivel, muroId: string) => {
  const m = nivel.muros.find((x) => x.id === muroId)!;
  return { a: posicionNodo(nivel, m.desde), b: posicionNodo(nivel, m.hasta), espesor: m.espesor.valor };
};

/** La cara del muro que queda del lado del punto, mirando de "desde" a "hasta". */
export function caraDelLado(nivel: Nivel, muroId: string, p: Punto): NombreCara {
  const { a } = ejeMuro(nivel, muroId);
  return productoEscalar(resta(p, a), normalIzquierda(direccionMuro(nivel, muroId))) > 0 ? "izquierda" : "derecha";
}

export const ambienteDeCara = (nivel: Nivel, muroId: string, cara: NombreCara): string | null =>
  nivel.ambientes.find((a) => a.contorno.some((c) => c.muroId === muroId && c.cara === cara))?.id ?? null;

/** Prefiere la cara tocada; si no encierra ningún ambiente, la otra, que es la que tiene cota. */
export function caraConAmbiente(nivel: Nivel, muroId: string, p: Punto): { cara: NombreCara; ambienteId: string | null } {
  const tocada = caraDelLado(nivel, muroId, p);
  const otra: NombreCara = tocada === "izquierda" ? "derecha" : "izquierda";
  const propio = ambienteDeCara(nivel, muroId, tocada);
  if (propio) return { cara: tocada, ambienteId: propio };
  const ajeno = ambienteDeCara(nivel, muroId, otra);
  return ajeno ? { cara: otra, ambienteId: ajeno } : { cara: tocada, ambienteId: null };
}

/** El muro más cercano cuyo eje pasa a menos de medio espesor + radio del punto. */
export function muroCercano(nivel: Nivel, p: Punto, radio: number): string | null {
  let mejor: { id: string; d: number } | null = null;
  for (const m of nivel.muros) {
    const { a, b, espesor } = ejeMuro(nivel, m.id);
    const d = distanciaASegmento(p, a, b);
    if (d <= espesor / 2 + radio && (!mejor || d < mejor.d)) mejor = { id: m.id, d };
  }
  return mejor?.id ?? null;
}

export function seleccionDeMuro(nivel: Nivel, muroId: string, p: Punto): Seleccion {
  const { cara, ambienteId } = caraConAmbiente(nivel, muroId, p);
  const indice = ambienteId ? indiceLadoDeMuro(nivel, ambienteId, muroId) : -1;
  return { tipo: "muro", id: muroId, cara, punto: p, ambienteId, indice: indice >= 0 ? indice : null };
}

/** En planta: nodo, abertura, columna, muro y, si no hay nada, el ambiente. */
export function tocarPlanta(nivel: Nivel, p: Punto, radio: number): Seleccion | null {
  const nodo = nivel.nodos
    .map((n) => ({ n, d: distancia(n, p) }))
    .filter((x) => x.d <= radio)
    .sort((x, y) => x.d - y.d)[0];
  if (nodo) return { tipo: "nodo", id: nodo.n.id };

  for (const a of nivel.aberturas) {
    const centro = centroAbertura(nivel, a);
    const u = direccionMuro(nivel, a.muroId);
    const medio = por(u, a.ancho.valor / 2);
    if (distanciaASegmento(p, resta(centro, medio), suma(centro, medio)) <= ejeMuro(nivel, a.muroId).espesor / 2 + radio)
      return { tipo: "abertura", id: a.id };
  }

  for (const e of nivel.electricos) {
    if (distancia(p, posicionPunto(nivel, e)) <= ejeMuro(nivel, e.muroId).espesor / 2 + radio) return { tipo: "electrico", id: e.id };
  }

  for (const c of nivel.columnas) {
    const rad = (-c.rotacion * Math.PI) / 180;
    const d = resta(p, c);
    const local = { x: d.x * Math.cos(rad) - d.y * Math.sin(rad), y: d.x * Math.sin(rad) + d.y * Math.cos(rad) };
    if (Math.abs(local.x) <= c.ancho.valor / 2 + radio && Math.abs(local.y) <= c.profundidad.valor / 2 + radio)
      return { tipo: "columna", id: c.id };
  }

  const muro = muroCercano(nivel, p, radio);
  if (muro) return seleccionDeMuro(nivel, muro, p);

  const ambiente = ambienteEnPunto(nivel, p);
  return ambiente ? { tipo: "ambiente", id: ambiente } : null;
}

/** En techo: viga, moldura, la zona más chica que contiene el punto y, si no, el ambiente. */
export function tocarTecho(nivel: Nivel, p: Punto, radio: number): Seleccion | null {
  const viga = nivel.vigas.find((v) => distanciaASegmento(p, v.inicio, v.fin) <= v.ancho.valor / 2 + radio);
  if (viga) return { tipo: "viga", id: viga.id };

  const moldura = nivel.molduras.find((m) =>
    m.caras.some((c) => {
      const { inicio, fin } = extremosCara(nivel, c);
      return distanciaASegmento(p, inicio, fin) <= m.ancho.valor + radio;
    }),
  );
  if (moldura) return { tipo: "moldura", id: moldura.id };

  const zona = nivel.techos
    .filter((t) => puntoEnPoligono(p, t.contorno))
    .sort((a, b) => Math.abs(areaConSigno(a.contorno)) - Math.abs(areaConSigno(b.contorno)))[0];
  if (zona) return { tipo: "techo", id: zona.id };

  const ambiente = ambienteEnPunto(nivel, p);
  return ambiente ? { tipo: "ambiente", id: ambiente } : null;
}
