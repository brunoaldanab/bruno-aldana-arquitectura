// src/lib/plano/resolver.ts
import { ladosDeContorno, type Lado } from "./ambientes";
import { TOLERANCIA_CM, medida, type Medida, type Nivel } from "./modelo";
import { largo, por, productoEscalar, redondear, redondearPunto, resta, suma, unitario, type Punto } from "./vector";

/**
 * "Las medidas mandan". Cada ambiente se recorre lado por lado con la
 * dirección del dibujo y el largo medido. Lo que no cierra se trata en tres
 * pasos:
 * 1. Los lados dibujados absorben la diferencia con el dibujo, cambiando lo
 *    menos posible cada uno (ajuste 3).
 * 2. Lo que queda es el error entre medidas tomadas. Hasta 2 cm se reparte en
 *    el largo de los lados, en proporción a su largo y sin girar ningún muro
 *    (ajuste 13): así resolver dos veces da el mismo plano.
 * 3. Si pasa de 2 cm, el ambiente no se mueve y se informa el recorrido abierto
 *    (ajuste 14): el error queda a la vista y nada se esconde.
 * Los ambientes con medidas se resuelven primero, en el orden de la lista; sus
 * esquinas quedan fijas para los siguientes.
 */

export type EstadoCierre = "cerrado" | "ajustado" | "abierto";

export type Cierre = {
  ambienteId: string;
  medido: boolean;
  estado: EstadoCierre;
  /** cm, con un decimal */
  error: number;
  /** la esquina donde el recorrido tendría que cerrar */
  esquina: Punto;
  /** donde termina el recorrido con las medidas cargadas */
  finRecorrido: Punto;
  /** esquinas del recorrido, para dibujar el hueco en rojo */
  recorrido: Punto[];
};

export const estadoCierre = (error: number): EstadoCierre =>
  error < 0.5 ? "cerrado" : error <= TOLERANCIA_CM ? "ajustado" : "abierto";

/**
 * Cambios de largo de norma mínima (pesada) para que Σ δᵢ·uᵢ = g.
 * Si las direcciones no alcanzan a cubrir g, devuelve lo que no se pudo absorber.
 */
function repartir(direcciones: Punto[], pesos: number[], g: Punto): { deltas: number[]; residuo: Punto } {
  let a = 0;
  let b = 0;
  let c = 0;
  direcciones.forEach((u, i) => {
    a += pesos[i] * u.x * u.x;
    b += pesos[i] * u.x * u.y;
    c += pesos[i] * u.y * u.y;
  });
  const traza = a + c;
  const det = a * c - b * b;
  let lambda: Punto = { x: 0, y: 0 };
  if (traza > 1e-12 && det > 1e-9 * traza * traza) {
    lambda = { x: (c * g.x - b * g.y) / det, y: (-b * g.x + a * g.y) / det };
  } else if (traza > 1e-12) {
    // Todas paralelas: solo se puede absorber la parte de g en esa dirección.
    const v = a >= c ? unitario({ x: a, y: b }) : unitario({ x: b, y: c });
    lambda = por(v, productoEscalar(v, g) / traza);
  }
  const deltas = direcciones.map((u, i) => pesos[i] * productoEscalar(u, lambda));
  const absorbido = direcciones.reduce((s, u, i) => suma(s, por(u, deltas[i])), { x: 0, y: 0 });
  return { deltas, residuo: resta(g, absorbido) };
}

type Resultado = {
  cierre: Cierre;
  /** largos finales por índice de lado, solo si el ambiente se aplica */
  largos: number[] | null;
  inicios: Punto[];
};

function resolverAmbiente(
  ambienteId: string,
  lados: Lado[],
  original: Map<string, Punto>,
  posiciones: Map<string, Punto>,
  fijos: Set<string>,
): Resultado {
  const n = lados.length;
  const medido = lados.some((l) => l.medida?.tomada);
  const k = lados.map((l, i) => resta(lados[(i + 1) % n].inicio, l.fin));
  const offset = lados.map((l) => resta(original.get(l.nodoInicio)!, l.inicio));
  const inicioFijo = (i: number) => resta(posiciones.get(lados[i].nodoInicio)!, offset[i]);

  let anclas = lados.map((_, i) => i).filter((i) => fijos.has(lados[i].nodoInicio));
  const sinMover: Resultado = {
    cierre: { ambienteId, medido, estado: "cerrado", error: 0, esquina: lados[0].inicio, finRecorrido: lados[0].inicio, recorrido: [] },
    largos: null,
    inicios: [],
  };
  if (anclas.length === 0) {
    // Nada fijo y nada medido: el ambiente sigue su dibujo.
    if (!medido) return sinMover;
    anclas = [0];
  }

  const largos = lados.map((l) => (l.medida?.tomada ? l.medida.valor : l.largo));
  const inicios: Punto[] = lados.map((l) => l.inicio);
  let peor: Cierre | null = null;
  let abierto = false;

  anclas.forEach((a, p) => {
    const b = anclas[(p + 1) % anclas.length];
    const cantidad = anclas.length === 1 ? n : (b - a + n) % n;
    const cadena = Array.from({ length: cantidad }, (_, j) => (a + j) % n);
    const desde = inicioFijo(a);
    const hasta = inicioFijo(b);

    // Lo que el tramo tiene que recorrer, descontados los escalones fijos entre lados.
    let g = resta(hasta, desde);
    for (const i of cadena) g = resta(resta(g, k[i]), por(lados[i].direccion, largos[i]));

    const dibujados = cadena.filter((i) => !lados[i].medida?.tomada);
    const absorcion = repartir(
      dibujados.map((i) => lados[i].direccion),
      dibujados.map(() => 1),
      g,
    );
    dibujados.forEach((i, j) => (largos[i] += absorcion.deltas[j]));

    const recorrido: Punto[] = [];
    let punto = desde;
    for (const i of cadena) {
      recorrido.push(punto);
      punto = suma(suma(punto, por(lados[i].direccion, largos[i])), k[i]);
    }
    recorrido.push(punto);
    const error = redondear(largo(absorcion.residuo));
    let estado = estadoCierre(error);

    if (estado !== "abierto" && largo(absorcion.residuo) >= 0.05) {
      const reparto = repartir(
        cadena.map((i) => lados[i].direccion),
        cadena.map((i) => Math.max(Math.abs(largos[i]), 1)),
        absorcion.residuo,
      );
      cadena.forEach((i, j) => (largos[i] += reparto.deltas[j]));
      if (largo(reparto.residuo) > 0.05) estado = "abierto";
    }

    let actual = desde;
    for (const i of cadena) {
      inicios[i] = actual;
      actual = suma(suma(actual, por(lados[i].direccion, largos[i])), k[i]);
    }

    const cierre: Cierre = { ambienteId, medido, estado, error, esquina: hasta, finRecorrido: punto, recorrido };
    if (estado === "abierto") abierto = true;
    if (!peor || error > peor.error || (estado === "abierto" && peor.estado !== "abierto")) peor = cierre;
  });

  const cierre = { ...peor!, estado: abierto ? ("abierto" as const) : peor!.estado };
  return { cierre, largos: abierto ? null : largos, inicios };
}

export function resolverNivel(nivel: Nivel): { nivel: Nivel; cierres: Cierre[] } {
  const original = new Map(nivel.nodos.map((x) => [x.id, { x: x.x, y: x.y }]));
  const posiciones = new Map(original);
  const fijos = new Set<string>();
  const lados = new Map(nivel.ambientes.map((a) => [a.id, ladosDeContorno(nivel, a.contorno)]));
  const medidos = nivel.ambientes.filter((a) => lados.get(a.id)!.some((l) => l.medida?.tomada));
  const orden = [...medidos, ...nivel.ambientes.filter((a) => !medidos.includes(a))];

  const cierres = new Map<string, Cierre>();
  const dibujadas = new Map<string, Medida>();

  for (const ambiente of orden) {
    const ls = lados.get(ambiente.id)!;
    if (ls.length === 0) continue;
    const r = resolverAmbiente(ambiente.id, ls, original, posiciones, fijos);
    cierres.set(ambiente.id, r.cierre);
    const largos = r.largos ?? ls.map((l) => l.largo);

    if (r.largos) {
      ls.forEach((l, i) => {
        const inicio = r.inicios[i];
        const offset = resta(original.get(l.nodoInicio)!, l.inicio);
        if (!fijos.has(l.nodoInicio)) posiciones.set(l.nodoInicio, suma(inicio, offset));
        // Los nodos del medio de un lado conservan su proporción y no quedan fijos (ajuste 1).
        for (const nodo of l.nodosInternos) {
          if (fijos.has(nodo)) continue;
          const d = resta(original.get(nodo)!, l.inicio);
          const avance = productoEscalar(d, l.direccion);
          const t = l.largo !== 0 ? avance / l.largo : 0;
          const costado = resta(d, por(l.direccion, avance));
          posiciones.set(nodo, suma(suma(inicio, por(l.direccion, t * largos[i])), costado));
        }
      });
      ls.forEach((l) => fijos.add(l.nodoInicio));
    }

    ls.forEach((l, i) => {
      if (!l.medida?.tomada) dibujadas.set(`${l.caras[0].muroId}:${l.caras[0].cara}`, medida(largos[i], false));
    });
  }

  const nodos = nivel.nodos.map((x) => ({ id: x.id, ...redondearPunto(posiciones.get(x.id)!) }));
  const muros = nivel.muros.map((m) => {
    const izquierda = dibujadas.get(`${m.id}:izquierda`);
    const derecha = dibujadas.get(`${m.id}:derecha`);
    if (!izquierda && !derecha) return m;
    return { ...m, caras: { izquierda: izquierda ?? m.caras.izquierda, derecha: derecha ?? m.caras.derecha } };
  });

  return {
    nivel: { ...nivel, nodos, muros },
    cierres: nivel.ambientes.filter((a) => cierres.has(a.id)).map((a) => cierres.get(a.id)!),
  };
}
