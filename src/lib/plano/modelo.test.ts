import { describe, expect, it } from "vitest";
import {
  medida,
  nivelSchema,
  nivelVacio,
  relevamientoSchema,
  relevamientoVacio,
  siguienteCodigo,
  siguienteId,
  siguienteIdNivel,
} from "./modelo";

const proyecto = {
  contactoId: "c1",
  nombre: "Cuarto Bruno",
  direccion: "Santa Cruz",
  fechaRelevamiento: "2026-09-10",
};

describe("modelo", () => {
  it("una medida se redondea a centímetros enteros y nace dibujada", () => {
    expect(medida(262.6)).toEqual({ valor: 263, tomada: false });
    expect(medida(405, true)).toEqual({ valor: 405, tomada: true });
  });

  it("el relevamiento vacío valida y arranca con nivel-1", () => {
    const r = relevamientoVacio(proyecto);
    expect(relevamientoSchema.safeParse(r).success).toBe(true);
    expect(r.niveles.map((n) => n.id)).toEqual(["nivel-1"]);
    expect(siguienteIdNivel(r)).toBe("nivel-2");
  });

  it("rechaza medidas con decimales y la versión 1", () => {
    const r = relevamientoVacio(proyecto);
    const conDecimal = structuredClone(r);
    conDecimal.niveles[0].alturaGeneral.valor = 12.5;
    expect(relevamientoSchema.safeParse(conDecimal).success).toBe(false);
    expect(relevamientoSchema.safeParse({ ...r, version: 1 }).success).toBe(false);
  });

  it("rechaza un muro que apunta a un nodo inexistente o ids repetidos", () => {
    const n = nivelVacio("nivel-1", "Planta baja");
    n.nodos.push({ id: "n1", x: 0, y: 0 });
    n.muros.push({
      id: "m1",
      desde: "n1",
      hasta: "n9",
      espesor: medida(15),
      altura: null,
      caras: { izquierda: null, derecha: null },
    });
    expect(nivelSchema.safeParse(n).success).toBe(false);
    n.nodos.push({ id: "n9", x: 100, y: 0 });
    expect(nivelSchema.safeParse(n).success).toBe(true);
    n.nodos.push({ id: "n1", x: 5, y: 5 });
    expect(nivelSchema.safeParse(n).success).toBe(false);
  });

  it("los ids siguen al número mayor de su prefijo, sin confundir prefijos", () => {
    expect(siguienteId(["m1", "m3", "mol7"], "m")).toBe("m4");
    expect(siguienteId([], "amb")).toBe("amb1");
    expect(siguienteCodigo(["P1", "V1", "P2"], "puerta")).toBe("P3");
    expect(siguienteCodigo(["P1"], "ventana")).toBe("V1");
    expect(siguienteCodigo([], "vano")).toBe("A1");
  });
});
