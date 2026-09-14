// src/lib/plano/vista.ts
import type { Nivel } from "./modelo";
import { distancia, type Punto } from "./vector";

/**
 * Cómo se ve el plano en la pantalla: pantalla = plano · escala + (x, y), en píxeles.
 * El lienzo no anima: cada gesto calcula la vista nueva y se dibuja de una.
 */
export type Vista = { x: number; y: number; escala: number };
export type Caja = { minX: number; minY: number; maxX: number; maxY: number };

// Alejar más que esto deja el plano del tamaño de una uña y no sirve para nada.
export const ESCALA_MIN = 0.12;
export const ESCALA_MAX = 8;

const limitar = (escala: number) => Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escala));

export const planoAPantalla = (v: Vista, p: Punto): Punto => ({ x: p.x * v.escala + v.x, y: p.y * v.escala + v.y });
export const pantallaAPlano = (v: Vista, p: Punto): Punto => ({ x: (p.x - v.x) / v.escala, y: (p.y - v.y) / v.escala });

/** Todo lo que tiene posición en el nivel. Un nivel vacío muestra un cuadro de 6 m para empezar a dibujar. */
export function cajaDeNivel(nivel: Nivel): Caja {
  const puntos: Punto[] = [
    ...nivel.nodos,
    ...nivel.columnas,
    ...nivel.vigas.flatMap((v) => [v.inicio, v.fin]),
  ];
  if (puntos.length === 0) return { minX: -100, minY: -100, maxX: 500, maxY: 500 };
  return {
    minX: Math.min(...puntos.map((p) => p.x)),
    minY: Math.min(...puntos.map((p) => p.y)),
    maxX: Math.max(...puntos.map((p) => p.x)),
    maxY: Math.max(...puntos.map((p) => p.y)),
  };
}

/** Deja la caja entera y centrada en un lienzo de ancho × alto, con un margen en píxeles para las cotas. */
export function encuadrar(caja: Caja, ancho: number, alto: number, margenPx = 48): Vista {
  const w = Math.max(caja.maxX - caja.minX, 1);
  const h = Math.max(caja.maxY - caja.minY, 1);
  const escala = limitar(Math.min((ancho - 2 * margenPx) / w, (alto - 2 * margenPx) / h));
  const cx = (caja.minX + caja.maxX) / 2;
  const cy = (caja.minY + caja.maxY) / 2;
  return { x: ancho / 2 - cx * escala, y: alto / 2 - cy * escala, escala };
}

const medio = (a: Punto, b: Punto): Punto => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Dos dedos: el punto del plano que estaba entre los dedos sigue entre los dedos. */
export function pellizcar(v: Vista, antes: [Punto, Punto], despues: [Punto, Punto]): Vista {
  const d0 = distancia(antes[0], antes[1]);
  const factor = d0 < 1 ? 1 : distancia(despues[0], despues[1]) / d0;
  const escala = limitar(v.escala * factor);
  const ancla = pantallaAPlano(v, medio(antes[0], antes[1]));
  const destino = medio(despues[0], despues[1]);
  return { x: destino.x - ancla.x * escala, y: destino.y - ancla.y * escala, escala };
}

export const desplazar = (v: Vista, dx: number, dy: number): Vista => ({ ...v, x: v.x + dx, y: v.y + dy });
