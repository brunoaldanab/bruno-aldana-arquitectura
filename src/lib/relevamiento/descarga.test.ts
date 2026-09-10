// src/lib/relevamiento/descarga.test.ts
import { describe, expect, it } from "vitest";
import { nombreDeArchivo } from "./descarga";

describe("nombreDeArchivo", () => {
  it("usa el nombre del contacto sin tildes ni espacios", () => {
    expect(nombreDeArchivo("Mara Castellón", "2026-09-10")).toBe("relevamiento-mara-castellon-2026-09-10.json");
  });

  it("sin un nombre usable, no deja un archivo que empiece con guion", () => {
    expect(nombreDeArchivo("  ¡!  ", "2026-09-10")).toBe("relevamiento-sin-nombre-2026-09-10.json");
  });
});
