import { describe, expect, it } from "vitest";
import { ladosDeAmbiente } from "./ambientes";
import { medida, type Nivel } from "./modelo";
import { casaDeEjemplo, cuartoDeBruno, medirLado } from "./prueba-casos";
import { estadoCierre, resolverNivel } from "./resolver";
import { perimetro, superficie } from "./superficie";

const largos = (n: Nivel, amb = "amb1") => ladosDeAmbiente(n, amb).map((l) => l.largo);

describe("resolver: las medidas mandan", () => {
  it("clasifica el cierre por su error", () => {
    expect(estadoCierre(0.4)).toBe("cerrado");
    expect(estadoCierre(2)).toBe("ajustado");
    expect(estadoCierre(2.1)).toBe("abierto");
  });

  it("el cuarto dibujado a ojo toma sus medidas de láser", () => {
    const { nivel, cierres } = resolverNivel(cuartoDeBruno({ aOjo: true, medido: true }));
    expect(superficie(nivel, "amb1")).toBe(18.468);
    expect(perimetro(nivel, "amb1")).toBe(1722);
    expect(cierres).toEqual([expect.objectContaining({ ambienteId: "amb1", medido: true, estado: "cerrado", error: 0 })]);
  });

  it("con un solo lado medido, el lado dibujado de enfrente absorbe la diferencia (ajuste 3)", () => {
    const { nivel, cierres } = resolverNivel(medirLado(cuartoDeBruno({ aOjo: true }), "amb1", "m1", 405));
    largos(nivel).forEach((l, i) => expect(l).toBeCloseTo([405, 450, 405, 450][i], 1));
    expect(ladosDeAmbiente(nivel, "amb1")[2].medida).toEqual(medida(405, false));
    expect(cierres[0].estado).toBe("cerrado");
  });

  it("cierre abierto: 445 en vez de 456 deja 11 cm sin cerrar y no mueve nada", () => {
    const original = medirLado(cuartoDeBruno({ medido: true }), "amb1", "m2", 445);
    const { nivel, cierres } = resolverNivel(original);
    expect(cierres[0].error).toBe(11);
    expect(cierres[0].estado).toBe("abierto");
    expect(nivel.nodos).toEqual(original.nodos);
  });

  it("compensación: 2 cm se reparten en la geometría sin tocar las medidas cargadas", () => {
    const { nivel, cierres } = resolverNivel(medirLado(cuartoDeBruno({ medido: true }), "amb1", "m2", 458));
    expect(cierres[0].error).toBe(2);
    expect(cierres[0].estado).toBe("ajustado");
    largos(nivel).forEach((l, i) => expect(l).toBeCloseTo([405, 457, 405, 457][i], 1));
    expect(ladosDeAmbiente(nivel, "amb1").map((l) => l.medida)).toEqual([
      medida(405, true),
      medida(456, true),
      medida(405, true),
      medida(458, true),
    ]);
  });

  it("resolver dos veces da el mismo plano", () => {
    const una = resolverNivel(medirLado(cuartoDeBruno({ aOjo: true, medido: true }), "amb1", "m2", 458)).nivel;
    const dos = resolverNivel(una);
    expect(dos.nivel.nodos).toEqual(una.nodos);
    expect(dos.cierres[0].error).toBe(2);
  });

  it("la casa dibujada a ojo se resuelve ambiente por ambiente hasta las posiciones exactas", () => {
    const exacta = casaDeEjemplo();
    const { nivel, cierres } = resolverNivel(casaDeEjemplo({ medida: true, aOjo: true }));
    expect(cierres.map((c) => c.estado)).toEqual(["cerrado", "cerrado", "cerrado"]);
    const a = nivel.nodos[0];
    const ea = exacta.nodos[0];
    nivel.nodos.forEach((n, i) => {
      expect(n.x - a.x).toBeCloseTo(exacta.nodos[i].x - ea.x, 1);
      expect(n.y - a.y).toBeCloseTo(exacta.nodos[i].y - ea.y, 1);
    });
    expect(nivel.ambientes.map((amb) => superficie(nivel, amb.id))).toEqual([12, 4.75, 2.66]);
  });

  it("un pasillo que contradice lo ya resuelto marca el error en el pasillo y no mueve lo anterior", () => {
    const bien = resolverNivel(casaDeEjemplo({ medida: true, aOjo: true })).nivel;
    const casa = casaDeEjemplo({ medida: true, aOjo: true });
    const pasillo = casa.ambientes[2].id;
    const { nivel, cierres } = resolverNivel(medirLado(casa, pasillo, "m10", 195));
    expect(cierres.map((c) => c.estado)).toEqual(["cerrado", "cerrado", "abierto"]);
    expect(cierres[2].error).toBe(5);
    for (const id of ["n1", "n2", "n3", "n4", "n6", "n7", "n8"]) {
      expect(nivel.nodos.find((n) => n.id === id)).toEqual(bien.nodos.find((n) => n.id === id));
    }
  });
});
