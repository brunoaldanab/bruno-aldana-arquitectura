import { describe, expect, it } from "vitest";
import { aplicarArrastre } from "./herramientas";
import { soltarNodo, unirMuros, unirNodos } from "./operaciones";
import { nivelDesdeEjes } from "./prueba-casos";
import { posicionNodo } from "./caras";

/** Tres paredes de un cuarto de 400 × 400, con la cuarta sin cerrar. */
const abierto = () =>
  nivelDesdeEjes(
    [
      ["n1", 0, 0],
      ["n2", 400, 0],
      ["n3", 400, 400],
      ["n4", 0, 400],
    ],
    [
      ["m1", "n1", "n2", 15],
      ["m2", "n2", "n3", 15],
      ["m3", "n3", "n4", 15],
    ],
  );

describe("uniones de muros", () => {
  it("soltar un nodo encima de otro los junta y cierra el ambiente", () => {
    // Se agrega la cuarta pared con su punta lejos, y después se arrastra al primer nodo.
    let n = nivelDesdeEjes(
      [["n1", 0, 0], ["n2", 400, 0], ["n3", 400, 400], ["n4", 0, 400], ["n5", 60, 40]],
      [["m1", "n1", "n2", 15], ["m2", "n2", "n3", 15], ["m3", "n3", "n4", 15], ["m4", "n4", "n5", 15]],
    );
    expect(n.ambientes).toHaveLength(0);
    n = soltarNodo(n, "n5", { x: 8, y: 6 }, 20);
    expect(n.nodos).toHaveLength(4);
    expect(n.ambientes).toHaveLength(1);
  });

  it("soltar un nodo sobre el eje de otro muro lo parte y se engancha ahí", () => {
    // Un muro suelto cuya punta se arrastra contra el muro de arriba.
    const n = nivelDesdeEjes(
      [["n1", 0, 0], ["n2", 400, 0], ["n3", 200, 300], ["n4", 200, 40]],
      [["m1", "n1", "n2", 15], ["m2", "n3", "n4", 15]],
    );
    const r = soltarNodo(n, "n4", { x: 200, y: 6 }, 20);
    expect(r.muros).toHaveLength(3);
    expect(r.nodos).toHaveLength(4);
    // El muro de arriba quedó partido en dos, y el suelto llega justo al eje.
    expect(posicionNodo(r, r.muros.find((m) => m.id === "m2")!.hasta)).toEqual({ x: 200, y: 0 });
  });

  it("unir lleva el muro hasta el eje del otro y hace la T", () => {
    // El muro m3 no llega a m1: se estira hasta él y lo parte por el medio.
    const n = nivelDesdeEjes(
      [["n1", 0, 0], ["n2", 400, 0], ["n3", 200, 300], ["n4", 200, 120]],
      [["m1", "n1", "n2", 15], ["m3", "n3", "n4", 15]],
    );
    const r = unirMuros(n, "m3", "m1");
    expect("nivel" in r).toBe(true);
    const nivel = (r as { nivel: typeof n }).nivel;
    expect(posicionNodo(nivel, nivel.muros.find((m) => m.id === "m3")!.hasta)).toEqual({ x: 200, y: 0 });
    expect(nivel.muros).toHaveLength(3);
  });

  it("dos muros paralelos no se pueden estirar uno hasta el otro", () => {
    const n = nivelDesdeEjes(
      [["n1", 0, 0], ["n2", 400, 0], ["n3", 0, 300], ["n4", 400, 300]],
      [["m1", "n1", "n2", 15], ["m2", "n3", "n4", 15]],
    );
    expect(unirMuros(n, "m1", "m2")).toEqual({ motivo: "paralelos" });
  });

  it("si el cruce cae más allá del otro muro, los dos estiran y se juntan en esquina", () => {
    // m1 termina en x=100 y m3 sube por x=300: el cruce queda fuera de los dos.
    const n = nivelDesdeEjes(
      [["n1", 0, 0], ["n2", 100, 0], ["n3", 300, 300], ["n4", 300, 120]],
      [["m1", "n1", "n2", 15], ["m3", "n3", "n4", 15]],
    );
    const r = unirMuros(n, "m3", "m1");
    expect("nivel" in r).toBe(true);
    const nivel = (r as { nivel: typeof n }).nivel;
    // Las dos puntas terminan en el mismo nodo, en (300, 0).
    expect(nivel.nodos).toHaveLength(3);
    const m1 = nivel.muros.find((m) => m.id === "m1")!;
    const m3 = nivel.muros.find((m) => m.id === "m3")!;
    expect(posicionNodo(nivel, m1.hasta)).toEqual({ x: 300, y: 0 });
    expect(m3.hasta).toBe(m1.hasta);
  });

  it("juntar dos nodos borra el muro que queda sin largo", () => {
    const n = abierto();
    const r = unirNodos(n, "n4", "n3");
    expect(r.muros.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(r.nodos).toHaveLength(3);
  });

  it("el arrastre solo engancha al soltar, no mientras se mueve", () => {
    const n = nivelDesdeEjes(
      [["n1", 0, 0], ["n2", 400, 0], ["n3", 400, 400], ["n4", 0, 400], ["n5", 60, 40]],
      [["m1", "n1", "n2", 15], ["m2", "n2", "n3", 15], ["m3", "n3", "n4", 15], ["m4", "n4", "n5", 15]],
    );
    const moviendo = aplicarArrastre(n, { tipo: "nodo", id: "n5" }, { x: 8, y: 6 }, false, 20);
    expect(moviendo.nodos).toHaveLength(5);
    const soltado = aplicarArrastre(n, { tipo: "nodo", id: "n5" }, { x: 8, y: 6 }, true, 20);
    expect(soltado.nodos).toHaveLength(4);
  });
});
