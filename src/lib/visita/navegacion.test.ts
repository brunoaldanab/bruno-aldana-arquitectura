// src/lib/visita/navegacion.test.ts
import { describe, expect, it } from "vitest";
import { leerRuta, rutaAUrl, type Ruta } from "./navegacion";

describe("navegación de la visita", () => {
  it("lee la vista desde la dirección", () => {
    expect(leerRuta("")).toEqual({ vista: "contactos" });
    expect(leerRuta("?vista=nuevo")).toEqual({ vista: "nuevo" });
    expect(leerRuta("?contacto=abc")).toEqual({ vista: "contacto", id: "abc" });
    expect(leerRuta("?contacto=abc&vista=editar")).toEqual({ vista: "editar", id: "abc" });
    expect(leerRuta("?vista=editar")).toEqual({ vista: "contactos" });
  });

  it("arma la dirección de cada vista", () => {
    expect(rutaAUrl({ vista: "contactos" })).toBe("/visita");
    expect(rutaAUrl({ vista: "nuevo" })).toBe("/visita?vista=nuevo");
    expect(rutaAUrl({ vista: "contacto", id: "a b" })).toBe("/visita?contacto=a%20b");
    expect(rutaAUrl({ vista: "editar", id: "abc" })).toBe("/visita?contacto=abc&vista=editar");
  });

  it("ida y vuelta sin perder nada", () => {
    expect(rutaAUrl({ vista: "relevamiento", id: "abc" })).toBe("/visita?contacto=abc&vista=relevamiento");
    const rutas: Ruta[] = [
      { vista: "contactos" }, { vista: "nuevo" }, { vista: "contacto", id: "x-1" }, { vista: "editar", id: "x-1" }, { vista: "relevamiento", id: "x-1" },
    ];
    for (const r of rutas) expect(leerRuta(rutaAUrl(r).replace("/visita", ""))).toEqual(r);
  });
});
