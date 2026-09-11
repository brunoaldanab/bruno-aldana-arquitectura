import { describe, expect, it } from "vitest";
import {
  agregarAbertura,
  agregarColumna,
  agregarMoldura,
  agregarViga,
  agregarZonaTecho,
  borrarElemento,
  cargarMedidaElemento,
  centroAbertura,
  editarAbertura,
  hastaEsquina,
} from "./elementos";
import { medida, nivelSchema } from "./modelo";
import { cuartoDeBruno } from "./prueba-casos";
import { contornoInterior } from "./superficie";

const puerta = { tipo: "puerta" as const, muroId: "m3", cara: "derecha" as const, desde: 60, ancho: 90, alto: 210 };
const ventana = { tipo: "ventana" as const, muroId: "m1", cara: "derecha" as const, desde: 130, ancho: 150, alto: 120, antepecho: 90 };

describe("elementos", () => {
  it("la puerta del cuarto de Bruno queda a 60 de una esquina y a 255 de la otra", () => {
    const { nivel, id, codigo } = agregarAbertura(cuartoDeBruno({ medido: true }), puerta);
    const p = nivel.aberturas.find((a) => a.id === id)!;
    expect(codigo).toBe("P1");
    expect(p).toMatchObject({ desde: medida(60), ancho: medida(90), alto: medida(210), antepecho: medida(0, true), apertura: "batiente" });
    expect(hastaEsquina(nivel, p)).toBe(255);
    expect(centroAbertura(nivel, p)).toEqual({ x: 300, y: 463.5 });
    expect(nivelSchema.safeParse(nivel).success).toBe(true);
  });

  it("la ventana de 150 × 120 con antepecho de 90 va en el muro de arriba", () => {
    const { nivel, id, codigo } = agregarAbertura(cuartoDeBruno({ medido: true }), ventana);
    const v = nivel.aberturas.find((a) => a.id === id)!;
    expect(codigo).toBe("V1");
    expect(v.antepecho).toEqual(medida(90));
    expect(hastaEsquina(nivel, v)).toBe(125);
  });

  it("los códigos no se repiten con los de otros niveles", () => {
    expect(agregarAbertura(cuartoDeBruno(), puerta, ["P1"]).codigo).toBe("P2");
  });

  it("cargar una medida la pasa a tomada, y cambiar el tipo rehace código y antepecho", () => {
    const r = agregarAbertura(cuartoDeBruno(), puerta);
    const medido = cargarMedidaElemento(r.nivel, "abertura", r.id, "ancho", 92);
    expect(medido.aberturas[0].ancho).toEqual(medida(92, true));
    const cambiada = editarAbertura(medido, r.id, { tipo: "ventana" });
    expect(cambiada.aberturas[0]).toMatchObject({ codigo: "V1", antepecho: medida(0, false) });
  });

  it("columnas, zonas de techo, molduras y vigas nacen dibujadas y con su id", () => {
    let n = cuartoDeBruno();
    const techo = agregarZonaTecho(n, { ambienteId: "amb1", tipo: "cielo-falso", altura: 250 });
    n = techo.nivel;
    expect(techo.id).toBe("t1");
    expect(n.techos[0].contorno).toEqual(contornoInterior(n, "amb1"));
    expect(n.techos[0].altura).toEqual(medida(250));
    const col = agregarColumna(n, { x: 50, y: 50, ancho: 30, profundidad: 30 });
    const mol = agregarMoldura(col.nivel, { ambienteId: "amb1", ancho: 10, caida: 20 });
    const viga = agregarViga(mol.nivel, { inicio: { x: 0, y: 200 }, fin: { x: 405, y: 200 }, ancho: 20, peralte: 40 });
    n = viga.nivel;
    expect([col.id, mol.id, viga.id]).toEqual(["c1", "mol1", "v1"]);
    expect(n.molduras[0].caras).toHaveLength(4);
    expect(nivelSchema.safeParse(n).success).toBe(true);
    expect(borrarElemento(n, "columna", "c1").columnas).toEqual([]);
  });

  it("borrar la puerta", () => {
    const r = agregarAbertura(cuartoDeBruno(), puerta);
    expect(borrarElemento(r.nivel, "abertura", r.id).aberturas).toEqual([]);
  });
});
