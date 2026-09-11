// src/lib/plano/superficie.ts
import { ladosDeAmbiente } from "./ambientes";
import type { Nivel } from "./modelo";
import { areaConSigno, distancia, redondear, redondearPunto, type Punto } from "./vector";

/**
 * El polígono interior de un ambiente, de cara a cara: es el que va al piso y
 * al Room de Revit. Un punto por esquina; si dos lados paralelos quedan con un
 * escalón (muros de distinto espesor), van los dos puntos del escalón.
 */
export function contornoInterior(nivel: Nivel, ambienteId: string): Punto[] {
  const lados = ladosDeAmbiente(nivel, ambienteId);
  const puntos: Punto[] = [];
  lados.forEach((lado, i) => {
    puntos.push(redondearPunto(lado.inicio));
    const siguiente = lados[(i + 1) % lados.length];
    if (distancia(lado.fin, siguiente.inicio) > 0.05) puntos.push(redondearPunto(lado.fin));
  });
  return puntos;
}

/** En m², con tres decimales: 405 × 456 cm da 18,468. */
export const superficie = (nivel: Nivel, ambienteId: string): number =>
  redondear(Math.abs(areaConSigno(contornoInterior(nivel, ambienteId))) / 10000, 3);

/** En cm, con un decimal. */
export function perimetro(nivel: Nivel, ambienteId: string): number {
  const p = contornoInterior(nivel, ambienteId);
  return redondear(p.reduce((s, a, i) => s + distancia(a, p[(i + 1) % p.length]), 0));
}

/** Regla del rayo: cuenta cuántos bordes cruza una semirrecta horizontal. */
export function puntoEnPoligono(p: Punto, poligono: Punto[]): boolean {
  let adentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i];
    const b = poligono[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) adentro = !adentro;
  }
  return adentro;
}

/**
 * Un punto seguro adentro, para el Room de Revit. El centroide sirve en un
 * rectángulo, pero en una U cae en el hueco: en ese caso se corta el polígono
 * con horizontales y se toma el medio del tramo interior más ancho.
 */
export function puntoInterior(poligono: Punto[]): Punto {
  const area = areaConSigno(poligono);
  if (area !== 0) {
    let cx = 0;
    let cy = 0;
    poligono.forEach((a, i) => {
      const b = poligono[(i + 1) % poligono.length];
      const f = a.x * b.y - b.x * a.y;
      cx += (a.x + b.x) * f;
      cy += (a.y + b.y) * f;
    });
    const centro = redondearPunto({ x: cx / (6 * area), y: cy / (6 * area) });
    if (puntoEnPoligono(centro, poligono)) return centro;
  }
  const ys = poligono.map((p) => p.y);
  const minY = Math.min(...ys);
  const alto = Math.max(...ys) - minY;
  let mejor: Punto = poligono[0];
  let mejorAncho = -1;
  for (const k of [0.5, 0.25, 0.75, 0.125, 0.375, 0.625, 0.875]) {
    const y = minY + alto * k;
    const xs: number[] = [];
    poligono.forEach((a, i) => {
      const b = poligono[(i + 1) % poligono.length];
      if (a.y > y !== b.y > y) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
    });
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      if (xs[i + 1] - xs[i] > mejorAncho) {
        mejorAncho = xs[i + 1] - xs[i];
        mejor = redondearPunto({ x: (xs[i] + xs[i + 1]) / 2, y });
      }
    }
    if (mejorAncho > 0) break;
  }
  return mejor;
}

export function ambienteEnPunto(nivel: Nivel, p: Punto): string | null {
  const a = nivel.ambientes.find((amb) => puntoEnPoligono(p, contornoInterior(nivel, amb.id)));
  return a?.id ?? null;
}
