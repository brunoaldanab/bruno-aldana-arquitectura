// src/lib/plano/ambientes.ts
import {
  direccionCara,
  esquinaEntre,
  lineaCara,
  mismaCara,
  nodosDeCara,
  posicionNodo,
  siguienteCara,
  todasLasCaras,
} from "./caras";
import { siguienteId, type Ambiente, type Medida, type Nivel, type RefCara } from "./modelo";
import { areaConSigno, productoCruz, productoEscalar, resta, type Punto } from "./vector";

/**
 * Un lado es lo que Bruno mide con una sola cota: las caras seguidas y
 * alineadas de un ambiente, de esquina a esquina (ajuste 1). Su medida vive en
 * la primera cara del lado; las demás quedan en null.
 */
export type Lado = {
  caras: RefCara[];
  nodoInicio: string;
  nodoFin: string;
  nodosInternos: string[];
  inicio: Punto;
  fin: Punto;
  direccion: Punto;
  largo: number;
  medida: Medida | null;
};

const claveCara = (c: RefCara) => `${c.muroId}:${c.cara}`;
const numero = (id: string) => Number(id.replace(/\D/g, "")) || 0;

export const medidaDeCara = (nivel: Nivel, c: RefCara): Medida | null =>
  nivel.muros.find((m) => m.id === c.muroId)?.caras[c.cara] ?? null;

/** Dos caras seguidas pertenecen al mismo lado si van en la misma dirección sobre la misma recta. */
function alineadas(nivel: Nivel, a: RefCara, b: RefCara): boolean {
  const la = lineaCara(nivel, a);
  const lb = lineaCara(nivel, b);
  if (productoEscalar(la.direccion, lb.direccion) < 0.9999) return false;
  return Math.abs(productoCruz(la.direccion, resta(lb.punto, la.punto))) < 0.5;
}

/** Índices del contorno donde empieza un lado. */
function iniciosDeLado(nivel: Nivel, contorno: RefCara[]): number[] {
  const n = contorno.length;
  const inicios = contorno.map((_, j) => j).filter((j) => !alineadas(nivel, contorno[(j - 1 + n) % n], contorno[j]));
  return inicios.length ? inicios : [0];
}

/** Empieza el contorno en el lado cuya primera cara es del muro de número menor: orden estable. */
function canonico(nivel: Nivel, contorno: RefCara[]): RefCara[] {
  const inicios = iniciosDeLado(nivel, contorno);
  const peso = (c: RefCara) => numero(c.muroId) * 2 + (c.cara === "izquierda" ? 0 : 1);
  const s = inicios.reduce((mejor, j) => (peso(contorno[j]) < peso(contorno[mejor]) ? j : mejor), inicios[0]);
  return [...contorno.slice(s), ...contorno.slice(0, s)];
}

/**
 * Ciclos mínimos de caras con área negativa en pantalla: los que dejan el
 * interior a la izquierda. El ciclo de afuera da positivo y queda descartado.
 * Las caras de un muro suelto aparecen de ida y de vuelta en el mismo ciclo y
 * se sacan del contorno: no encierran nada.
 */
export function detectarContornos(nivel: Nivel): RefCara[][] {
  const visitadas = new Set<string>();
  const contornos: RefCara[][] = [];
  for (const cara of todasLasCaras(nivel)) {
    if (visitadas.has(claveCara(cara))) continue;
    const ciclo: RefCara[] = [];
    let actual = cara;
    while (!visitadas.has(claveCara(actual))) {
      visitadas.add(claveCara(actual));
      ciclo.push(actual);
      actual = siguienteCara(nivel, actual);
    }
    if (!mismaCara(actual, cara)) continue;
    const puntos = ciclo.map((c) => posicionNodo(nivel, nodosDeCara(nivel, c).inicio));
    if (areaConSigno(puntos) > -1) continue;
    const veces = new Map<string, number>();
    for (const c of ciclo) veces.set(c.muroId, (veces.get(c.muroId) ?? 0) + 1);
    const limpio = ciclo.filter((c) => veces.get(c.muroId) === 1);
    if (limpio.length >= 3) contornos.push(canonico(nivel, limpio));
  }
  return contornos;
}

export function ladosDeContorno(nivel: Nivel, contorno: RefCara[]): Lado[] {
  const n = contorno.length;
  if (n === 0) return [];
  const inicios = iniciosDeLado(nivel, contorno);
  return inicios.map((s, k) => {
    const siguiente = k + 1 < inicios.length ? inicios[k + 1] : inicios[0] + n;
    const caras = Array.from({ length: siguiente - s }, (_, i) => contorno[(s + i) % n]);
    const previa = contorno[(s - 1 + n) % n];
    const posterior = contorno[(s + caras.length) % n];
    const inicio = esquinaEntre(nivel, previa, caras[0], "sale");
    const fin = esquinaEntre(nivel, caras[caras.length - 1], posterior, "llega");
    const direccion = direccionCara(nivel, caras[0]);
    return {
      caras,
      nodoInicio: nodosDeCara(nivel, caras[0]).inicio,
      nodoFin: nodosDeCara(nivel, caras[caras.length - 1]).fin,
      nodosInternos: caras.slice(1).map((c) => nodosDeCara(nivel, c).inicio),
      inicio,
      fin,
      direccion,
      largo: productoEscalar(resta(fin, inicio), direccion),
      medida: medidaDeCara(nivel, caras[0]),
    };
  });
}

export function ladosDeAmbiente(nivel: Nivel, ambienteId: string): Lado[] {
  const ambiente = nivel.ambientes.find((a) => a.id === ambienteId);
  return ambiente ? ladosDeContorno(nivel, ambiente.contorno) : [];
}

export const claveLado = (lado: Lado): string => `${lado.nodoInicio}>${lado.nodoFin}`;

export const indiceLadoDeMuro = (nivel: Nivel, ambienteId: string, muroId: string): number =>
  ladosDeAmbiente(nivel, ambienteId).findIndex((l) => l.caras.some((c) => c.muroId === muroId));

const nodosDeContorno = (nivel: Nivel, contorno: RefCara[]) =>
  new Set(contorno.map((c) => nodosDeCara(nivel, c).inicio));

/**
 * Vuelve a detectar los ambientes de "nuevo" comparando con "anterior".
 * - Un ambiente conserva id, nombre y desnivel si comparte al menos la mitad
 *   de sus nodos con uno anterior: partir un muro o mover un nodo no lo cambia.
 * - La medida tomada de un lado sigue solo si hay un lado con los mismos
 *   extremos (ajuste 2). Si el lado cambió de verdad, la medida ya no es cierta.
 * Sin anterior (un nivel armado a mano), las medidas tomadas de cada lado se
 * juntan en su primera cara.
 */
export function actualizarAmbientes(anterior: Nivel | null, nuevo: Nivel): Nivel {
  const contornos = detectarContornos(nuevo);

  const previas = new Map<string, Medida>();
  const carasPrevias = new Set<string>();
  const fuentes = anterior ? anterior.ambientes.map((a) => a.contorno) : contornos;
  const nivelFuente = anterior ?? nuevo;
  for (const contorno of fuentes) {
    for (const lado of ladosDeContorno(nivelFuente, contorno)) {
      lado.caras.forEach((c) => carasPrevias.add(claveCara(c)));
      const tomada = lado.caras.map((c) => medidaDeCara(nivelFuente, c)).find((m) => m?.tomada);
      const valida = anterior ? (lado.medida?.tomada ? lado.medida : null) : tomada;
      if (valida) previas.set(claveLado(lado), valida);
    }
  }

  const carasNuevas = new Map<string, Medida | null>();
  for (const contorno of contornos) {
    for (const lado of ladosDeContorno(nuevo, contorno)) {
      lado.caras.forEach((c, i) => carasNuevas.set(claveCara(c), i === 0 ? (previas.get(claveLado(lado)) ?? null) : null));
    }
  }

  const muros = nuevo.muros.map((m) => {
    const caras = { ...m.caras };
    for (const cara of ["izquierda", "derecha"] as const) {
      const clave = claveCara({ muroId: m.id, cara });
      if (carasNuevas.has(clave)) caras[cara] = carasNuevas.get(clave)!;
      // Una cara que dejó de encerrar un ambiente conserva el valor, pero ya no es la medida de un lado.
      else if (carasPrevias.has(clave) && caras[cara]?.tomada) caras[cara] = { ...caras[cara]!, tomada: false };
    }
    return { ...m, caras };
  });
  const conMuros: Nivel = { ...nuevo, muros };

  const viejos = (anterior?.ambientes ?? []).map((a) => ({ a, nodos: nodosDeContorno(anterior!, a.contorno) }));
  const nuevos = contornos.map((c) => nodosDeContorno(conMuros, c));
  const pares: { j: number; i: number; comunes: number }[] = [];
  viejos.forEach((v, j) =>
    nuevos.forEach((nodos, i) => {
      const comunes = [...nodos].filter((x) => v.nodos.has(x)).length;
      if (comunes > 0 && comunes * 2 >= v.nodos.size) pares.push({ j, i, comunes });
    }),
  );
  pares.sort((p, q) => q.comunes - p.comunes || p.j - q.j || p.i - q.i);
  const deViejo = new Map<number, number>();
  const usados = new Set<number>();
  for (const p of pares) {
    if (deViejo.has(p.j) || usados.has(p.i)) continue;
    deViejo.set(p.j, p.i);
    usados.add(p.i);
  }

  const ambientes: Ambiente[] = [];
  viejos.forEach((v, j) => {
    const i = deViejo.get(j);
    if (i !== undefined) ambientes.push({ ...v.a, contorno: contornos[i] });
  });
  const ids = [...(anterior?.ambientes ?? []).map((a) => a.id)];
  contornos.forEach((contorno, i) => {
    if (usados.has(i)) return;
    const id = siguienteId(ids, "amb");
    ids.push(id);
    ambientes.push({ id, nombre: `Ambiente ${numero(id)}`, contorno, desnivelPiso: 0 });
  });

  return { ...conMuros, ambientes };
}
