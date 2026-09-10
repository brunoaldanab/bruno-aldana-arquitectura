// src/lib/relevamiento/controles.test.ts
import { describe, expect, it } from "vitest";
import { crearAmbiente, type Ambiente, type Elemento } from "./formato";
import { formaAParedes } from "./geometria";
import { controlarAmbiente, datosFaltantes } from "./controles";

function cuarto(): Ambiente {
  const a = crearAmbiente("amb-1", "Dormitorio");
  a.paredes = formaAParedes("rectangulo", { ancho: 405, largo: 456 });
  a.alturas = a.alturas.map((h) => ({ ...h, medida: 263 }));
  a.diagonales = [{ desdeVertice: 0, hastaVertice: 2, medida: 610 }];
  return a;
}

const puerta = (extra: Partial<Elemento> = {}): Elemento => ({
  id: "e1", codigo: "P1", tipo: "puerta", pared: "pared-4",
  desde: 60, hasta: 150, alto: 210, espesorMuro: 15,
  apertura: "corrediza", ...extra,
});

const niveles = (a: Ambiente) => controlarAmbiente(a).map((h) => h.nivel);
const mensajes = (a: Ambiente) => controlarAmbiente(a).map((h) => h.mensaje).join(" | ");

describe("control de cierre", () => {
  it("el cuarto completo da un solo ok", () => {
    const a = cuarto();
    a.elementos = [puerta()];
    expect(controlarAmbiente(a)).toEqual([{ nivel: "ok", ambienteId: "amb-1", mensaje: "Todo cierra" }]);
  });

  it("un ambiente sin paredes es un error", () => {
    expect(niveles(crearAmbiente("amb-1", "Baño"))).toContain("error");
  });

  it("una pared sin medir es un error que dice cuál", () => {
    const a = cuarto();
    a.paredes[1] = { ...a.paredes[1], largo: null };
    expect(mensajes(a)).toContain("Pared 2 sin medir");
  });

  it("un recorrido que no cierra por 11 cm es un error con la cifra", () => {
    const a = cuarto();
    a.paredes[3] = { ...a.paredes[3], largo: 445 };
    expect(mensajes(a)).toContain("11 cm");
  });

  it("la altura en un solo punto es un aviso; sin ninguna, un error", () => {
    const a = cuarto();
    a.alturas = [{ punto: "centro", medida: 263 }, { punto: "puerta", medida: null }, { punto: "opuesta", medida: null }];
    expect(niveles(a)).toEqual(["aviso"]);
    a.alturas = a.alturas.map((h) => ({ ...h, medida: null }));
    expect(niveles(a)).toContain("error");
  });

  it("una diagonal que difiere de la calculada es un aviso", () => {
    const a = cuarto();
    a.diagonales = [{ desdeVertice: 0, hastaVertice: 2, medida: 598 }];
    expect(mensajes(a)).toContain("no está a escuadra");
  });

  it("sin diagonales es un aviso", () => {
    const a = cuarto();
    a.diagonales = [];
    expect(niveles(a)).toEqual(["aviso"]);
  });

  it("una ventana sin antepecho es un error que nombra el dato", () => {
    const a = cuarto();
    a.elementos = [puerta({ codigo: "V1", tipo: "ventana" })];
    expect(mensajes(a)).toContain("V1: falta antepecho");
  });

  it("una abertura que se sale de la pared es un error", () => {
    const a = cuarto();
    a.elementos = [puerta({ desde: 400, hasta: 480 })];
    expect(mensajes(a)).toContain("P1 termina en 480 pero la pared mide 456");
  });

  it("dos aberturas que se pisan en la misma pared son un error", () => {
    const a = cuarto();
    a.elementos = [puerta(), puerta({ id: "e2", codigo: "V1", tipo: "ventana", desde: 120, hasta: 250, antepecho: 90 })];
    expect(mensajes(a)).toContain("P1 y V1 se pisan");
  });

  it("una puerta batiente exige hacia dónde abre y de qué lado va la bisagra", () => {
    expect(datosFaltantes(puerta({ apertura: "batiente" }))).toEqual(["hacia dónde abre", "bisagra"]);
  });
});
