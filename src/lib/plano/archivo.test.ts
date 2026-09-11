import { describe, expect, it } from "vitest";
import { aJson, calcularGeometria, conCalculado, leerArchivo, nombreArchivo } from "./archivo";
import { agregarAbertura } from "./elementos";
import { relevamientoSchema, relevamientoVacio } from "./modelo";
import { cuartoDeBruno } from "./prueba-casos";
import { puntoEnPoligono } from "./superficie";

function relevamientoDelCuarto() {
  const r = relevamientoVacio({ contactoId: "c1", nombre: "Cuarto Bruno", direccion: "Santa Cruz", fechaRelevamiento: "2026-09-10" });
  let n = cuartoDeBruno({ medido: true });
  n = agregarAbertura(n, { tipo: "puerta", muroId: "m3", cara: "derecha", desde: 60, ancho: 90, alto: 210 }).nivel;
  n = agregarAbertura(n, { tipo: "ventana", muroId: "m1", cara: "derecha", desde: 130, ancho: 150, alto: 120, antepecho: 90 }).nivel;
  r.niveles = [n];
  return r;
}

describe("archivo para Revit", () => {
  it("lleva la geometría resuelta que lee el botón de pyRevit", () => {
    const [nivel] = calcularGeometria(relevamientoDelCuarto()).niveles;
    expect(nivel.muros.find((m) => m.id === "m1")).toEqual({ id: "m1", inicio: { x: -7.5, y: -7.5 }, fin: { x: 412.5, y: -7.5 }, largo: 420 });
    const [cuarto] = nivel.ambientes;
    expect(cuarto).toMatchObject({ id: "amb1", superficie: 18.468, perimetro: 1722 });
    expect(cuarto.contorno).toHaveLength(4);
    expect(puntoEnPoligono(cuarto.puntoInterior, cuarto.contorno)).toBe(true);
    expect(nivel.aberturas).toEqual([
      { id: "a1", centro: { x: 300, y: 463.5 }, hastaEsquina: 255 },
      { id: "a2", centro: { x: 205, y: -7.5 }, hastaEsquina: 125 },
    ]);
    // Puerta: desde, ancho y alto. Ventana: los mismos más el antepecho.
    expect(nivel.controles.filter((c) => c.tipo === "pendiente")).toHaveLength(7);
  });

  it("lo que se escribe se vuelve a leer igual", () => {
    const r = relevamientoDelCuarto();
    const texto = aJson(r);
    expect(relevamientoSchema.safeParse(JSON.parse(texto)).success).toBe(true);
    const leido = leerArchivo(texto);
    expect(leido).toEqual({ ok: true, relevamiento: conCalculado(r) });
  });

  it("distingue un archivo del formato anterior, un texto roto y un archivo inválido", () => {
    const viejo = JSON.stringify({ formato: "ba-relevamiento", version: 1, ambientes: [] });
    expect(leerArchivo(viejo)).toMatchObject({ ok: false, motivo: "version-anterior" });
    expect(leerArchivo("{roto")).toMatchObject({ ok: false, motivo: "json" });
    expect(leerArchivo(JSON.stringify({ formato: "otro" }))).toMatchObject({ ok: false, motivo: "invalido" });
  });

  it("se nombra con el cliente y la fecha", () => {
    expect(nombreArchivo(relevamientoDelCuarto())).toBe("relevamiento-cuarto-bruno-2026-09-10.json");
  });
});
