import { describe, expect, it } from "vitest";
import { indiceLadoDeMuro, ladosDeAmbiente } from "./ambientes";
import { medida, nivelVacio, type Abertura, type Nivel } from "./modelo";
import {
  agregarMuro,
  ajustarPunto,
  borrarMuro,
  cargarMedidaLado,
  moverNodo,
  partirMuro,
  renombrarAmbiente,
} from "./operaciones";
import { cuartoDeBruno } from "./prueba-casos";
import { superficie } from "./superficie";

const abertura = (datos: Partial<Abertura>): Abertura => ({
  id: "a1",
  codigo: "V1",
  tipo: "ventana",
  muroId: "m1",
  cara: "derecha",
  desde: medida(130, true),
  ancho: medida(150, true),
  alto: medida(120, true),
  antepecho: medida(90, true),
  apertura: "corrediza",
  abreHacia: null,
  bisagra: null,
  notas: "",
  ...datos,
});

/** El cuarto medido, cortado al medio por un tabique que llega en T a los muros de arriba y abajo. */
const cuartoCortado = () =>
  agregarMuro(cuartoDeBruno({ medido: true }), { x: 202.5, y: -7.5 }, { x: 202.5, y: 463.5 }).nivel;

const tomadas = (n: Nivel) =>
  n.ambientes.flatMap((a) => ladosDeAmbiente(n, a.id).filter((l) => l.medida?.tomada).map((l) => l.caras[0].muroId));

describe("operaciones", () => {
  it("ajusta el toque a 0°, 45° y 90° y lo engancha a un nodo cercano", () => {
    const vacio = nivelVacio("nivel-1", "Planta baja");
    expect(ajustarPunto(vacio, { x: 0, y: 0 }, { x: 100, y: 3 }).punto).toEqual({ x: 100, y: 0 });
    expect(ajustarPunto(vacio, { x: 0, y: 0 }, { x: 100, y: 3 }, { angulo: false }).punto).toEqual({ x: 100, y: 3 });
    const iman = ajustarPunto(cuartoDeBruno(), null, { x: 420, y: -5 });
    expect(iman.nodoId).toBe("n2");
    expect(iman.punto).toEqual({ x: 412.5, y: -7.5 });
  });

  it("dibujar los cuatro muros del cuarto cerrando en el primer nodo forma el ambiente", () => {
    let n = nivelVacio("nivel-1", "Planta baja");
    let r = agregarMuro(n, { x: -7.5, y: -7.5 }, { x: 412.5, y: -7.5 });
    r = agregarMuro(r.nivel, { nodoId: r.nodoHasta }, { x: 412.5, y: 463.5 });
    r = agregarMuro(r.nivel, { nodoId: r.nodoHasta }, { x: -7.5, y: 463.5 });
    r = agregarMuro(r.nivel, { nodoId: r.nodoHasta }, { nodoId: "n1" });
    n = r.nivel;
    expect(n.muros.map((m) => m.id)).toEqual(["m1", "m2", "m3", "m4"]);
    expect(n.ambientes).toHaveLength(1);
    expect(superficie(n, "amb1")).toBe(18.468);
  });

  it("un tabique en T parte los muros y divide el cuarto; solo los lados que cambian pierden su medida", () => {
    const n = cuartoCortado();
    expect(n.ambientes).toHaveLength(2);
    expect(n.ambientes.map((a) => a.id)).toContain("amb1");
    expect(n.ambientes.map((a) => superficie(n, a.id))).toEqual([8.892, 8.892]);
    expect(tomadas(n).sort()).toEqual(["m2", "m4"]);
  });

  it("cargar las cuatro cotas en el cuarto dibujado a ojo lo lleva a 18,468 m²", () => {
    let n = cuartoDeBruno({ aOjo: true });
    for (const [muro, valor] of [["m1", 405], ["m4", 456], ["m3", 405], ["m2", 456]] as const)
      n = cargarMedidaLado(n, "amb1", indiceLadoDeMuro(n, "amb1", muro), valor);
    expect(superficie(n, "amb1")).toBe(18.468);
    expect(tomadas(n)).toHaveLength(4);
  });

  it("mover un nodo cambia las medidas dibujadas y nunca crea tomadas", () => {
    const n = moverNodo(cuartoDeBruno(), "n3", { x: 432.5, y: 463.5 });
    const abajo = ladosDeAmbiente(n, "amb1")[indiceLadoDeMuro(n, "amb1", "m3")];
    expect(abajo.medida?.tomada).toBe(false);
    expect(abajo.medida!.valor).toBeGreaterThan(405);
    expect(tomadas(n)).toEqual([]);
  });

  it("partir un muro deja la abertura en su tramo con el desde recalculado y conserva la medida del lado", () => {
    const base = cuartoDeBruno({ medido: true });
    const conVentana = { ...base, aberturas: [abertura({})] };
    const { nivel, nodoId } = partirMuro(conVentana, "m1", "derecha", 100);
    expect(nodoId).toBe("n5");
    expect(nivel.nodos.find((x) => x.id === "n5")).toEqual({ id: "n5", x: 100, y: -7.5 });
    expect(nivel.aberturas[0]).toMatchObject({ muroId: "m5", desde: medida(30, true) });
    const arriba = ladosDeAmbiente(nivel, "amb1")[indiceLadoDeMuro(nivel, "amb1", "m1")];
    expect(arriba.caras).toHaveLength(2);
    expect(arriba.medida).toEqual(medida(405, true));
    expect(superficie(nivel, "amb1")).toBe(18.468);
  });

  it("borrar el tabique vuelve a un solo ambiente y se lleva sus aberturas", () => {
    const cortado = cuartoCortado();
    const tabique = cortado.muros[cortado.muros.length - 1].id;
    const conPuerta = { ...cortado, aberturas: [abertura({ id: "a1", codigo: "P1", tipo: "puerta", muroId: tabique })] };
    const n = borrarMuro(conPuerta, tabique);
    expect(n.ambientes.map((a) => a.id)).toEqual(["amb1"]);
    expect(superficie(n, "amb1")).toBe(18.468);
    expect(n.aberturas).toEqual([]);
  });

  it("renombrar un ambiente", () => {
    expect(renombrarAmbiente(cuartoDeBruno(), "amb1", "Cuarto de Bruno").ambientes[0].nombre).toBe("Cuarto de Bruno");
  });
});
