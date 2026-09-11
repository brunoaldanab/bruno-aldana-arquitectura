// src/lib/plano/historial.ts
/**
 * Deshacer y rehacer como lista de estados completos. Como el motor nunca muta
 * un nivel, guardar la referencia alcanza: deshacer devuelve exactamente el
 * mismo objeto que había antes, sin copias ni diferencias que reconstruir.
 */
export const LIMITE_HISTORIAL = 100;

export type Historial<T> = { pasado: T[]; presente: T; futuro: T[] };

export const crearHistorial = <T>(inicial: T): Historial<T> => ({ pasado: [], presente: inicial, futuro: [] });

/** Suma un paso. Lo que se podía rehacer se descarta, y el paso más viejo se pierde pasados los 100. */
export function aplicar<T>(h: Historial<T>, estado: T): Historial<T> {
  if (estado === h.presente) return h;
  return { pasado: [...h.pasado, h.presente].slice(-LIMITE_HISTORIAL), presente: estado, futuro: [] };
}

export function deshacer<T>(h: Historial<T>): Historial<T> {
  if (h.pasado.length === 0) return h;
  return { pasado: h.pasado.slice(0, -1), presente: h.pasado[h.pasado.length - 1], futuro: [h.presente, ...h.futuro] };
}

export function rehacer<T>(h: Historial<T>): Historial<T> {
  if (h.futuro.length === 0) return h;
  return { pasado: [...h.pasado, h.presente], presente: h.futuro[0], futuro: h.futuro.slice(1) };
}

export const puedeDeshacer = <T>(h: Historial<T>): boolean => h.pasado.length > 0;
export const puedeRehacer = <T>(h: Historial<T>): boolean => h.futuro.length > 0;
