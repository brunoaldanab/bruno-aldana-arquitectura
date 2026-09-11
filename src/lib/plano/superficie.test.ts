import { describe, expect, it } from "vitest";
import { ambienteEnL, ambienteEnU, casaDeEjemplo, cuartoDeBruno } from "./prueba-casos";
import { ambienteEnPunto, contornoInterior, perimetro, puntoEnPoligono, puntoInterior, superficie } from "./superficie";

describe("superficie", () => {
  it("el cuarto de Bruno mide 18,468 m² y 1722 cm de perímetro interior", () => {
    const n = cuartoDeBruno();
    const contorno = contornoInterior(n, "amb1");
    expect(contorno).toHaveLength(4);
    const esperado = [
      [405, 0],
      [0, 0],
      [0, 456],
      [405, 456],
    ];
    contorno.forEach((p, i) => {
      expect(p.x).toBeCloseTo(esperado[i][0], 1);
      expect(p.y).toBeCloseTo(esperado[i][1], 1);
    });
    expect(superficie(n, "amb1")).toBe(18.468);
    expect(perimetro(n, "amb1")).toBe(1722);
  });

  it("los tres ambientes de la casa miden 12, 4,75 y 2,66 m²", () => {
    const n = casaDeEjemplo();
    expect(n.ambientes.map((a) => superficie(n, a.id))).toEqual([12, 4.75, 2.66]);
    expect(n.ambientes.map((a) => perimetro(n, a.id))).toEqual([1400, 880, 660]);
  });

  it("la L mide 16 m² y la U 19 m², y su punto interior cae adentro", () => {
    const l = ambienteEnL();
    const u = ambienteEnU();
    expect(superficie(l, "amb1")).toBe(16);
    expect(perimetro(l, "amb1")).toBe(1800);
    expect(superficie(u, "amb1")).toBe(19);
    expect(perimetro(u, "amb1")).toBe(2500);
    for (const n of [l, u]) {
      const poligono = contornoInterior(n, "amb1");
      expect(puntoEnPoligono(puntoInterior(poligono), poligono)).toBe(true);
    }
    // El centro de la U cae en el hueco: el punto interior no puede ser el centroide.
    expect(puntoEnPoligono({ x: 300, y: 125 }, contornoInterior(u, "amb1"))).toBe(false);
  });

  it("encuentra el ambiente de un punto", () => {
    const n = casaDeEjemplo();
    expect(ambienteEnPunto(n, { x: 400, y: 100 })).toBe(n.ambientes[1].id);
    expect(ambienteEnPunto(n, { x: 150, y: 200 })).toBe(n.ambientes[0].id);
    expect(ambienteEnPunto(n, { x: 1000, y: 1000 })).toBeNull();
  });
});
