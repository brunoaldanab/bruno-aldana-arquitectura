import { describe, expect, it } from "vitest";
import { contarPendientes, revisarNivel, revisarRelevamiento } from "./controles";
import { agregarAbertura, agregarZonaTecho } from "./elementos";
import { relevamientoVacio, type Nivel } from "./modelo";
import { agregarMuro } from "./operaciones";
import { ambienteEnL, cuartoDeBruno, medirLado } from "./prueba-casos";

const codigos = (n: Nivel) => revisarNivel(n).map((c) => c.codigo);
const puerta = (desde: number, ancho = 90) => ({ tipo: "puerta" as const, muroId: "m3", cara: "derecha" as const, desde, ancho, alto: 210 });

describe("controles", () => {
  it("cuenta como pendiente toda medida dibujada que Revit necesita", () => {
    expect(contarPendientes(cuartoDeBruno())).toBe(9);
    expect(contarPendientes(cuartoDeBruno({ medido: true }))).toBe(0);
    // Desde, ancho y alto: el antepecho de una puerta es 0 por definición.
    expect(contarPendientes(agregarAbertura(cuartoDeBruno({ medido: true }), puerta(60)).nivel)).toBe(3);
  });

  it("el cuarto con 445 en vez de 456 es un error: no cierra por 11 cm", () => {
    const errores = revisarNivel(medirLado(cuartoDeBruno({ medido: true }), "amb1", "m2", 445)).filter((c) => c.tipo === "error");
    expect(errores).toHaveLength(1);
    expect(errores[0].mensaje).toContain("No cierra · faltan 11 cm");
  });

  it("marca la abertura que se sale de su cara, las que se pisan y la más alta que el muro", () => {
    const base = cuartoDeBruno({ medido: true });
    expect(codigos(agregarAbertura(base, puerta(350)).nivel)).toContain("abertura-fuera");
    const dos = agregarAbertura(agregarAbertura(base, puerta(60)).nivel, puerta(100)).nivel;
    expect(codigos(dos)).toContain("aberturas-pisadas");
    const alta = agregarAbertura(base, { tipo: "ventana", muroId: "m1", cara: "derecha", desde: 130, ancho: 150, alto: 200, antepecho: 90 });
    expect(codigos(alta.nivel)).toContain("abertura-alta");
    expect(codigos(agregarAbertura(base, puerta(60)).nivel).filter((c) => c.startsWith("abertura"))).toEqual([]);
  });

  it("una zona de techo que tapa el hueco de la L se sale de su ambiente", () => {
    const l = ambienteEnL();
    const tapa = [
      { x: 0, y: 0 },
      { x: 500, y: 0 },
      { x: 500, y: 400 },
      { x: 0, y: 400 },
    ];
    const adentro = [
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      { x: 300, y: 200 },
      { x: 0, y: 200 },
    ];
    expect(codigos(agregarZonaTecho(l, { ambienteId: "amb1", tipo: "cielo-falso", contorno: tapa, altura: 240 }).nivel)).toContain("techo-fuera");
    expect(codigos(agregarZonaTecho(l, { ambienteId: "amb1", tipo: "cielo-falso", contorno: adentro, altura: 240 }).nivel)).not.toContain("techo-fuera");
  });

  it("avisa del techo más alto que la altura general, del muro suelto, del ambiente sin puertas y de la abertura pegada a la esquina", () => {
    const base = cuartoDeBruno({ medido: true });
    expect(codigos(agregarZonaTecho(base, { ambienteId: "amb1", tipo: "losa", altura: 300 }).nivel)).toContain("techo-alto");
    expect(codigos(agregarMuro(base, { x: 100, y: 100 }, { x: 100, y: 200 }).nivel)).toContain("muro-suelto");
    expect(codigos(base)).toContain("sin-puertas");
    const vano = agregarAbertura(base, { tipo: "vano", muroId: "m3", cara: "derecha", desde: 60, ancho: 90, alto: 210 }).nivel;
    expect(codigos(vano)).not.toContain("sin-puertas");
    expect(codigos(agregarAbertura(base, puerta(3)).nivel)).toContain("abertura-esquina");
    expect(revisarNivel(base).filter((c) => c.tipo === "aviso").map((c) => c.codigo)).toEqual(["sin-puertas"]);
  });

  it("un código repetido en dos niveles es un error del relevamiento", () => {
    const r = relevamientoVacio({ contactoId: "c1", nombre: "Casa", direccion: "", fechaRelevamiento: "2026-09-11" });
    const planta = agregarAbertura(cuartoDeBruno({ medido: true }), puerta(60)).nivel;
    r.niveles = [planta, { ...planta, id: "nivel-2", nombre: "Planta alta" }];
    const repetidos = revisarRelevamiento(r).filter((c) => c.codigo === "codigo-repetido");
    expect(repetidos).toHaveLength(1);
    expect(revisarRelevamiento(r).find((c) => c.codigo === "sin-puertas")).toBeUndefined();
    expect(revisarRelevamiento(r).every((c) => c.codigo === "codigo-repetido" || c.nivelId)).toBe(true);
  });
});
