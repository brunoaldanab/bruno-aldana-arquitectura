// src/lib/visita/contactos.test.ts
import { describe, expect, it } from "vitest";
import { compactarCola, fusionarContactos, leerFormularioContacto, type ContactoLocal, type ContactoVisita } from "./contactos";
import { aContactoVisita } from "./servidor";

const contacto = (id: string, extra: Partial<ContactoVisita> = {}): ContactoVisita => ({
  id, nombre: `Cliente ${id}`, telefono: null, email: null, direccionProyecto: null, notas: null, origen: null,
  createdAt: "2026-09-01T10:00:00.000Z", updatedAt: "2026-09-01T10:00:00.000Z", ...extra,
});
const local = (id: string, pendiente: boolean, extra: Partial<ContactoVisita> = {}): ContactoLocal => ({ ...contacto(id, extra), pendiente });
const campos = { nombre: "Mara Castellón", telefono: " 77658864 ", email: "", direccionProyecto: "", notas: "", origen: "Instagram" };

describe("leerFormularioContacto", () => {
  it("recorta espacios y deja en null lo vacío", () => {
    const r = leerFormularioContacto(campos, { id: "c1", createdAt: "2026-09-10T12:00:00.000Z" }, "2026-09-10T12:00:00.000Z");
    expect(r).toEqual({ ok: true, contacto: { ...contacto("c1"), nombre: "Mara Castellón", telefono: "77658864", origen: "Instagram", createdAt: "2026-09-10T12:00:00.000Z", updatedAt: "2026-09-10T12:00:00.000Z" } });
  });

  it("sin nombre no se guarda", () => {
    expect(leerFormularioContacto({ ...campos, nombre: "  " }, { id: "c1", createdAt: "x" }, "x")).toEqual({ ok: false, error: "El nombre es obligatorio." });
  });

  it("un email mal escrito no se guarda", () => {
    expect(leerFormularioContacto({ ...campos, email: "mara@" }, { id: "c1", createdAt: "x" }, "x")).toEqual({ ok: false, error: "Email inválido." });
  });
});

describe("fusionarContactos", () => {
  it("lo que baja del servidor reemplaza a lo local sin cambios", () => {
    const r = fusionarContactos([local("a", false)], [contacto("a", { nombre: "Nuevo nombre" })]);
    expect(r).toEqual([{ ...contacto("a", { nombre: "Nuevo nombre" }), pendiente: false }]);
  });

  it("un contacto con cambios sin subir no se pisa", () => {
    const r = fusionarContactos([local("a", true, { nombre: "Cambiado en obra" })], [contacto("a", { nombre: "Del servidor" })]);
    expect(r[0].nombre).toBe("Cambiado en obra");
    expect(r[0].pendiente).toBe(true);
  });

  it("suma los nuevos y ordena del más nuevo al más viejo", () => {
    const r = fusionarContactos(
      [local("viejo", false, { createdAt: "2026-08-01T00:00:00.000Z" })],
      [contacto("nuevo", { createdAt: "2026-09-05T00:00:00.000Z" })],
    );
    expect(r.map((c) => c.id)).toEqual(["nuevo", "viejo"]);
  });
});

describe("compactarCola", () => {
  it("de cada contacto sube solo la última versión, en el orden de su último cambio", () => {
    const a1 = { tipo: "contacto" as const, contacto: contacto("a", { nombre: "A1" }) };
    const b1 = { tipo: "contacto" as const, contacto: contacto("b") };
    const a2 = { tipo: "contacto" as const, contacto: contacto("a", { nombre: "A2" }) };
    expect(compactarCola([a1, b1, a2])).toEqual([b1, a2]);
  });
});

describe("aContactoVisita", () => {
  it("pasa las fechas de la base a texto ISO", () => {
    const fila = { ...contacto("a"), createdAt: new Date("2026-09-01T10:00:00.000Z"), updatedAt: new Date("2026-09-02T10:00:00.000Z") };
    expect(aContactoVisita(fila)).toEqual(contacto("a", { updatedAt: "2026-09-02T10:00:00.000Z" }));
  });
});
