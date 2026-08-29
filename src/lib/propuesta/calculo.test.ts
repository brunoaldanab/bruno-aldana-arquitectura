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
  it("cobra por superficie cuando los m² mandan", () => {
    expect(precioDiseno(150, 6)).toBe(9000);
  });

  it("cobra el mínimo por ambiente cuando son varios ambientes chicos", () => {
    expect(precioDiseno(35, 4)).toBe(4000);
  });

  it("aplica el mínimo a un solo ambiente chico", () => {
    expect(precioDiseno(4, 1)).toBe(1000);
  });

  it("toma el mayor de los dos en la oficina de 77 m² con 5 ambientes", () => {
    expect(precioDiseno(77, 5)).toBe(5000);
  });

  it("funciona aunque todavía no se hayan elegido ambientes", () => {
    expect(precioDiseno(70, 0)).toBe(4200);
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

  it("cobra el piso en los chicos y por superficie en los grandes", () => {
    const lineas = desglosePorAmbiente(ambientes, superficies);
    expect(lineas?.map((l) => l.cobra)).toEqual([1000, 1000, 1000, 1500]);
  });

  it("marca cuáles no llegaron al mínimo", () => {
    const lineas = desglosePorAmbiente(ambientes, superficies);
    expect(lineas?.map((l) => l.minimoAplicado)).toEqual([true, true, true, false]);
  });

  it("suma 4.500 en el caso de los cuatro ambientes", () => {
    expect(sumaDesglose(desglosePorAmbiente(ambientes, superficies)!)).toBe(4500);
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
