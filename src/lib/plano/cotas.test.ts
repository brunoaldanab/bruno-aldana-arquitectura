import { describe, expect, it } from "vitest";
import { cotasDeAberturas, cotasDeColumnas, cotasDeTecho } from "./cotas";
import { colocarAbertura } from "./edicion";
import { agregarColumna, agregarViga, agregarZonaTecho } from "./elementos";
import { cargarMedidaElemento } from "./elementos";
import { cuartoDeBruno } from "./prueba-casos";

/** El cuarto de Bruno: interior de 405 × 456 con muros de 15. */
const cuarto = () => cuartoDeBruno({ medido: true });

describe("cotas automáticas", () => {
  it("una puerta parte la cara en tres: hasta la puerta, su ancho y lo que queda", () => {
    const r = colocarAbertura(cuarto(), "puerta", { x: 200, y: 460 }, 10)!;
    const cotas = cotasDeAberturas(r.nivel, 60);
    expect(cotas).toHaveLength(3);
    const suma = cotas.reduce((t, c) => t + Number(c.texto.replace("≈ ", "")), 0);
    expect(suma).toBe(405);
    // El ancho de la puerta nace dibujado, así que todavía va con ≈.
    expect(cotas.every((c) => c.texto.startsWith("≈ "))).toBe(true);
  });

  it("el ancho cargado deja de ser aproximado y la cadena sigue cerrando", () => {
    const r = colocarAbertura(cuarto(), "ventana", { x: 200, y: -10 }, 10)!;
    const nivel = cargarMedidaElemento(r.nivel, "abertura", r.id, "ancho", 120);
    const cotas = cotasDeAberturas(nivel, 60);
    const ancho = cotas.find((c) => c.clave.endsWith(":ancho"))!;
    expect([ancho.texto, ancho.tomada]).toEqual(["120", true]);
    expect(cotas.reduce((t, c) => t + Number(c.texto.replace("≈ ", "")), 0)).toBe(405);
  });

  it("dos aberturas en la misma cara dan cinco tramos, ordenados desde la esquina", () => {
    let n = colocarAbertura(cuarto(), "puerta", { x: 300, y: 460 }, 10)!.nivel;
    n = colocarAbertura(n, "ventana", { x: 100, y: 460 }, 10)!.nivel;
    const cotas = cotasDeAberturas(n, 60);
    expect(cotas).toHaveLength(5);
    expect(cotas.reduce((t, c) => t + Number(c.texto.replace("≈ ", "")), 0)).toBe(405);
  });

  it("una columna muestra sus dos lados y su distancia a la pared más cercana de cada eje", () => {
    const r = agregarColumna(cuarto(), { x: 100, y: 150, ancho: 30, profundidad: 30 });
    const cotas = cotasDeColumnas(r.nivel, 16);
    expect(cotas.map((c) => c.clave.split(":")[1])).toEqual(["ancho", "profundidad", "x", "y"]);
    expect(cotas[0].texto).toBe("≈ 30");
    // Centro en x=100 con media columna de 15: quedan 85 hasta la cara del muro izquierdo.
    expect(cotas[2].texto).toBe("≈ 85");
    expect(cotas[3].texto).toBe("≈ 135");
  });

  it("la zona de techo se acota por su contorno y la viga por su largo", () => {
    const conZona = agregarZonaTecho(cuarto(), { ambienteId: "amb1", tipo: "cielo-falso", altura: 250 });
    const zona = cotasDeTecho(conZona.nivel, 22);
    expect(zona.map((c) => c.texto)).toEqual(["≈ 405", "≈ 456", "≈ 405", "≈ 456"]);

    const conViga = agregarViga(cuarto(), { inicio: { x: 0, y: 200 }, fin: { x: 405, y: 200 }, ancho: 20, peralte: 40 });
    expect(cotasDeTecho(conViga.nivel, 22).map((c) => c.texto)).toEqual(["≈ 405"]);
  });
});
