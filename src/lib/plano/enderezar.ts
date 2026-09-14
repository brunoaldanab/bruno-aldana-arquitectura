// src/lib/plano/enderezar.ts
import { posicionNodo } from "./caras";
import type { Nivel } from "./modelo";
import { recalcular, unirNodos } from "./operaciones";
import { distancia, redondear, resta } from "./vector";

/**
 * Endereza un plano dibujado con el dedo. Hace de una sola vez las tres
 * correcciones que si no hay que ir a buscar muro por muro:
 *
 * 1. El muro que está *casi* horizontal queda horizontal, y el que está casi
 *    vertical queda vertical. Los muros que van en ángulo de verdad no se tocan.
 * 2. Las coordenadas que ya casi coincidían se igualan, así dos paredes que
 *    tendrían que estar en la misma línea quedan en la misma línea.
 * 3. Los nodos que quedaron pegados uno encima del otro se juntan en uno, que es
 *    lo que hace que un recorrido casi cerrado termine de cerrar.
 *
 * Todo en un solo paso del historial: si no gusta, se deshace.
 */

export const GRADOS_ENDEREZAR = 12;
export const TOLERANCIA_ENDEREZAR = 5;

/** Conjuntos disjuntos: agrupa las coordenadas que tienen que terminar valiendo lo mismo. */
function grupos(): { unir: (a: string, b: string) => void; raiz: (a: string) => string } {
  const padre = new Map<string, string>();
  const raiz = (a: string): string => {
    let x = a;
    while (padre.get(x) !== undefined && padre.get(x) !== x) x = padre.get(x)!;
    padre.set(a, x);
    return x;
  };
  const unir = (a: string, b: string) => {
    padre.set(raiz(a), raiz(b));
  };
  return { unir, raiz };
}

/** Qué eje impone cada muro: el que esté a menos de "grados" de horizontal o de vertical. */
function ejeDeMuro(nivel: Nivel, muroId: string, grados: number): "horizontal" | "vertical" | null {
  const m = nivel.muros.find((x) => x.id === muroId)!;
  const d = resta(posicionNodo(nivel, m.hasta), posicionNodo(nivel, m.desde));
  if (d.x === 0 && d.y === 0) return null;
  const desvio = (Math.atan2(Math.abs(d.y), Math.abs(d.x)) * 180) / Math.PI;
  if (desvio <= grados) return "horizontal";
  if (desvio >= 90 - grados) return "vertical";
  return null;
}

export function enderezarNivel(
  nivel: Nivel,
  { grados = GRADOS_ENDEREZAR, tolerancia = TOLERANCIA_ENDEREZAR } = {},
): Nivel {
  if (nivel.nodos.length === 0) return nivel;

  const ejeX = grupos();
  const ejeY = grupos();

  // 1. Un muro horizontal obliga a sus dos nodos a compartir la y; uno vertical, la x.
  for (const m of nivel.muros) {
    const eje = ejeDeMuro(nivel, m.id, grados);
    if (eje === "horizontal") ejeY.unir(m.desde, m.hasta);
    if (eje === "vertical") ejeX.unir(m.desde, m.hasta);
  }

  // 2. Las coordenadas que ya casi coincidían se juntan en la misma línea.
  const ordenados = (clave: "x" | "y") => [...nivel.nodos].sort((a, b) => a[clave] - b[clave]);
  for (const [clave, grupo] of [["x", ejeX], ["y", ejeY]] as const) {
    const lista = ordenados(clave);
    for (let i = 1; i < lista.length; i++) {
      if (Math.abs(lista[i][clave] - lista[i - 1][clave]) <= tolerancia) grupo.unir(lista[i].id, lista[i - 1].id);
    }
  }

  // 3. Cada grupo se planta en el promedio de lo que tenía.
  const promedio = (grupo: ReturnType<typeof grupos>, clave: "x" | "y") => {
    const suma = new Map<string, { total: number; cuantos: number }>();
    for (const n of nivel.nodos) {
      const r = grupo.raiz(n.id);
      const acc = suma.get(r) ?? { total: 0, cuantos: 0 };
      suma.set(r, { total: acc.total + n[clave], cuantos: acc.cuantos + 1 });
    }
    // Al medio centímetro, como el resto del motor: un plano ya derecho no se mueve.
    return (id: string) => {
      const acc = suma.get(grupo.raiz(id))!;
      return redondear(acc.total / acc.cuantos);
    };
  };
  const x = promedio(ejeX, "x");
  const y = promedio(ejeY, "y");

  let n: Nivel = { ...nivel, nodos: nivel.nodos.map((nodo) => ({ id: nodo.id, x: x(nodo.id), y: y(nodo.id) })) };

  // 4. Los nodos que quedaron encima se juntan: así el recorrido cierra.
  for (;;) {
    const par = parPegado(n, tolerancia);
    if (!par) break;
    const unido = unirNodos(n, par[0], par[1]);
    if (unido === n || unido.nodos.length >= n.nodos.length) break;
    n = unido;
  }

  return recalcular(nivel, n);
}

/** El primer par de nodos que quedó a menos de "tolerancia" y no comparte muro. */
function parPegado(nivel: Nivel, tolerancia: number): [string, string] | null {
  const juntos = new Set(nivel.muros.map((m) => [m.desde, m.hasta].sort().join(">")));
  for (let i = 0; i < nivel.nodos.length; i++) {
    for (let j = i + 1; j < nivel.nodos.length; j++) {
      const a = nivel.nodos[i];
      const b = nivel.nodos[j];
      if (juntos.has([a.id, b.id].sort().join(">"))) continue;
      if (distancia(a, b) <= tolerancia) return [a.id, b.id];
    }
  }
  return null;
}
