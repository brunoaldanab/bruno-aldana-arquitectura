// src/lib/relevamiento/voz.test.ts
import { describe, expect, it } from "vitest";
import { parsearMedida } from "./voz";

const cm = (n: number) => ({ tipo: "medida", cm: n });

describe("parsearMedida", () => {
  it.each([
    ["405", 405],
    ["4,05", 405],
    ["4.05", 405],
    ["4,5", 450],
    ["cuatro cero cinco", 405],
    ["Cuatro cero cinco.", 405],
    ["cuatrocientos cinco", 405],
    ["cuatro con cero cinco", 405],
    ["cuatro con cincuenta", 450],
    ["cuatro metros cincuenta y seis", 456],
    ["cuatro metros", 400],
    ["dos sesenta y tres", 263],
    ["quince centímetros", 15],
    ["15 cm", 15],
    ["veintiuno", 21],
    ["mil ochocientos veinte", 1820],
    ["4.050", 405],
    ["4.050 m", 405],
    ["4050 mm", 405],
  ])("«%s» son %i cm", (texto, esperado) => {
    expect(parsearMedida(texto)).toEqual(cm(esperado));
  });

  it("«cuatro con cinco» no adivina: puede ser 405 o 450", () => {
    expect(parsearMedida("cuatro con cinco")).toEqual({ tipo: "ambiguo", opciones: [405, 450] });
    expect(parsearMedida("cuatro metros cinco")).toEqual({ tipo: "ambiguo", opciones: [405, 450] });
  });

  it("un número suelto menor que 10 puede ser metros o centímetros", () => {
    expect(parsearMedida("tres")).toEqual({ tipo: "ambiguo", opciones: [300, 3] });
    expect(parsearMedida("3")).toEqual({ tipo: "ambiguo", opciones: [300, 3] });
  });

  it("lo que no es una medida es inválido", () => {
    expect(parsearMedida("hola")).toEqual({ tipo: "invalido" });
    expect(parsearMedida("")).toEqual({ tipo: "invalido" });
  });
});
