import { describe, expect, it } from "vitest";
import { largoCara, posicionNodo } from "./caras";
import { colocarAbertura } from "./edicion";
import { enderezarNivel } from "./enderezar";
import { alinearMuroCon, soltarNodo } from "./operaciones";
import { cuartoDeBruno, nivelDesdeEjes } from "./prueba-casos";

/** Un cuarto dibujado con el dedo: cuatro paredes torcidas que casi cierran. */
const aPulso = () =>
  nivelDesdeEjes(
    [
      ["n1", 0, 0],
      ["n2", 403, 6],
      ["n3", 399, 404],
      ["n4", -4, 398],
      ["n5", 3, 3],
    ],
    [
      ["m1", "n1", "n2", 15],
      ["m2", "n2", "n3", 15],
      ["m3", "n3", "n4", 15],
      ["m4", "n4", "n5", 15],
    ],
  );

describe("enderezar el plano", () => {
  it("endereza las paredes torcidas, junta las puntas pegadas y cierra el ambiente", () => {
    const n = aPulso();
    expect(n.ambientes).toHaveLength(0);
    const r = enderezarNivel(n);
    expect(r.nodos).toHaveLength(4);
    expect(r.ambientes).toHaveLength(1);
    // Cada muro quedó exactamente horizontal o vertical.
    for (const m of r.muros) {
      const a = posicionNodo(r, m.desde);
      const b = posicionNodo(r, m.hasta);
      expect(a.x === b.x || a.y === b.y).toBe(true);
    }
  });

  it("un muro que va en ángulo de verdad no se toca", () => {
    const n = nivelDesdeEjes(
      [["n1", 0, 0], ["n2", 400, 0], ["n3", 200, 300]],
      [["m1", "n1", "n2", 15], ["m2", "n2", "n3", 15]],
    );
    const r = enderezarNivel(n);
    expect(posicionNodo(r, "n3")).toEqual({ x: 200, y: 300 });
  });

  it("un cuarto que ya estaba derecho no cambia", () => {
    const n = cuartoDeBruno({ medido: true });
    const r = enderezarNivel(n);
    expect(r.nodos.map((x) => `${x.x},${x.y}`)).toEqual(n.nodos.map((x) => `${x.x},${x.y}`));
  });

  it("alinear corre el muro de costado hasta la línea del otro, sin girarlo ni cambiarle el largo", () => {
    // Dos tramos de la misma pared, uno corrido 7 cm.
    const n = nivelDesdeEjes(
      [["n1", 0, 0], ["n2", 300, 0], ["n3", 340, 7], ["n4", 640, 7]],
      [["m1", "n1", "n2", 15], ["m2", "n3", "n4", 15]],
    );
    const r = alinearMuroCon(n, "m2", "m1");
    expect("nivel" in r).toBe(true);
    const nivel = (r as { nivel: typeof n }).nivel;
    expect(posicionNodo(nivel, "n3")).toEqual({ x: 340, y: 0 });
    expect(posicionNodo(nivel, "n4")).toEqual({ x: 640, y: 0 });
  });

  it("no se alinean dos muros que van en direcciones distintas", () => {
    const n = nivelDesdeEjes(
      [["n1", 0, 0], ["n2", 300, 0], ["n3", 0, 100], ["n4", 0, 400]],
      [["m1", "n1", "n2", 15], ["m2", "n3", "n4", 15]],
    );
    expect(alinearMuroCon(n, "m2", "m1")).toEqual({ motivo: "no-paralelos" });
  });

  it("al acortar un muro, la puerta dibujada se acomoda adentro en vez de quedar colgando", () => {
    const base = colocarAbertura(cuartoDeBruno(), "puerta", { x: 200, y: 463 }, 10)!;
    const a = base.nivel.aberturas[0];
    const necesita = a.desde.valor + a.ancho.valor;
    // Se acorta esa pared arrastrando su esquina hasta que la puerta ya no entra.
    const r = soltarNodo(base.nivel, "n4", { x: 412.5 - (necesita - 60), y: 463.5 }, 5);
    const b = r.aberturas[0];
    const largo = largoCara(r, { muroId: b.muroId, cara: b.cara });
    expect(largo).toBeLessThan(necesita);
    expect(b.desde.valor).toBeGreaterThanOrEqual(0);
    expect(b.desde.valor + b.ancho.valor).toBeLessThanOrEqual(Math.ceil(largo));
  });
});
