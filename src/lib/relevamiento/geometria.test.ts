// src/lib/relevamiento/geometria.test.ts
import { describe, expect, it } from "vitest";
import type { Pared } from "./formato";
import {
  diagonalCalculada,
  errorDeCierre,
  formaAParedes,
  perimetroCm,
  recorridoAPoligono,
  superficieM2,
} from "./geometria";

const p = (largo: number | null, giro: "D" | "I" = "D", id = "x"): Pared => ({ id, largo, giro });

describe("formas rápidas", () => {
  it("el rectángulo del cuarto de Bruno: 405 × 456 da 18,468 m² y cierra", () => {
    const paredes = formaAParedes("rectangulo", { ancho: 405, largo: 456 });
    expect(paredes.map((w) => w.largo)).toEqual([405, 456, 405, 456]);
    expect(errorDeCierre(paredes)).toBe(0);
    expect(superficieM2(paredes)).toBeCloseTo(18.468, 3);
    expect(perimetroCm(paredes)).toBe(1722);
  });

  it("una L de 400 × 500 con un recorte de 150 × 200 da 17 m² y cierra", () => {
    const paredes = formaAParedes("L", { anchoTotal: 400, largoTotal: 500, anchoRecorte: 150, largoRecorte: 200 });
    expect(paredes).toHaveLength(6);
    expect(errorDeCierre(paredes)).toBe(0);
    expect(superficieM2(paredes)).toBeCloseTo(17, 3);
  });

  it("una U de 600 × 500 con un hueco de 200 × 150 a 200 del borde da 27 m² y cierra", () => {
    const paredes = formaAParedes("U", { anchoTotal: 600, largoTotal: 500, anchoHueco: 200, largoHueco: 150, desdeHueco: 200 });
    expect(paredes).toHaveLength(8);
    expect(errorDeCierre(paredes)).toBe(0);
    expect(superficieM2(paredes)).toBeCloseTo(27, 3);
  });

  it("con una medida de la forma sin cargar, las paredes que dependen de ella quedan sin largo", () => {
    const paredes = formaAParedes("rectangulo", { ancho: 405, largo: null });
    expect(paredes.map((w) => w.largo)).toEqual([405, null, 405, null]);
    expect(superficieM2(paredes)).toBeNull();
  });
});

describe("recorrido", () => {
  it("dibuja los vértices en coordenadas de pantalla", () => {
    const { vertices, completo } = recorridoAPoligono([p(405), p(456), p(405), p(456)]);
    expect(completo).toBe(true);
    expect(vertices).toEqual([
      { x: 0, y: 0 },
      { x: 405, y: 0 },
      { x: 405, y: 456 },
      { x: 0, y: 456 },
      { x: 0, y: 0 },
    ]);
  });

  it("un recorrido que no cierra informa cuánto le falta: 11 cm", () => {
    expect(errorDeCierre([p(405), p(456), p(405), p(445)])).toBe(11);
  });

  it("se detiene en la primera pared sin medir", () => {
    const { vertices, completo } = recorridoAPoligono([p(405), p(null), p(405)]);
    expect(completo).toBe(false);
    expect(vertices).toHaveLength(2);
    expect(errorDeCierre([p(405), p(null)])).toBeNull();
  });

  it("calcula la diagonal entre dos vértices", () => {
    const paredes = [p(405), p(456), p(405), p(456)];
    expect(diagonalCalculada(paredes, 0, 2)).toBe(610);
    expect(diagonalCalculada([p(405), p(null)], 0, 2)).toBeNull();
  });
});
