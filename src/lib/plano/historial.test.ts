import { describe, expect, it } from "vitest";
import { LIMITE_HISTORIAL, aplicar, crearHistorial, deshacer, puedeDeshacer, puedeRehacer, rehacer } from "./historial";
import { moverNodo } from "./operaciones";
import { cuartoDeBruno } from "./prueba-casos";

describe("historial", () => {
  it("deshacer y rehacer devuelven exactamente los estados anteriores", () => {
    const s0 = cuartoDeBruno();
    const s1 = moverNodo(s0, "n3", { x: 420, y: 463.5 });
    const s2 = moverNodo(s1, "n3", { x: 430, y: 463.5 });
    const s3 = moverNodo(s2, "n3", { x: 440, y: 463.5 });
    let h = aplicar(aplicar(aplicar(crearHistorial(s0), s1), s2), s3);
    h = deshacer(deshacer(h));
    expect(h.presente).toBe(s1);
    expect(puedeRehacer(h)).toBe(true);
    h = rehacer(h);
    expect(h.presente).toBe(s2);
    h = deshacer(deshacer(h));
    expect(h.presente).toBe(s0);
    expect(puedeDeshacer(h)).toBe(false);
    expect(deshacer(h)).toBe(h);
  });

  it("aplicar después de deshacer borra lo que se podía rehacer", () => {
    let h = aplicar(aplicar(crearHistorial({ n: 0 }), { n: 1 }), { n: 2 });
    h = deshacer(h);
    const nuevo = { n: 9 };
    h = aplicar(h, nuevo);
    expect(h.presente).toBe(nuevo);
    expect(puedeRehacer(h)).toBe(false);
    expect(rehacer(h)).toBe(h);
  });

  it("guarda hasta 100 pasos", () => {
    const estados = Array.from({ length: 151 }, (_, i) => ({ n: i }));
    let h = crearHistorial(estados[0]);
    for (const e of estados.slice(1)) h = aplicar(h, e);
    expect(LIMITE_HISTORIAL).toBe(100);
    expect(h.pasado).toHaveLength(100);
    for (let i = 0; i < 100; i++) h = deshacer(h);
    expect(h.presente).toBe(estados[50]);
    expect(puedeDeshacer(h)).toBe(false);
    expect(deshacer(h)).toBe(h);
  });

  it("aplicar el mismo estado no suma un paso", () => {
    const h = crearHistorial({ n: 0 });
    expect(aplicar(h, h.presente)).toBe(h);
  });
});
