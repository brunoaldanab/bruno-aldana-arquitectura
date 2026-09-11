// src/lib/destino.test.ts
import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./destino";

describe("destinoSeguro", () => {
  it("acepta rutas internas, con sus parámetros", () => {
    expect(destinoSeguro("/visita")).toBe("/visita");
    expect(destinoSeguro("/visita?contacto=abc")).toBe("/visita?contacto=abc");
  });

  it("nunca manda a otro sitio", () => {
    expect(destinoSeguro("https://otro.com")).toBe("/");
    expect(destinoSeguro("//otro.com")).toBe("/");
    expect(destinoSeguro("/\\otro.com")).toBe("/");
  });

  it("sin valor usable, vuelve al inicio", () => {
    expect(destinoSeguro(undefined)).toBe("/");
    expect(destinoSeguro("")).toBe("/");
    expect(destinoSeguro(42)).toBe("/");
  });
});
