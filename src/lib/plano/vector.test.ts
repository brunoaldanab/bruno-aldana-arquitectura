import { describe, expect, it } from "vitest";
import {
  areaConSigno,
  distancia,
  interseccion,
  normalDerecha,
  normalIzquierda,
  por,
  productoCruz,
  redondearPunto,
  suma,
  unitario,
} from "./vector";

describe("vector", () => {
  it("opera con puntos", () => {
    expect(suma({ x: 1, y: 2 }, por({ x: 3, y: 4 }, 2))).toEqual({ x: 7, y: 10 });
    expect(distancia({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(unitario({ x: 0, y: -8 })).toEqual({ x: 0, y: -1 });
    expect(redondearPunto({ x: 7.46, y: -7.54 })).toEqual({ x: 7.5, y: -7.5 });
  });

  it("las normales se miran en pantalla, con y hacia abajo", () => {
    expect(normalIzquierda({ x: 1, y: 0 })).toEqual({ x: 0, y: -1 });
    expect(normalDerecha({ x: 1, y: 0 })).toEqual({ x: 0, y: 1 });
    expect(normalDerecha({ x: 0, y: 1 })).toEqual({ x: -1, y: 0 });
    // Girar de "abajo" a "derecha" en pantalla es girar a la izquierda: cruz negativa.
    expect(productoCruz({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1);
  });

  it("corta dos rectas y devuelve null si son paralelas", () => {
    const p = interseccion({ x: 300, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 250 }, { x: 1, y: 0 });
    expect(p).toEqual({ x: 300, y: 250 });
    expect(interseccion({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 5 }, { x: -1, y: 0 })).toBeNull();
  });

  it("el área con signo es negativa para un recorrido antihorario en pantalla", () => {
    const cuadrado = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 0 },
    ];
    expect(areaConSigno(cuadrado)).toBe(-100);
  });
});
