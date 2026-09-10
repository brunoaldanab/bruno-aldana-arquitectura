// src/lib/relevamiento/formato.test.ts
import { describe, expect, it } from "vitest";
import { crearRelevamientoVacio, relevamientoSchema } from "./formato";

const base = { contactoId: "c1", nombre: "Bruno", direccion: "Urubó", ambientes: ["Dormitorio", "Baño"], fecha: "2026-09-10" };

describe("formato ba-relevamiento", () => {
  it("un relevamiento vacío es válido y trae un ambiente por nombre", () => {
    const r = crearRelevamientoVacio(base);
    expect(relevamientoSchema.parse(r)).toEqual(r);
    expect(r.formato).toBe("ba-relevamiento");
    expect(r.niveles).toHaveLength(1);
    expect(r.niveles[0].ambientes.map((a) => a.nombre)).toEqual(["Dormitorio", "Baño"]);
  });

  it("sin ambientes de la entrevista, arranca con uno llamado Ambiente 1", () => {
    const r = crearRelevamientoVacio({ ...base, ambientes: [] });
    expect(r.niveles[0].ambientes.map((a) => a.nombre)).toEqual(["Ambiente 1"]);
  });

  it("rechaza medidas con decimales: todo va en centímetros enteros", () => {
    const r = crearRelevamientoVacio(base);
    r.niveles[0].ambientes[0].paredes.push({ id: "p1", largo: 405.5, giro: "D" });
    expect(relevamientoSchema.safeParse(r).success).toBe(false);
  });

  it("rechaza un archivo que no es ba-relevamiento", () => {
    const r = { ...crearRelevamientoVacio(base), formato: "otro" };
    expect(relevamientoSchema.safeParse(r).success).toBe(false);
  });
});
