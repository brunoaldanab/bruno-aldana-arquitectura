// src/lib/visita/relevamientos.test.ts
import { describe, expect, it } from "vitest";
import { relevamientoVacio } from "@/lib/plano/modelo";
import { compactarCola, type ContactoVisita, type Operacion } from "./contactos";
import { fusionarRelevamientos, type RelevamientoLocal } from "./relevamientos";
import { hayConflicto, ordenarOperaciones, relevamientosV2 } from "./servidor";

const contacto = (id: string): ContactoVisita => ({
  id, nombre: `Cliente ${id}`, telefono: null, email: null, direccionProyecto: null, notas: null, origen: null,
  createdAt: "2026-09-11T10:00:00.000Z", updatedAt: "2026-09-11T10:00:00.000Z",
});
const datos = (nombre = "Cuarto") => relevamientoVacio({ contactoId: "a", nombre, direccion: "", fechaRelevamiento: "2026-09-11" });
const opC = (id: string): Operacion => ({ tipo: "contacto", contacto: contacto(id) });
const opR = (id: string, nombre = "Cuarto"): Operacion => ({ tipo: "relevamiento", contactoId: id, data: datos(nombre), versionBase: 0 });
const local = (id: string, pendiente: boolean, versionBase = 1, nombre = "Local"): RelevamientoLocal => ({
  contactoId: id, data: datos(nombre), versionBase, pendiente, guardadoEn: "x",
});

describe("cola con relevamientos", () => {
  it("compacta por tipo e id: el contacto y el relevamiento del mismo cliente no se pisan", () => {
    const r1 = opR("a", "Primero");
    const c = opC("a");
    const r2 = opR("a", "Segundo");
    expect(compactarCola([r1, c, r2])).toEqual([c, r2]);
  });

  it("el servidor procesa primero los contactos", () => {
    const r = opR("a");
    const c1 = opC("a");
    const c2 = opC("b");
    expect(ordenarOperaciones([r, c1, c2])).toEqual([c1, c2, r]);
  });
});

describe("conflictos y formato", () => {
  it("hay conflicto solo si el servidor tenía una versión más nueva", () => {
    expect(hayConflicto(null, 0)).toBe(false);
    expect(hayConflicto(3, 2)).toBe(true);
    expect(hayConflicto(2, 2)).toBe(false);
  });

  it("baja solo lo que valida como formato 2", () => {
    const filas = [
      { contactoId: "a", data: datos(), version: 2 },
      { contactoId: "b", data: { formato: "ba-relevamiento", version: 1, ambientes: [] }, version: 5 },
      { contactoId: "c", data: "roto", version: 1 },
    ];
    expect(relevamientosV2(filas)).toEqual([{ contactoId: "a", data: datos(), version: 2 }]);
  });
});

describe("fusionarRelevamientos", () => {
  it("lo que baja reemplaza lo local sin cambios y avisa qué cambió", () => {
    const r = fusionarRelevamientos([local("a", false, 1)], [{ contactoId: "a", data: datos("Remoto"), version: 2 }], "ahora");
    expect(r.lista[0]).toEqual({ contactoId: "a", data: datos("Remoto"), versionBase: 2, pendiente: false, guardadoEn: "ahora" });
    expect(r.cambiados).toEqual(["a"]);
  });

  it("no pisa un relevamiento con cambios sin subir ni uno igual o más nuevo", () => {
    const r = fusionarRelevamientos(
      [local("a", true, 1), local("b", false, 3)],
      [{ contactoId: "a", data: datos("Remoto"), version: 2 }, { contactoId: "b", data: datos("Remoto"), version: 3 }],
      "ahora",
    );
    expect(r.lista.map((x) => x.data.proyecto.nombre)).toEqual(["Local", "Local"]);
    expect(r.cambiados).toEqual([]);
  });
});
