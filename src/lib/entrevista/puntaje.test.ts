import { describe, expect, it } from "vitest";
import { aplicarPuntaje, ordenarPorPuntaje } from "./puntaje";

const vacio = { seleccion: [], puntajes: {} };

describe("aplicarPuntaje", () => {
  it("elige y puntúa con un solo toque", () => {
    const r = aplicarPuntaje(vacio, "neutros", 4);
    expect(r.seleccion).toEqual(["neutros"]);
    expect(r.puntajes).toEqual({ neutros: 4 });
  });

  it("cambia la nota sin elegirla dos veces", () => {
    const r = aplicarPuntaje(aplicarPuntaje(vacio, "neutros", 4), "neutros", 2);
    expect(r.seleccion).toEqual(["neutros"]);
    expect(r.puntajes).toEqual({ neutros: 2 });
  });

  it("descarta la paleta al volver a tocar la misma estrella", () => {
    const r = aplicarPuntaje(aplicarPuntaje(vacio, "neutros", 4), "neutros", 4);
    expect(r.seleccion).toEqual([]);
    expect(r.puntajes).toEqual({});
  });

  it("admite varias paletas a la vez", () => {
    const r = aplicarPuntaje(aplicarPuntaje(vacio, "neutros", 3), "tierras", 5);
    expect(r.seleccion).toEqual(["neutros", "tierras"]);
  });

  it("no toca el estado que recibe", () => {
    const antes = { seleccion: ["neutros"], puntajes: { neutros: 3 } };
    aplicarPuntaje(antes, "tierras", 5);
    expect(antes).toEqual({ seleccion: ["neutros"], puntajes: { neutros: 3 } });
  });
});

describe("ordenarPorPuntaje", () => {
  it("pone primero la que más le gustó", () => {
    const orden = ordenarPorPuntaje(["a", "b", "c"], { a: 2, b: 5, c: 4 });
    expect(orden).toEqual(["b", "c", "a"]);
  });

  it("desempata por el orden en que se eligieron", () => {
    expect(ordenarPorPuntaje(["a", "b"], { a: 3, b: 3 })).toEqual(["a", "b"]);
  });

  it("manda al final las entrevistas viejas, sin nota", () => {
    expect(ordenarPorPuntaje(["a", "b"], { b: 1 })).toEqual(["b", "a"]);
  });

  it("no se rompe si nunca hubo puntajes", () => {
    expect(ordenarPorPuntaje(["a", "b"])).toEqual(["a", "b"]);
  });
});
