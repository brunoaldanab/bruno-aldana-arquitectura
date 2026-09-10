// src/lib/relevamiento/sincronizacion.test.ts
import { describe, expect, it } from "vitest";
import { crearRelevamientoVacio } from "./formato";
import { decidirAlAbrir, type CopiaLocal, type CopiaRemota } from "./sincronizacion";

const data = crearRelevamientoVacio({ contactoId: "c1", nombre: "Bruno", direccion: "", ambientes: [], fecha: "2026-09-10" });
const local = (versionBase: number, pendiente: boolean): CopiaLocal => ({ data, versionBase, pendiente, guardadoEn: "2026-09-10T10:00:00Z" });
const remoto = (version: number): CopiaRemota => ({ data, version });

describe("decidirAlAbrir", () => {
  it("sin copia en ningún lado, se crea", () => {
    expect(decidirAlAbrir(null, null)).toEqual({ accion: "crear" });
  });
  it("si solo el servidor tiene copia, se usa la del servidor", () => {
    expect(decidirAlAbrir(null, remoto(3))).toEqual({ accion: "usar-remoto" });
  });
  it("si solo el teléfono tiene cambios, se suben", () => {
    expect(decidirAlAbrir(local(0, true), null)).toEqual({ accion: "subir-local" });
  });
  it("sin cambios en el teléfono y el servidor más nuevo, se usa el servidor", () => {
    expect(decidirAlAbrir(local(2, false), remoto(3))).toEqual({ accion: "usar-remoto" });
  });
  it("sin cambios y misma versión, no hay nada que hacer", () => {
    expect(decidirAlAbrir(local(3, false), remoto(3))).toEqual({ accion: "nada" });
  });
  it("con cambios sobre la misma versión, se suben", () => {
    expect(decidirAlAbrir(local(3, true), remoto(3))).toEqual({ accion: "subir-local" });
  });
  it("con cambios y el servidor más nuevo, gana el teléfono y se avisa", () => {
    expect(decidirAlAbrir(local(2, true), remoto(3))).toEqual({ accion: "conflicto-gana-local" });
  });
});
