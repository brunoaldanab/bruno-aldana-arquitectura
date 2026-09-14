import { describe, expect, it } from "vitest";
import { cotasDeElectricos } from "./cotas";
import {
  agregarPuntoElectrico,
  colocarPuntoElectrico,
  editarPuntoElectrico,
  tipoDe,
  TIPOS,
} from "./electricos";
import { cargarMedidaElemento } from "./elementos";
import { revisarNivel } from "./controles";
import { cuartoDeBruno } from "./prueba-casos";

const cuarto = () => cuartoDeBruno({ medido: true });

describe("puntos eléctricos", () => {
  it("cada tipo tiene una altura de la norma y una clave única", () => {
    const claves = TIPOS.map((t) => t.clave);
    expect(new Set(claves).size).toBe(claves.length);
    expect(tipoDe("int-simple").altura).toBe(125);
    expect(tipoDe("toma-doble").altura).toBe(30);
    expect(tipoDe("toma-mesada").altura).toBe(120);
    expect(tipoDe("fuerza-cocina").altura).toBe(150);
  });

  it("un toque sobre la pared deja el enchufe con su altura y su código", () => {
    const r = colocarPuntoElectrico(cuarto(), "toma-doble", { x: 200, y: 460 }, 10)!;
    const e = r.nivel.electricos[0];
    expect(r.codigo).toBe("T1");
    expect(e.altura).toEqual({ valor: 30, tomada: false });
    expect(e.desde.tomada).toBe(false);
    // Lejos de todo muro no coloca nada.
    expect(colocarPuntoElectrico(cuarto(), "toma-doble", { x: 200, y: 200 }, 10)).toBeNull();
  });

  it("cambiar de familia cambia la letra del código y la altura mientras no esté medida", () => {
    const r = colocarPuntoElectrico(cuarto(), "toma-doble", { x: 200, y: 460 }, 10)!;
    const n = editarPuntoElectrico(r.nivel, r.id, { tipo: "int-doble" });
    expect(n.electricos[0].codigo).toBe("L1");
    expect(n.electricos[0].altura.valor).toBe(125);

    // Una altura ya medida no se pisa al cambiar de tipo.
    const medido = cargarMedidaElemento(r.nivel, "electrico", r.id, "altura", 40);
    expect(editarPuntoElectrico(medido, r.id, { tipo: "int-doble" }).electricos[0].altura).toEqual({ valor: 40, tomada: true });
  });

  it("las cotas van encadenadas desde la esquina, en orden", () => {
    let n = agregarPuntoElectrico(cuarto(), { tipo: "toma-doble", muroId: "m3", cara: "derecha", desde: 250 }).nivel;
    n = agregarPuntoElectrico(n, { tipo: "int-simple", muroId: "m3", cara: "derecha", desde: 80 }).nivel;
    expect(cotasDeElectricos(n, 90).map((c) => c.texto)).toEqual(["≈ 80", "≈ 170"]);
  });

  it("lo que falta medir aparece en los controles, con el nombre del tipo", () => {
    const r = colocarPuntoElectrico(cuarto(), "int-doble", { x: 200, y: 460 }, 10)!;
    const pendientes = revisarNivel(r.nivel).filter((c) => c.tipo === "pendiente" && c.elemento?.id === r.id);
    expect(pendientes.map((c) => c.mensaje)).toEqual([
      "L1 · Llave de 2 teclas: desde la esquina",
      "L1 · Llave de 2 teclas: altura",
    ]);
  });

  it("un punto más alto que el muro es un error", () => {
    const r = colocarPuntoElectrico(cuarto(), "fuerza-aire", { x: 200, y: 460 }, 10)!;
    const n = cargarMedidaElemento(r.nivel, "electrico", r.id, "altura", 400);
    expect(revisarNivel(n).some((c) => c.codigo === "electrico-alto")).toBe(true);
  });
});
