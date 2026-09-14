// src/lib/plano/herramientas.test.ts
import { describe, expect, it } from "vitest";
import { cargarMedidaElemento } from "./elementos";
import { aplicarArrastre, aplicarToque, iniciarArrastre, seleccionDeCota, seleccionVigente, type EstadoToque, type Herramienta } from "./herramientas";
import { posicionNodo } from "./caras";
import { nivelVacio, type Nivel } from "./modelo";
import { cuartoDeBruno } from "./prueba-casos";
import { superficie } from "./superficie";

const estado = (nivel: Nivel, herramienta: Herramienta, extra: Partial<EstadoToque> = {}): EstadoToque => ({
  nivel, modo: "planta", herramienta, trazo: null, codigosOtros: [], ...extra,
});

describe("dibujar con toques", () => {
  it("cuatro toques y volver al primero cierran un ambiente y terminan el trazo", () => {
    let e = estado(nivelVacio("nivel-1", "Planta baja"), "muro");
    const toques = [{ x: 0, y: 0 }, { x: 400, y: 3 }, { x: 400, y: 450 }, { x: 2, y: 452 }, { x: 1, y: 1 }];
    for (const p of toques) {
      const r = aplicarToque(e, p, 20);
      e = { ...e, nivel: r.nivel, trazo: r.trazo, herramienta: r.herramienta };
    }
    expect(e.nivel.muros).toHaveLength(4);
    expect(e.nivel.ambientes).toHaveLength(1);
    expect(e.trazo).toBeNull();
    expect(e.nivel.nodos.find((n) => n.id === "n2")).toEqual({ id: "n2", x: 400, y: 0 });
  });

  it("tocar dos veces el mismo punto no crea un muro de largo cero", () => {
    const e = estado(nivelVacio("nivel-1", "Planta baja"), "muro");
    const uno = aplicarToque(e, { x: 0, y: 0 }, 20);
    const dos = aplicarToque({ ...e, trazo: uno.trazo }, { x: 0.4, y: 0 }, 20);
    expect(dos.nivel.muros).toHaveLength(0);
    expect(dos.trazo).toEqual(uno.trazo);
  });

  it("la puerta se coloca, queda seleccionada y la herramienta vuelve a Tocar", () => {
    const r = aplicarToque(estado(cuartoDeBruno({ medido: true }), "puerta", { codigosOtros: ["P1"] }), { x: 300, y: 460 }, 10);
    expect(r.nivel.aberturas[0].codigo).toBe("P2");
    expect(r.seleccion).toEqual({ tipo: "abertura", id: "a1" });
    expect(r.herramienta).toBe("tocar");
  });

  it("en techo la zona toma el ambiente y la viga necesita dos toques", () => {
    const cuarto = cuartoDeBruno({ medido: true });
    const zona = aplicarToque(estado(cuarto, "zona", { modo: "techo" }), { x: 200, y: 200 }, 10);
    expect(zona.nivel.techos[0]).toMatchObject({ tipo: "cielo-falso", altura: { valor: 263 } });
    expect(superficie(cuarto, "amb1")).toBeCloseTo(18.468, 3);
    const inicio = aplicarToque(estado(cuarto, "viga", { modo: "techo" }), { x: 0, y: 300 }, 10);
    expect(inicio.nivel.vigas).toHaveLength(0);
    const fin = aplicarToque(estado(cuarto, "viga", { modo: "techo", trazo: inicio.trazo }), { x: 405, y: 300 }, 10);
    expect(fin.nivel.vigas[0]).toMatchObject({ inicio: { x: 0, y: 300 }, fin: { x: 405, y: 300 }, ancho: { valor: 20 } });
  });
});

describe("cotas, selección y arrastre", () => {
  const cuarto = cuartoDeBruno({ medido: true });

  it("tocar una cota selecciona el muro de ese lado", () => {
    expect(seleccionDeCota(cuarto, "amb1:1")).toMatchObject({ tipo: "muro", id: "m4", ambienteId: "amb1", indice: 1 });
    expect(aplicarToque(estado(cuarto, "tocar"), { x: 0, y: 0 }, 10, "amb1:0").seleccion).toMatchObject({ id: "m1", indice: 0 });
    expect(seleccionDeCota(cuarto, "amb9:0")).toBeNull();
  });

  it("recién cerrado el ambiente con Muro, tocar una cota la abre y vuelve a Tocar; con un trazo a medias, sigue dibujando", () => {
    const abierta = aplicarToque(estado(cuarto, "muro"), { x: 200, y: 30 }, 10, "amb1:0");
    expect(abierta).toMatchObject({ seleccion: { tipo: "muro", id: "m1" }, herramienta: "tocar", trazo: null });
    const trazo = { extremo: { x: 100, y: 100 }, punto: { x: 100, y: 100 }, primero: null };
    const dibujando = aplicarToque(estado(cuarto, "muro", { trazo }), { x: 200, y: 100 }, 10, "amb1:0");
    expect(dibujando.nivel.muros.length).toBe(cuarto.muros.length + 1);
  });

  it("una selección de algo borrado deja de valer", () => {
    expect(seleccionVigente(cuarto, { tipo: "abertura", id: "a1" })).toBeNull();
    expect(seleccionVigente(cuarto, { tipo: "ambiente", id: "amb1" })).toEqual({ tipo: "ambiente", id: "amb1" });
  });

  it("se arrastra la puerta sobre su cara y el nodo se resuelve al soltar", () => {
    const conPuerta = aplicarToque(estado(cuarto, "puerta"), { x: 300, y: 460 }, 10).nivel;
    const medida = cargarMedidaElemento(conPuerta, "abertura", "a1", "desde", 60);
    const a = iniciarArrastre(estado(medida, "tocar"), { x: 300, y: 462 }, 10)!;
    expect(a).toEqual({ tipo: "abertura", id: "a1" });
    expect(aplicarArrastre(medida, a, { x: 250.4, y: 470 }, false).aberturas[0].desde).toEqual({ valor: 110, tomada: false });
    expect(iniciarArrastre(estado(cuarto, "muro"), { x: -7, y: -7 }, 10)).toBeNull();
    const nodo = iniciarArrastre(estado(cuarto, "tocar"), { x: -7, y: -7 }, 10)!;
    expect(nodo).toEqual({ tipo: "nodo", id: "n1" });
    // Con los cuatro lados medidos, torcer una esquina 22 cm deja el ambiente abierto: conserva el dibujo (ajuste 14 del motor).
    const suelto = aplicarArrastre(cuartoDeBruno(), nodo, { x: -30.4, y: -7.4 }, true);
    expect(suelto.nodos.find((n) => n.id === "n1")).toEqual({ id: "n1", x: -30, y: -7 });
  });
});

describe("modo recto", () => {
  it("un toque torcido deja el muro horizontal o vertical, el que más se parezca", () => {
    const base = { nivel: nivelVacio("nivel-1", "Planta baja"), modo: "planta" as const, herramienta: "muro" as const, codigosOtros: [], recto: true };
    const uno = aplicarToque({ ...base, trazo: null }, { x: 0, y: 0 }, 10);
    // 300 a la derecha y 20 hacia abajo: sale recto a la derecha.
    const dos = aplicarToque({ ...base, trazo: uno.trazo }, { x: 300, y: 20 }, 10);
    const muro = dos.nivel.muros[0];
    expect(posicionNodo(dos.nivel, muro.desde)).toEqual({ x: 0, y: 0 });
    expect(posicionNodo(dos.nivel, muro.hasta)).toEqual({ x: 300, y: 0 });
  });

  it("sin modo recto, un toque bien torcido deja el muro donde cayó el dedo", () => {
    const base = { nivel: nivelVacio("nivel-1", "Planta baja"), modo: "planta" as const, herramienta: "muro" as const, codigosOtros: [], recto: false };
    const uno = aplicarToque({ ...base, trazo: null }, { x: 0, y: 0 }, 10);
    // 18 grados: lejos de 0 y de 45, así que no lo endereza ningún ajuste.
    const dos = aplicarToque({ ...base, trazo: uno.trazo }, { x: 300, y: 100 }, 10);
    expect(posicionNodo(dos.nivel, dos.nivel.muros[0].hasta)).toEqual({ x: 300, y: 100 });
    // Con modo recto, ese mismo toque sale horizontal.
    const recto = aplicarToque({ ...base, recto: true, trazo: uno.trazo }, { x: 300, y: 100 }, 10);
    expect(posicionNodo(recto.nivel, recto.nivel.muros[0].hasta)).toEqual({ x: 300, y: 0 });
  });

  it("el imán al nodo manda sobre el modo recto: el recorrido siempre puede cerrar", () => {
    const base = { nivel: nivelVacio("nivel-1", "Planta baja"), modo: "planta" as const, herramienta: "muro" as const, codigosOtros: [], recto: true };
    let r = aplicarToque({ ...base, trazo: null }, { x: 0, y: 0 }, 20);
    r = aplicarToque({ ...base, nivel: r.nivel, trazo: r.trazo }, { x: 300, y: 0 }, 20);
    r = aplicarToque({ ...base, nivel: r.nivel, trazo: r.trazo }, { x: 300, y: 300 }, 20);
    r = aplicarToque({ ...base, nivel: r.nivel, trazo: r.trazo }, { x: 0, y: 300 }, 20);
    // El último toque cae a 10 cm del primer nodo: se engancha ahí y cierra el ambiente.
    r = aplicarToque({ ...base, nivel: r.nivel, trazo: r.trazo }, { x: 10, y: 6 }, 20);
    expect(r.trazo).toBeNull();
    expect(r.nivel.nodos).toHaveLength(4);
    expect(r.nivel.ambientes).toHaveLength(1);
  });
});
