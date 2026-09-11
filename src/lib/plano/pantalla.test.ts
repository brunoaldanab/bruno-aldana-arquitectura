// src/lib/plano/pantalla.test.ts
import { describe, expect, it } from "vitest";
import { ladosDeAmbiente } from "./ambientes";
import { posicionNodo } from "./caras";
import { cotasDeAmbiente, geometriaAbertura, nombresPuntas, poligonoMuro, textoSuperficie } from "./dibujo";
import { agregarNivel, arrastrarAbertura, cargarLadoConPunta, colocarAbertura, editarZonaTecho, proyectarEnEje } from "./edicion";
import { agregarZonaTecho } from "./elementos";
import { relevamientoVacio } from "./modelo";
import { cuartoDeBruno } from "./prueba-casos";
import { tocarPlanta, tocarTecho } from "./toque";
import { cajaDeNivel, encuadrar, pantallaAPlano, pellizcar, planoAPantalla } from "./vista";

const cerca = (p: { x: number; y: number }, x: number, y: number) => {
  expect(p.x).toBeCloseTo(x, 1);
  expect(p.y).toBeCloseTo(y, 1);
};

describe("vista del lienzo", () => {
  it("plano y pantalla ida y vuelta", () => {
    const v = { x: 30, y: -12, escala: 0.7 };
    cerca(pantallaAPlano(v, planoAPantalla(v, { x: 405, y: 456 })), 405, 456);
  });

  it("encuadrar el cuarto en 390 × 600 lo deja entero y centrado", () => {
    const caja = cajaDeNivel(cuartoDeBruno());
    const v = encuadrar(caja, 390, 600, 48);
    expect(v.escala).toBeCloseTo(294 / 420, 3);
    cerca(planoAPantalla(v, { x: 202.5, y: 228 }), 195, 300);
    for (const p of [{ x: caja.minX, y: caja.minY }, { x: caja.maxX, y: caja.maxY }]) {
      const s = planoAPantalla(v, p);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(390);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(600);
    }
  });

  it("pellizcar al doble deja quieto el punto entre los dedos", () => {
    const v = { x: 0, y: 0, escala: 1 };
    const nueva = pellizcar(v, [{ x: 100, y: 100 }, { x: 200, y: 100 }], [{ x: 50, y: 100 }, { x: 250, y: 100 }]);
    expect(nueva.escala).toBe(2);
    cerca(pantallaAPlano(nueva, { x: 150, y: 100 }), 150, 100);
  });
});

describe("qué se tocó", () => {
  const cuarto = cuartoDeBruno({ medido: true });

  it("un muro, del lado del ambiente, con su lado", () => {
    expect(tocarPlanta(cuarto, { x: 202, y: -7 }, 10)).toEqual({
      tipo: "muro", id: "m1", cara: "derecha", punto: { x: 202, y: -7 }, ambienteId: "amb1", indice: 0,
    });
  });

  it("el ambiente en el medio y el nodo en la esquina", () => {
    expect(tocarPlanta(cuarto, { x: 200, y: 200 }, 10)).toEqual({ tipo: "ambiente", id: "amb1" });
    expect(tocarPlanta(cuarto, { x: -3, y: -3 }, 10)).toEqual({ tipo: "nodo", id: "n1" });
  });

  it("la puerta antes que su muro, y en techo la zona", () => {
    const conPuerta = colocarAbertura(cuarto, "puerta", { x: 300, y: 460 }, 10)!;
    expect(tocarPlanta(conPuerta.nivel, { x: 300, y: 462 }, 10)).toEqual({ tipo: "abertura", id: conPuerta.id });
    const conZona = agregarZonaTecho(cuarto, { ambienteId: "amb1", tipo: "cielo-falso", altura: 240 });
    expect(tocarTecho(conZona.nivel, { x: 200, y: 200 }, 10)).toEqual({ tipo: "techo", id: conZona.id });
  });
});

describe("dibujo", () => {
  it("el muro de arriba tiene sus cuatro esquinas", () => {
    const p = poligonoMuro(cuartoDeBruno(), "m1");
    expect(p).toHaveLength(4);
    cerca(p[0], -15, -15);
    cerca(p[3], 0, 0);
  });

  it("cotas interiores: dibujadas con ≈ y tomadas en blanco, corridas hacia adentro", () => {
    expect(cotasDeAmbiente(cuartoDeBruno(), "amb1", 40).map((c) => c.texto)).toEqual(["≈ 405", "≈ 456", "≈ 405", "≈ 456"]);
    const medidas = cotasDeAmbiente(cuartoDeBruno({ medido: true }), "amb1", 40);
    expect(medidas.map((c) => [c.texto, c.tomada])).toEqual([["405", true], ["456", true], ["405", true], ["456", true]]);
    cerca(medidas[0].inicio, 405, 40);
  });

  it("superficie con ≈ hasta que se miden los lados", () => {
    expect(textoSuperficie(cuartoDeBruno(), "amb1")).toBe("≈ 18,47 m²");
    expect(textoSuperficie(cuartoDeBruno({ medido: true }), "amb1")).toBe("18,47 m²");
  });

  it("el hueco de la puerta cruza el muro de cara a cara, con su hoja hacia el cuarto", () => {
    const r = colocarAbertura(cuartoDeBruno({ medido: true }), "puerta", { x: 300, y: 460 }, 10)!;
    const g = geometriaAbertura(r.nivel, r.nivel.aberturas[0]);
    cerca(g.hueco[0], 345, 456);
    cerca(g.hueco[2], 255, 471);
    expect(g.hojas).toHaveLength(1);
    cerca(g.hojas[0].extremo, 345, 366);
  });

  it("nombres de las puntas de un lado", () => {
    const lado = ladosDeAmbiente(cuartoDeBruno(), "amb1")[0];
    expect(nombresPuntas(lado)).toEqual({ inicio: "Derecha", fin: "Izquierda" });
    expect(nombresPuntas({ inicio: { x: 0, y: 0 }, fin: { x: 0, y: 456 } })).toEqual({ inicio: "Arriba", fin: "Abajo" });
  });
});

describe("ediciones de la pantalla", () => {
  it("una puerta tocando el muro de abajo nace P1 a 60 de la esquina", () => {
    const r = colocarAbertura(cuartoDeBruno({ medido: true }), "puerta", { x: 300, y: 460 }, 10)!;
    expect(r.codigo).toBe("P1");
    expect(r.nivel.aberturas[0]).toMatchObject({ muroId: "m3", cara: "derecha", desde: { valor: 60, tomada: false }, ancho: { valor: 90 } });
    expect(colocarAbertura(cuartoDeBruno(), "puerta", { x: 200, y: 200 }, 10)).toBeNull();
  });

  it("arrastrar la puerta la deja siempre dentro de su cara", () => {
    const r = colocarAbertura(cuartoDeBruno({ medido: true }), "puerta", { x: 300, y: 460 }, 10)!;
    expect(arrastrarAbertura(r.nivel, r.id, { x: 30, y: 460 }).aberturas[0].desde).toEqual({ valor: 315, tomada: false });
    expect(arrastrarAbertura(r.nivel, r.id, { x: 9999, y: 460 }).aberturas[0].desde.valor).toBe(0);
    expect(arrastrarAbertura(r.nivel, r.id, { x: 300, y: 450 })).toBe(r.nivel);
  });

  it("cargar un lado deja quieta la punta elegida", () => {
    const aOjo = cuartoDeBruno({ aOjo: true });
    const lado = ladosDeAmbiente(aOjo, "amb1")[0];
    for (const punta of ["inicio", "fin"] as const) {
      const nodo = punta === "inicio" ? lado.nodoInicio : lado.nodoFin;
      const r = cargarLadoConPunta(aOjo, "amb1", 0, 405, punta);
      const antes = posicionNodo(aOjo, nodo);
      cerca(posicionNodo(r, nodo), antes.x, antes.y);
      expect(ladosDeAmbiente(r, "amb1")[0].largo).toBeCloseTo(405, 1);
    }
  });

  it("zona a cielo falso, proyección sobre el eje y nivel nuevo", () => {
    const z = agregarZonaTecho(cuartoDeBruno(), { ambienteId: "amb1", tipo: "losa", altura: 263 });
    expect(editarZonaTecho(z.nivel, z.id, "cielo-falso").techos[0].tipo).toBe("cielo-falso");
    expect(proyectarEnEje(cuartoDeBruno(), "m1", { x: 202, y: 30 })).toEqual({ x: 202, y: -7.5 });
    const r = relevamientoVacio({ contactoId: "a", nombre: "Cuarto", direccion: "", fechaRelevamiento: "2026-09-11" });
    const conAltura = { ...r, niveles: [{ ...r.niveles[0], alturaGeneral: { valor: 263, tomada: true } }] };
    const { relevamiento, nivelId } = agregarNivel(conAltura);
    expect(nivelId).toBe("nivel-2");
    expect(relevamiento.niveles[1].cotaPiso).toBe(263);
  });
});
