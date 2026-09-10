import { describe, expect, it } from "vitest";
import { armarPropuesta } from "./datos";
import { createInitialEntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";

const galeria: GaleriaData = {
  estiloFotos: [{ id: "f1", cardKey: "industrial", dataUrl: "data:image/jpeg;base64,AAA", orden: 0 }],
  estiloCustom: [],
  mobiliarioFotos: [],
  mobiliarioCustom: [],
  paletaOficinaFotos: [],
  paletaOficinaCustom: [],
};

function entradaBase() {
  const state = createInitialEntrevistaState();
  state.proyecto.tipoProyecto = "oficina";
  state.proyecto.m2 = "77";
  state.ambientesSeleccion = ["Recepción", "Sala de reuniones", "Área de trabajo", "Cocina", "Baño"];
  state.cierre.palabra = "ordenado";
  state.cierre.evitar = "los ambientes fríos de oficina";
  // El paso de materiales guarda el nombre visible, no una clave interna.
  state.materiales.seleccion = ["Madera clara", "Metal negro mate"];
  return { nombreCliente: "Estudio Vega", state, galeria, emision: new Date(2026, 7, 28) };
}

describe("armarPropuesta", () => {
  it("avisa cuando falta la superficie en vez de inventar un precio", () => {
    const entrada = entradaBase();
    entrada.state.proyecto.m2 = "";
    expect(armarPropuesta(entrada)).toEqual({ falta: "m2" });
  });

  it("calcula el precio con la tarifa única por metro cuadrado", () => {
    const p = armarPropuesta(entradaBase());
    expect("falta" in p).toBe(false);
    if ("falta" in p) return;
    expect(p.precio).toBe(4620);
    expect(p.precioTexto).toBe("Bs 4.620");
  });

  it("reparte el pago en 30 y 70", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.anticipoTexto).toBe("Bs 1.386");
    expect(p.saldoTexto).toBe("Bs 3.234");
  });

  it("pone la fecha de vencimiento a diez días", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.venceTexto).toBe("07/09/2026");
  });

  it("calcula el plazo según la superficie", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.plazoDias).toBe(8);
  });

  it("titula el proyecto según su tipo", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.titulo).toBe("Diseño integral de oficina");
  });

  it("arrastra lo que dijo el cliente en la entrevista", () => {
    const p = armarPropuesta(entradaBase());
    if ("falta" in p) throw new Error("no debería faltar nada");
    expect(p.palabra).toBe("ordenado");
    expect(p.evitar).toBe("los ambientes fríos de oficina");
    expect(p.ambientes).toHaveLength(5);
    expect(p.materiales).toEqual(["Madera clara", "Metal negro mate"]);
  });
});
