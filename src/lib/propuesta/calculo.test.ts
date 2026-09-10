import { describe, expect, it } from "vitest";
import {
  desglosePorAmbiente,
  sumaDesglose,
  fechaVencimiento,
  formatearBs,
  formatearFecha,
  parsearM2,
  plazoDiasHabiles,
  precioDiseno,
  reparto,
} from "./calculo";

describe("precioDiseno", () => {
  it("cobra la tarifa por metro cuadrado", () => {
    expect(precioDiseno(150)).toBe(9000);
  });

  it("cobra lo mismo por metro aunque el ambiente sea muy chico", () => {
    expect(precioDiseno(4)).toBe(240);
  });

  it("da 4.200 Bs en el proyecto promedio de 70 m²", () => {
    expect(precioDiseno(70)).toBe(4200);
  });

  /* El mismo número que muestra la calculadora de la landing. Que los dos den
     igual es la razón por la que se sacó el piso por ambiente: un precio
     publicado que después sube rompe la confianza que la página quiere comprar. */
  it("coincide con la calculadora de la landing en 77 m²", () => {
    expect(precioDiseno(77)).toBe(4620);
  });
});

describe("plazoDiasHabiles", () => {
  it("da 7 días para 70 m², que es el dato real del estudio", () => {
    expect(plazoDiasHabiles(70)).toBe(7);
  });

  it("nunca baja del mínimo de 5 días", () => {
    expect(plazoDiasHabiles(38)).toBe(5);
  });

  it("escala en proyectos grandes", () => {
    expect(plazoDiasHabiles(150)).toBe(15);
  });
});

describe("reparto", () => {
  it("parte 30/70", () => {
    expect(reparto(4620)).toEqual({ anticipo: 1386, saldo: 3234 });
  });

  it("las dos partes siempre suman el precio, aunque haya redondeo", () => {
    const precio = 2351;
    const { anticipo, saldo } = reparto(precio);
    expect(anticipo + saldo).toBe(precio);
  });
});

describe("parsearM2", () => {
  it("lee un número suelto", () => {
    expect(parsearM2("77")).toBe(77);
  });

  it("ignora la unidad escrita a mano", () => {
    expect(parsearM2("77 m2")).toBe(77);
  });

  it("acepta la coma decimal", () => {
    expect(parsearM2("77,5")).toBe(77.5);
  });

  it("devuelve null con el campo vacío", () => {
    expect(parsearM2("")).toBeNull();
  });

  it("devuelve null si no hay ningún número", () => {
    expect(parsearM2("por definir")).toBeNull();
  });
});

describe("formatearBs", () => {
  it("usa el punto como separador de miles", () => {
    expect(formatearBs(4620)).toBe("Bs 4.620");
  });

  it("no pone separador abajo de mil", () => {
    expect(formatearBs(240)).toBe("Bs 240");
  });
});

describe("fechas", () => {
  it("vence a los 10 días corridos, cruzando el fin de mes", () => {
    expect(formatearFecha(fechaVencimiento(new Date(2026, 7, 28)))).toBe("07/09/2026");
  });

  it("formatea en día/mes/año", () => {
    expect(formatearFecha(new Date(2026, 0, 5))).toBe("05/01/2026");
  });
});

describe("desglosePorAmbiente", () => {
  const ambientes = ["Baño", "Cocina", "Dormitorio", "Living"];
  const superficies = { "Baño": "4", Cocina: "9", Dormitorio: "12", Living: "25" };

  it("cobra cada ambiente por su superficie, sin pisos", () => {
    const lineas = desglosePorAmbiente(ambientes, superficies);
    expect(lineas?.map((l) => l.cobra)).toEqual([240, 540, 720, 1500]);
  });

  it("suma 3.000 en el caso de los cuatro ambientes", () => {
    expect(sumaDesglose(desglosePorAmbiente(ambientes, superficies)!)).toBe(3000);
  });

  /* Lo mismo que daría cobrar el total de una: el desglose muestra de dónde sale
     el número, no cambia el número. */
  it("suma igual que cobrar el total de corrido", () => {
    const lineas = desglosePorAmbiente(ambientes, superficies)!;
    const metros = lineas.reduce((total, l) => total + l.m2, 0);
    expect(sumaDesglose(lineas)).toBe(precioDiseno(metros));
  });

  it("cobra todo por superficie cuando ningún ambiente es chico", () => {
    const lineas = desglosePorAmbiente(["Living", "Cocina"], { Living: "40", Cocina: "30" });
    expect(sumaDesglose(lineas!)).toBe(4200);
  });

  it("devuelve null si falta la superficie de un solo ambiente", () => {
    expect(desglosePorAmbiente(ambientes, { "Baño": "4", Cocina: "9", Dormitorio: "12" })).toBeNull();
  });

  it("devuelve null si todavía no se eligieron ambientes", () => {
    expect(desglosePorAmbiente([], {})).toBeNull();
  });
});
