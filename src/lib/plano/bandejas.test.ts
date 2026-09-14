import { describe, expect, it } from "vitest";
import { revisarNivel } from "./controles";
import {
  agregarBandeja,
  agregarZonaDibujada,
  agregarZonaTecho,
  cargarMargenBandeja,
  poligonoHaciaAdentro,
} from "./elementos";
import { aplicarToque } from "./herramientas";
import { nivelVacio } from "./modelo";
import { cuartoDeBruno } from "./prueba-casos";
import { areaConSigno } from "./vector";

const conZona = () => agregarZonaTecho(cuartoDeBruno({ medido: true }), { ambienteId: "amb1", tipo: "cielo-falso", altura: 260 });

describe("bandejas de techo", () => {
  it("el contorno metido hacia adentro achica el polígono y respeta el margen", () => {
    const cuadrado = [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 400 },
      { x: 0, y: 400 },
    ];
    expect(poligonoHaciaAdentro(cuadrado, 40)).toEqual([
      { x: 40, y: 40 },
      { x: 360, y: 40 },
      { x: 360, y: 360 },
      { x: 40, y: 360 },
    ]);
    // Un margen que se come el ambiente no devuelve nada.
    expect(poligonoHaciaAdentro(cuadrado, 200)).toBeNull();
    expect(poligonoHaciaAdentro(cuadrado, 0)).toBeNull();
  });

  it("la bandeja nace adentro de su zona, un escalón más abajo", () => {
    const base = conZona();
    const r = agregarBandeja(base.nivel, base.id)!;
    const bandeja = r.nivel.techos.find((t) => t.id === r.id)!;
    expect(bandeja.padreId).toBe(base.id);
    expect(bandeja.margen).toEqual({ valor: 40, tomada: false });
    expect(bandeja.altura.valor).toBe(240);
    expect(Math.abs(areaConSigno(bandeja.contorno))).toBeLessThan(Math.abs(areaConSigno(base.nivel.techos[0].contorno)));
  });

  it("una bandeja adentro de otra da los escalones concéntricos", () => {
    const base = conZona();
    const uno = agregarBandeja(base.nivel, base.id)!;
    const dos = agregarBandeja(uno.nivel, uno.id)!;
    expect(dos.nivel.techos).toHaveLength(3);
    expect(dos.nivel.techos[2].padreId).toBe(uno.id);
    expect(revisarNivel(dos.nivel).some((c) => c.codigo === "techo-fuera")).toBe(false);
  });

  it("cambiar el margen vuelve a replantear la bandeja desde su zona madre", () => {
    const base = conZona();
    const r = agregarBandeja(base.nivel, base.id)!;
    const n = cargarMargenBandeja(r.nivel, r.id, 60);
    const bandeja = n.techos.find((t) => t.id === r.id)!;
    expect(bandeja.margen).toEqual({ valor: 60, tomada: true });
    expect(Math.abs(areaConSigno(bandeja.contorno))).toBeLessThan(Math.abs(areaConSigno(r.nivel.techos[1].contorno)));
    // Un margen imposible no rompe el plano: queda como estaba.
    expect(cargarMargenBandeja(n, r.id, 900)).toBe(n);
  });

  it("una zona dibujada a dedo toma el ambiente que la contiene y no lleva margen", () => {
    const r = agregarZonaDibujada(
      cuartoDeBruno({ medido: true }),
      [
        { x: 50, y: 50 },
        { x: 200, y: 50 },
        { x: 200, y: 200 },
        { x: 50, y: 200 },
      ],
      240,
    )!;
    const zona = r.nivel.techos[0];
    expect(zona.ambienteId).toBe("amb1");
    expect(zona.margen).toBeNull();
    expect(zona.padreId).toBeNull();
  });

  it("el cielo falso se dibuja a dedo aunque las paredes todavía no cierren", () => {
    const suelto = agregarZonaDibujada(
      nivelVacio("nivel-1", "Planta baja"),
      [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 300 },
      ],
      240,
    );
    expect(suelto).not.toBeNull();
    expect(suelto!.nivel.techos[0].ambienteId).toBeNull();
    // Y aparece como aviso, no como error: no impide seguir relevando.
    const controles = revisarNivel(suelto!.nivel);
    expect(controles.some((c) => c.codigo === "techo-sin-ambiente" && c.tipo === "aviso")).toBe(true);
    expect(controles.some((c) => c.tipo === "error")).toBe(false);
  });

  it("cuando una herramienta de techo no puede actuar, dice por qué", () => {
    const vacio = nivelVacio("nivel-1", "Planta baja");
    const estado = { nivel: vacio, modo: "techo" as const, trazo: null, codigosOtros: [] };
    expect(aplicarToque({ ...estado, herramienta: "zona" }, { x: 0, y: 0 }, 10).aviso).toMatch(/Cerrá las paredes/);
    expect(aplicarToque({ ...estado, herramienta: "bandeja" }, { x: 0, y: 0 }, 10).aviso).toMatch(/primero poné la zona/);
  });

  it("un ambiente no puede tener dos cielos falsos: el segundo toque abre el que ya está", () => {
    const base = conZona();
    const r = aplicarToque(
      { nivel: base.nivel, modo: "techo", herramienta: "zona", trazo: null, codigosOtros: [] },
      { x: 200, y: 200 },
      10,
    );
    expect(r.nivel.techos).toHaveLength(1);
    expect(r.seleccion).toEqual({ tipo: "techo", id: base.id });
  });
});
