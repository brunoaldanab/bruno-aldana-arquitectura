import { describe, expect, it } from "vitest";
import { actualizarAmbientes, claveLado, detectarContornos, indiceLadoDeMuro, ladosDeAmbiente } from "./ambientes";
import { medida } from "./modelo";
import { ambienteEnL, ambienteEnU, casaDeEjemplo, cuartoDeBruno, medirLado, nivelDesdeEjes } from "./prueba-casos";

describe("ambientes", () => {
  it("el cuarto de Bruno es un ambiente de cuatro lados", () => {
    const n = cuartoDeBruno();
    expect(n.ambientes).toHaveLength(1);
    expect(n.ambientes[0].contorno).toEqual([
      { muroId: "m1", cara: "derecha" },
      { muroId: "m4", cara: "derecha" },
      { muroId: "m3", cara: "derecha" },
      { muroId: "m2", cara: "derecha" },
    ]);
    const lados = ladosDeAmbiente(n, "amb1");
    expect(lados.map((l) => Math.round(l.largo))).toEqual([405, 456, 405, 456]);
    expect(claveLado(lados[0])).toBe("n2>n1");
  });

  it("un muro suelto adentro no forma parte del contorno, y el lado partido sigue siendo uno", () => {
    const n = nivelDesdeEjes(
      [
        ["n1", -7.5, -7.5],
        ["n5", 202.5, -7.5],
        ["n2", 412.5, -7.5],
        ["n3", 412.5, 463.5],
        ["n4", -7.5, 463.5],
        ["n6", 202.5, 100],
      ],
      [
        ["m1", "n1", "n5", 15],
        ["m5", "n5", "n2", 15],
        ["m2", "n2", "n3", 15],
        ["m3", "n3", "n4", 15],
        ["m4", "n4", "n1", 15],
        ["m6", "n5", "n6", 15],
      ],
    );
    expect(detectarContornos(n)).toHaveLength(1);
    const lados = ladosDeAmbiente(n, "amb1");
    expect(lados).toHaveLength(4);
    const arriba = lados[indiceLadoDeMuro(n, "amb1", "m1")];
    expect(arriba.caras.map((c) => c.muroId)).toEqual(["m5", "m1"]);
    expect(arriba.nodosInternos).toEqual(["n5"]);
    expect(arriba.largo).toBeCloseTo(405, 1);
  });

  it("la casa tiene dormitorio, baño y pasillo, y el lado del tabique partido es uno solo", () => {
    const n = casaDeEjemplo();
    expect(n.ambientes.map((a) => a.nombre)).toEqual(["Dormitorio", "Baño", "Pasillo"]);
    const dormitorio = n.ambientes[0].id;
    const lado = ladosDeAmbiente(n, dormitorio)[indiceLadoDeMuro(n, dormitorio, "m8")];
    expect(lado.caras).toHaveLength(2);
    expect(lado.largo).toBeCloseTo(400, 1);
  });

  it("la L y la U son un solo ambiente cada una", () => {
    expect(ladosDeAmbiente(ambienteEnL(), "amb1")).toHaveLength(6);
    expect(ladosDeAmbiente(ambienteEnU(), "amb1")).toHaveLength(8);
    expect(ambienteEnL().ambientes).toHaveLength(1);
    expect(ambienteEnU().ambientes).toHaveLength(1);
  });

  it("al volver a detectar se conservan id, nombre y desnivel", () => {
    const n = cuartoDeBruno();
    const renombrado = { ...n, ambientes: [{ ...n.ambientes[0], nombre: "Mi cuarto", desnivelPiso: -2 }] };
    const movido = { ...renombrado, nodos: renombrado.nodos.map((x) => (x.id === "n3" ? { ...x, x: 420 } : x)) };
    const again = actualizarAmbientes(renombrado, movido);
    expect(again.ambientes).toEqual([{ ...renombrado.ambientes[0] }]);
  });

  it("la medida tomada sigue con su lado y se pierde si el lado cambia de extremos", () => {
    const medido = medirLado(cuartoDeBruno(), "amb1", "m1", 405);
    expect(ladosDeAmbiente(medido, "amb1")[0].medida).toEqual(medida(405, true));
    // Un tabique que llega al medio desde adentro corta el lado de arriba en dos.
    const cortado = nivelDesdeEjes(
      [
        ["n1", -7.5, -7.5],
        ["n5", 202.5, -7.5],
        ["n2", 412.5, -7.5],
        ["n3", 412.5, 463.5],
        ["n6", 202.5, 463.5],
        ["n4", -7.5, 463.5],
      ],
      [
        ["m1", "n1", "n5", 15],
        ["m5", "n5", "n2", 15],
        ["m2", "n2", "n3", 15],
        ["m3", "n3", "n6", 15],
        ["m7", "n6", "n4", 15],
        ["m4", "n4", "n1", 15],
        ["m6", "n5", "n6", 15],
      ],
    );
    const conMedida = { ...cortado, muros: cortado.muros.map((m) => (m.id === "m1" ? { ...m, caras: { izquierda: null, derecha: medida(405, true) } } : m)) };
    const nuevo = actualizarAmbientes(medido, conMedida);
    expect(nuevo.ambientes).toHaveLength(2);
    for (const a of nuevo.ambientes) for (const l of ladosDeAmbiente(nuevo, a.id)) expect(l.medida?.tomada ?? false).toBe(false);
  });
});
