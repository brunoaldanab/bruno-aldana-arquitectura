// src/lib/plano/prueba-casos.ts
/**
 * Los casos de referencia, armados una sola vez para todas las pruebas del
 * motor: el cuarto de Bruno, una casa de tres ambientes, una L y una U.
 * No es código de la app: solo lo usan los archivos .test.ts.
 */
import { actualizarAmbientes, indiceLadoDeMuro, ladosDeAmbiente } from "./ambientes";
import { medida, nivelVacio, type Nivel } from "./modelo";
import { ambienteEnPunto } from "./superficie";
import { areaConSigno, interseccion, normalDerecha, normalIzquierda, por, resta, suma, unitario, type Punto } from "./vector";

type NodoCaso = [id: string, x: number, y: number];
type MuroCaso = [id: string, desde: string, hasta: string, espesor: number];

export function nivelDesdeEjes(nodos: NodoCaso[], muros: MuroCaso[], espesorTomado = false): Nivel {
  const n = nivelVacio("nivel-1", "Planta baja");
  n.nodos = nodos.map(([id, x, y]) => ({ id, x, y }));
  n.muros = muros.map(([id, desde, hasta, e]) => ({
    id,
    desde,
    hasta,
    espesor: medida(e, espesorTomado),
    altura: null,
    caras: { izquierda: null, derecha: null },
  }));
  return actualizarAmbientes(null, n);
}

/** Muros cuyo interior es el polígono dado: cada nodo es el corte de los ejes corridos medio espesor hacia afuera. */
export function nivelDesdePoligono(interior: Punto[], espesor = 15, espesorTomado = false): Nivel {
  const horario = areaConSigno(interior) > 0;
  const k = interior.length;
  const lineas = interior.map((p, i) => {
    const u = unitario(resta(interior[(i + 1) % k], p));
    const afuera = horario ? normalIzquierda(u) : normalDerecha(u);
    return { punto: suma(p, por(afuera, espesor / 2)), u };
  });
  const nodos: NodoCaso[] = interior.map((_, i) => {
    const a = lineas[(i - 1 + k) % k];
    const b = lineas[i];
    const p = interseccion(a.punto, a.u, b.punto, b.u)!;
    return [`n${i + 1}`, p.x, p.y];
  });
  const muros: MuroCaso[] = interior.map((_, i) => [`m${i + 1}`, `n${i + 1}`, `n${((i + 1) % k) + 1}`, espesor]);
  return nivelDesdeEjes(nodos, muros, espesorTomado);
}

/** Carga una medida tomada en el lado del ambiente que contiene al muro, sin resolver. */
export function medirLado(nivel: Nivel, ambienteId: string, muroId: string, valor: number): Nivel {
  const lado = ladosDeAmbiente(nivel, ambienteId)[indiceLadoDeMuro(nivel, ambienteId, muroId)];
  const muros = nivel.muros.map((m) => {
    const caras = { ...m.caras };
    lado.caras.forEach((c, i) => {
      if (c.muroId === m.id) caras[c.cara] = i === 0 ? medida(valor, true) : null;
    });
    return { ...m, caras };
  });
  return { ...nivel, muros };
}

/** Interior 405 × 456, muros de 15, altura 263. A ojo: dibujado de 400 × 450. */
export function cuartoDeBruno({ medido = false, aOjo = false } = {}): Nivel {
  const [ancho, largo] = aOjo ? [400, 450] : [405, 456];
  let n = nivelDesdePoligono(
    [
      { x: 0, y: 0 },
      { x: ancho, y: 0 },
      { x: ancho, y: largo },
      { x: 0, y: largo },
    ],
    15,
    medido,
  );
  n = { ...n, alturaGeneral: medida(263, medido), ambientes: [{ ...n.ambientes[0], nombre: "Cuarto" }] };
  if (!medido) return n;
  for (const [muro, valor] of [["m1", 405], ["m4", 456], ["m3", 405], ["m2", 456]] as const)
    n = medirLado(n, "amb1", muro, valor);
  return n;
}

/**
 * Dormitorio 300 × 400, baño 190 × 250 y pasillo 190 × 140; exteriores de 15
 * y tabiques de 10. A ojo: los mismos muros, ortogonales, con largos equivocados.
 */
export function casaDeEjemplo({ medida: medida_ = false, aOjo = false } = {}): Nivel {
  const X: Record<number, number> = aOjo ? { [-7.5]: 0, 305: 320, 507.5: 490 } : { [-7.5]: -7.5, 305: 305, 507.5: 507.5 };
  const Y: Record<number, number> = aOjo ? { [-7.5]: -7.5, 255: 240, 407.5: 420 } : { [-7.5]: -7.5, 255: 255, 407.5: 407.5 };
  const nodo = (id: string, x: number, y: number): NodoCaso => [id, X[x], Y[y]];
  let n = nivelDesdeEjes(
    [
      nodo("n1", -7.5, -7.5), // A
      nodo("n2", 305, -7.5), // E
      nodo("n3", 507.5, -7.5), // B
      nodo("n4", 507.5, 255), // H
      nodo("n5", 507.5, 407.5), // C
      nodo("n6", 305, 407.5), // F
      nodo("n7", -7.5, 407.5), // D
      nodo("n8", 305, 255), // G
    ],
    [
      ["m1", "n1", "n2", 15],
      ["m2", "n2", "n3", 15],
      ["m3", "n3", "n4", 15],
      ["m4", "n4", "n5", 15],
      ["m5", "n5", "n6", 15],
      ["m6", "n6", "n7", 15],
      ["m7", "n7", "n1", 15],
      ["m8", "n2", "n8", 10],
      ["m9", "n8", "n6", 10],
      ["m10", "n8", "n4", 10],
    ],
    medida_,
  );
  const nombres: [string, Punto][] = [
    ["Dormitorio", { x: 150, y: 200 }],
    ["Baño", { x: 400, y: 100 }],
    ["Pasillo", { x: 400, y: 330 }],
  ];
  const ambientes = nombres.map(([nombre, p]) => ({ ...n.ambientes.find((a) => a.id === ambienteEnPunto(n, p))!, nombre }));
  n = { ...n, ambientes, alturaGeneral: medida(250, medida_) };
  if (!medida_) return n;
  const [dormitorio, bano, pasillo] = ambientes.map((a) => a.id);
  const medidas: [string, string, number][] = [
    [dormitorio, "m1", 300],
    [dormitorio, "m7", 400],
    [dormitorio, "m6", 300],
    [dormitorio, "m8", 400],
    [bano, "m2", 190],
    [bano, "m3", 250],
    [bano, "m10", 190],
    [bano, "m8", 250],
    [pasillo, "m10", 190],
    [pasillo, "m4", 140],
    [pasillo, "m5", 190],
    [pasillo, "m9", 140],
  ];
  for (const [amb, muro, valor] of medidas) n = medirLado(n, amb, muro, valor);
  return n;
}

export const ambienteEnL = (): Nivel =>
  nivelDesdePoligono([
    { x: 0, y: 0 },
    { x: 300, y: 0 },
    { x: 300, y: 200 },
    { x: 500, y: 200 },
    { x: 500, y: 400 },
    { x: 0, y: 400 },
  ]);

export const ambienteEnU = (): Nivel =>
  nivelDesdePoligono([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 250 },
    { x: 400, y: 250 },
    { x: 400, y: 0 },
    { x: 600, y: 0 },
    { x: 600, y: 400 },
    { x: 0, y: 400 },
  ]);
