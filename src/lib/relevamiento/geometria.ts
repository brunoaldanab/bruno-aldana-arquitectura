// src/lib/relevamiento/geometria.ts
import type { Giro, Pared } from "./formato";

export type Punto = { x: number; y: number };
export type TipoForma = "rectangulo" | "L" | "U";

/** Qué medidas pide cada forma rápida, en el orden en que conviene tomarlas. */
export const CAMPOS_FORMA: Record<TipoForma, { clave: string; etiqueta: string }[]> = {
  rectangulo: [
    { clave: "ancho", etiqueta: "Ancho" },
    { clave: "largo", etiqueta: "Largo" },
  ],
  L: [
    { clave: "anchoTotal", etiqueta: "Ancho total" },
    { clave: "largoTotal", etiqueta: "Largo total" },
    { clave: "anchoRecorte", etiqueta: "Ancho del recorte" },
    { clave: "largoRecorte", etiqueta: "Largo del recorte" },
  ],
  U: [
    { clave: "anchoTotal", etiqueta: "Ancho total" },
    { clave: "largoTotal", etiqueta: "Largo total" },
    { clave: "anchoHueco", etiqueta: "Ancho del hueco" },
    { clave: "largoHueco", etiqueta: "Largo del hueco" },
    { clave: "desdeHueco", etiqueta: "Hueco desde el borde izquierdo" },
  ],
};

type M = number | null;

/** Resta encadenada que propaga el "sin medir": si falta un término, falta el resultado. */
function resta(primero: M, ...resto: M[]): M {
  if (primero === null || resto.some((x) => x === null)) return null;
  return resto.reduce<number>((s, x) => s - (x as number), primero);
}

/**
 * Convierte una forma rápida en paredes, así todo lo demás —dibujo, controles,
 * archivo para Revit— trabaja con una sola representación.
 *
 * La L tiene el recorte en la esquina de arriba a la derecha; la U tiene el hueco
 * sobre el borde de arriba. Cualquier otra orientación se resuelve con recorrido.
 */
export function formaAParedes(tipo: TipoForma, medidas: Record<string, M>): Pared[] {
  const m = (k: string): M => medidas[k] ?? null;
  let tramos: [M, Giro][];
  if (tipo === "rectangulo") {
    tramos = [[m("ancho"), "D"], [m("largo"), "D"], [m("ancho"), "D"], [m("largo"), "D"]];
  } else if (tipo === "L") {
    tramos = [
      [resta(m("anchoTotal"), m("anchoRecorte")), "D"],
      [m("largoRecorte"), "I"],
      [m("anchoRecorte"), "D"],
      [resta(m("largoTotal"), m("largoRecorte")), "D"],
      [m("anchoTotal"), "D"],
      [m("largoTotal"), "D"],
    ];
  } else {
    tramos = [
      [m("desdeHueco"), "D"],
      [m("largoHueco"), "I"],
      [m("anchoHueco"), "I"],
      [m("largoHueco"), "D"],
      [resta(m("anchoTotal"), m("desdeHueco"), m("anchoHueco")), "D"],
      [m("largoTotal"), "D"],
      [m("anchoTotal"), "D"],
      [m("largoTotal"), "D"],
    ];
  }
  return tramos.map(([largo, giro], i) => ({ id: `pared-${i + 1}`, largo, giro }));
}

/** Gira la dirección 90°. En coordenadas de pantalla, a la derecha es (dx, dy) → (−dy, dx). */
function girar(d: Punto, giro: Giro): Punto {
  return giro === "D" ? { x: -d.y, y: d.x } : { x: d.y, y: -d.x };
}

export function recorridoAPoligono(paredes: Pared[]): { vertices: Punto[]; completo: boolean } {
  const vertices: Punto[] = [{ x: 0, y: 0 }];
  let dir: Punto = { x: 1, y: 0 };
  for (const pared of paredes) {
    if (pared.largo === null) return { vertices, completo: false };
    const ult = vertices[vertices.length - 1];
    vertices.push({ x: ult.x + dir.x * pared.largo, y: ult.y + dir.y * pared.largo });
    dir = girar(dir, pared.giro);
  }
  return { vertices, completo: paredes.length > 0 };
}

const distancia = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y);

/** Cuántos centímetros separan el final del recorrido de su punto de partida. */
export function errorDeCierre(paredes: Pared[]): number | null {
  const { vertices, completo } = recorridoAPoligono(paredes);
  if (!completo) return null;
  return Math.round(distancia(vertices[0], vertices[vertices.length - 1]));
}

export function superficieM2(paredes: Pared[]): number | null {
  const { vertices, completo } = recorridoAPoligono(paredes);
  if (!completo) return null;
  let doble = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    doble += vertices[i].x * vertices[i + 1].y - vertices[i + 1].x * vertices[i].y;
  }
  return Math.abs(doble) / 2 / 10000;
}

export function perimetroCm(paredes: Pared[]): number | null {
  if (paredes.length === 0 || paredes.some((w) => w.largo === null)) return null;
  return paredes.reduce((s, w) => s + (w.largo as number), 0);
}

export function diagonalCalculada(paredes: Pared[], desde: number, hasta: number): number | null {
  const { vertices } = recorridoAPoligono(paredes);
  if (desde >= vertices.length || hasta >= vertices.length) return null;
  return Math.round(distancia(vertices[desde], vertices[hasta]));
}
