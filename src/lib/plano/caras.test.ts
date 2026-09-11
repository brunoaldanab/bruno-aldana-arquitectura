import { describe, expect, it } from "vitest";
import { distanciaEnCara, esquinasCara, largoCara, nodosDeCara, siguienteCara } from "./caras";
import { medida, nivelVacio, type Nivel } from "./modelo";

/** Arma un nivel a mano, sin depender del resto del motor. */
function nivelCon(nodos: [string, number, number][], muros: [string, string, string, number][]): Nivel {
  const n = nivelVacio("nivel-1", "Planta baja");
  n.nodos = nodos.map(([id, x, y]) => ({ id, x, y }));
  n.muros = muros.map(([id, desde, hasta, e]) => ({
    id,
    desde,
    hasta,
    espesor: medida(e),
    altura: null,
    caras: { izquierda: null, derecha: null },
  }));
  return n;
}

const cuarto = nivelCon(
  [
    ["n1", -7.5, -7.5],
    ["n2", 412.5, -7.5],
    ["n3", 412.5, 463.5],
    ["n4", -7.5, 463.5],
  ],
  [
    ["m1", "n1", "n2", 15],
    ["m2", "n2", "n3", 15],
    ["m3", "n3", "n4", 15],
    ["m4", "n4", "n1", 15],
  ],
);

describe("caras", () => {
  it("la cara derecha se recorre de hasta a desde", () => {
    expect(nodosDeCara(cuarto, { muroId: "m1", cara: "izquierda" })).toEqual({ inicio: "n1", fin: "n2" });
    expect(nodosDeCara(cuarto, { muroId: "m1", cara: "derecha" })).toEqual({ inicio: "n2", fin: "n1" });
  });

  it("la cara siguiente es la que gira más a la izquierda en pantalla", () => {
    expect(siguienteCara(cuarto, { muroId: "m1", cara: "derecha" })).toEqual({ muroId: "m4", cara: "derecha" });
    expect(siguienteCara(cuarto, { muroId: "m1", cara: "izquierda" })).toEqual({ muroId: "m2", cara: "izquierda" });
  });

  it("las esquinas interiores del cuarto de Bruno caen en el interior de 405 × 456", () => {
    const arriba = esquinasCara(cuarto, { muroId: "m1", cara: "derecha" });
    expect(arriba.desde.x).toBeCloseTo(0, 1);
    expect(arriba.desde.y).toBeCloseTo(0, 1);
    expect(arriba.hasta.x).toBeCloseTo(405, 1);
    expect(arriba.hasta.y).toBeCloseTo(0, 1);
    expect(largoCara(cuarto, { muroId: "m1", cara: "derecha" })).toBeCloseTo(405, 1);
    expect(largoCara(cuarto, { muroId: "m2", cara: "derecha" })).toBeCloseTo(456, 1);
    expect(largoCara(cuarto, { muroId: "m1", cara: "izquierda" })).toBeCloseTo(435, 1);
    expect(largoCara(cuarto, { muroId: "m2", cara: "izquierda" })).toBeCloseTo(486, 1);
  });

  it("la distancia sobre una cara se cuenta desde la esquina del nodo desde", () => {
    // m3 va de n3 (abajo a la derecha) a n4: su esquina "desde" es (405, 456).
    expect(distanciaEnCara(cuarto, { muroId: "m3", cara: "derecha" }, { x: 300, y: 456 })).toBeCloseTo(105, 1);
  });

  it("en una T con tabique de 10, cada cara termina donde la corta el otro muro", () => {
    const casa = nivelCon(
      [
        ["A", -7.5, -7.5],
        ["E", 305, -7.5],
        ["B", 507.5, -7.5],
        ["H", 507.5, 255],
        ["C", 507.5, 407.5],
        ["F", 305, 407.5],
        ["D", -7.5, 407.5],
        ["G", 305, 255],
      ],
      [
        ["m1", "A", "E", 15],
        ["m2", "E", "B", 15],
        ["m3", "B", "H", 15],
        ["m4", "H", "C", 15],
        ["m5", "C", "F", 15],
        ["m6", "F", "D", 15],
        ["m7", "D", "A", 15],
        ["m8", "E", "G", 10],
        ["m9", "G", "F", 10],
        ["m10", "G", "H", 10],
      ],
    );
    // E→G bajando: la izquierda en pantalla es x > 305, el lado del baño.
    expect(largoCara(casa, { muroId: "m8", cara: "izquierda" })).toBeCloseTo(250, 1);
    // G→F: la derecha es x < 305, el dormitorio, que sigue de largo por G.
    expect(largoCara(casa, { muroId: "m9", cara: "derecha" })).toBeCloseTo(145, 1);
    expect(largoCara(casa, { muroId: "m8", cara: "derecha" })).toBeCloseTo(255, 1);
  });

  it("un muro suelto termina en la proyección de sus puntas", () => {
    const suelto = nivelCon(
      [
        ["n1", 100, 100],
        ["n2", 100, 200],
      ],
      [["m1", "n1", "n2", 15]],
    );
    expect(largoCara(suelto, { muroId: "m1", cara: "izquierda" })).toBeCloseTo(100, 1);
    expect(siguienteCara(suelto, { muroId: "m1", cara: "izquierda" })).toEqual({ muroId: "m1", cara: "derecha" });
  });
});
