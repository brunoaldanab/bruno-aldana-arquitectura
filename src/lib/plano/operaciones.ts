// src/lib/plano/operaciones.ts
import { actualizarAmbientes, ladosDeAmbiente } from "./ambientes";
import { direccionMuro, esquinasCara, largoCara, posicionNodo } from "./caras";
import { ESPESOR_POR_DEFECTO, medida, siguienteId, type Muro, type NombreCara, type Nivel } from "./modelo";
import { resolverNivel } from "./resolver";
import { ambienteEnPunto } from "./superficie";
import { distancia, interseccion, por, productoEscalar, redondearPunto, resta, suma, unitario, type Punto } from "./vector";

/**
 * Las ediciones del plano. Todas reciben un nivel y devuelven uno nuevo sin
 * tocar el anterior, para que el historial sea una lista de estados. Las que
 * cambian muros terminan en `recalcular`: se vuelven a detectar los ambientes
 * y se imponen las medidas.
 */

export type Extremo = { nodoId: string } | Punto;

const RADIO_IMAN = 20;
const TOLERANCIA_ANGULO = (5 * Math.PI) / 180;

/**
 * Con el modo recto, el muro sale horizontal o vertical: se conserva la
 * componente más larga del recorrido y se anula la otra. En el celular apuntar
 * a mano alzada no da, y los muros de una casa son casi siempre ortogonales.
 */
export function enRecto(origen: Punto | null, toque: Punto): Punto {
  if (!origen) return toque;
  const v = resta(toque, origen);
  return Math.abs(v.x) >= Math.abs(v.y) ? { x: toque.x, y: origen.y } : { x: origen.x, y: toque.y };
}

/** Lo que hace el dedo al dibujar: engancha a un nodo, ajusta el ángulo y se pega al eje de un muro. */
export function ajustarPunto(
  nivel: Nivel,
  origen: Punto | null,
  toque: Punto,
  opciones: { angulo?: boolean; radio?: number; recto?: boolean } = {},
): { punto: Punto; nodoId: string | null; muroId: string | null } {
  const radio = opciones.radio ?? RADIO_IMAN;
  const cercano = nivel.nodos
    .map((n) => ({ n, d: distancia(n, toque) }))
    .filter((c) => c.d <= radio)
    .sort((a, b) => a.d - b.d)[0];
  if (cercano) return { punto: { x: cercano.n.x, y: cercano.n.y }, nodoId: cercano.n.id, muroId: null };

  let punto = toque;
  // El imán al nodo manda sobre el modo recto: así el recorrido siempre puede cerrar.
  if (origen && opciones.recto) {
    punto = enRecto(origen, toque);
  } else if (origen && opciones.angulo !== false) {
    const v = resta(toque, origen);
    const angulo = Math.atan2(v.y, v.x);
    const redondo = Math.round(angulo / (Math.PI / 4)) * (Math.PI / 4);
    if (Math.abs(angulo - redondo) <= TOLERANCIA_ANGULO) {
      const u = { x: Math.cos(redondo), y: Math.sin(redondo) };
      punto = suma(origen, por(u, productoEscalar(v, u)));
    }
  }
  const sobreMuro = muroBajoPunto(nivel, punto, radio);
  if (sobreMuro) return { punto: redondearPunto(sobreMuro.punto), nodoId: null, muroId: sobreMuro.muroId };
  return { punto: redondearPunto(punto), nodoId: null, muroId: null };
}

/** El muro cuyo eje pasa a menos de "radio" del punto, lejos de sus puntas. */
function muroBajoPunto(nivel: Nivel, p: Punto, radio: number, excluir: Set<string> = new Set()): { muroId: string; punto: Punto } | null {
  for (const m of nivel.muros) {
    if (excluir.has(m.id)) continue;
    const a = posicionNodo(nivel, m.desde);
    const b = posicionNodo(nivel, m.hasta);
    const u = unitario(resta(b, a));
    const t = productoEscalar(resta(p, a), u);
    const proyectado = suma(a, por(u, t));
    if (t > 1 && t < distancia(a, b) - 1 && distancia(proyectado, p) <= radio) return { muroId: m.id, punto: proyectado };
  }
  return null;
}

/** Vuelve a detectar ambientes, reubica lo que colgaba de un ambiente que ya no existe y aplica las medidas. */
export function recalcular(anterior: Nivel, nuevo: Nivel): Nivel {
  let n = actualizarAmbientes(anterior, nuevo);
  const existe = new Set(n.ambientes.map((a) => a.id));
  const muros = new Set(n.muros.map((m) => m.id));
  // Una zona cuyo ambiente cambió o desapareció se reasigna por dónde está; si no
  // cae en ninguno queda sin ambiente, pero no se borra: la medida ya está tomada.
  const techos = n.techos.map((t) => {
    if (t.ambienteId && existe.has(t.ambienteId)) return t;
    const centro = t.contorno.reduce((s, p) => suma(s, por(p, 1 / t.contorno.length)), { x: 0, y: 0 });
    return { ...t, ambienteId: ambienteEnPunto(n, centro) };
  });
  const molduras = n.molduras.flatMap((m) => {
    const caras = m.caras.filter((c) => muros.has(c.muroId));
    if (caras.length === 0) return [];
    if (existe.has(m.ambienteId)) return [{ ...m, caras }];
    const duena = n.ambientes.find((a) => caras.every((c) => a.contorno.some((x) => x.muroId === c.muroId && x.cara === c.cara)));
    return duena ? [{ ...m, caras, ambienteId: duena.id }] : [];
  });
  n = {
    ...n,
    techos,
    molduras,
    aberturas: n.aberturas.filter((a) => muros.has(a.muroId)),
    electricos: n.electricos.filter((e) => muros.has(e.muroId)),
  };
  return acomodarEnSusCaras(resolverNivel(n).nivel);
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Al estirar o acortar un muro, lo que estaba encima puede quedar colgando
 * afuera. Lo que todavía era dibujado se acomoda solo; lo que Bruno ya midió no
 * se toca, porque cambiarle el número a una medida tomada sería inventar: eso
 * queda como error en la lista de lo que falta.
 */
function acomodarEnSusCaras(nivel: Nivel): Nivel {
  const largoDe = new Map<string, number>();
  const largo = (muroId: string, cara: NombreCara) => {
    const clave = `${muroId}:${cara}`;
    if (!largoDe.has(clave)) largoDe.set(clave, largoCara(nivel, { muroId, cara }));
    return largoDe.get(clave)!;
  };

  const aberturas = nivel.aberturas.map((a) => {
    if (a.desde.tomada) return a;
    const tope = Math.max(0, Math.floor(largo(a.muroId, a.cara) - a.ancho.valor));
    const desde = limitar(a.desde.valor, 0, tope);
    return desde === a.desde.valor ? a : { ...a, desde: { ...a.desde, valor: desde } };
  });
  const electricos = nivel.electricos.map((e) => {
    if (e.desde.tomada) return e;
    const desde = limitar(e.desde.valor, 0, Math.max(0, Math.floor(largo(e.muroId, e.cara))));
    return desde === e.desde.valor ? e : { ...e, desde: { ...e.desde, valor: desde } };
  });
  const cambio = aberturas.some((a, i) => a !== nivel.aberturas[i]) || electricos.some((e, i) => e !== nivel.electricos[i]);
  return cambio ? { ...nivel, aberturas, electricos } : nivel;
}

/** Inserta un nodo sobre el eje del muro. El primer tramo conserva el id; el segundo es un muro nuevo. */
function partirEnPunto(nivel: Nivel, muroId: string, puntoEje: Punto): { nivel: Nivel; nodoId: string; nuevoMuroId: string } {
  const m = nivel.muros.find((x) => x.id === muroId)!;
  const nodoId = siguienteId(nivel.nodos.map((x) => x.id), "n");
  const nuevoMuroId = siguienteId(nivel.muros.map((x) => x.id), "m");
  const X = redondearPunto(puntoEje);
  const u = direccionMuro(nivel, muroId);

  // Una cara que no encerraba ningún ambiente no tiene lado que la cuide: su medida ya no corresponde a ningún tramo.
  const enAmbiente = (cara: NombreCara) => nivel.ambientes.some((a) => a.contorno.some((c) => c.muroId === muroId && c.cara === cara));
  const caras = {
    izquierda: enAmbiente("izquierda") ? m.caras.izquierda : null,
    derecha: enAmbiente("derecha") ? m.caras.derecha : null,
  };
  const primero: Muro = { ...m, hasta: nodoId, caras };
  const segundo: Muro = { ...m, id: nuevoMuroId, desde: nodoId, caras: { ...caras } };

  // Cada abertura va al tramo que contiene su centro, con "desde" medido desde la esquina nueva (ajustes 5 y 6).
  const aberturas = nivel.aberturas.map((a) => {
    if (a.muroId !== muroId) return a;
    const corte = productoEscalar(resta(X, esquinasCara(nivel, { muroId, cara: a.cara }).desde), u);
    if (a.desde.valor + a.ancho.valor / 2 <= corte) return a;
    return { ...a, muroId: nuevoMuroId, desde: { ...a.desde, valor: Math.round(a.desde.valor - corte) } };
  });

  const muros = nivel.muros.flatMap((x) => (x.id === muroId ? [primero, segundo] : [x]));
  return {
    nivel: { ...nivel, nodos: [...nivel.nodos, { id: nodoId, ...X }], muros, aberturas },
    nodoId,
    nuevoMuroId,
  };
}

/** Parte el muro a "distancia" cm de la esquina del nodo "desde", medidos sobre la cara indicada. */
export function partirMuro(nivel: Nivel, muroId: string, cara: NombreCara, distancia_: number): { nivel: Nivel; nodoId: string } {
  const m = nivel.muros.find((x) => x.id === muroId)!;
  const u = direccionMuro(nivel, muroId);
  const sobreCara = suma(esquinasCara(nivel, { muroId, cara }).desde, por(u, distancia_));
  const a = posicionNodo(nivel, m.desde);
  const X = suma(a, por(u, productoEscalar(resta(sobreCara, a), u)));
  const r = partirEnPunto(nivel, muroId, X);
  return { nivel: recalcular(nivel, r.nivel), nodoId: r.nodoId };
}

/** Encuentra o crea el nodo de un extremo; si cae sobre el eje de un muro, lo parte (T). */
function nodoDeExtremo(nivel: Nivel, extremo: Extremo): { nivel: Nivel; nodoId: string } {
  if ("nodoId" in extremo) return { nivel, nodoId: extremo.nodoId };
  const existente = nivel.nodos.find((n) => distancia(n, extremo) <= 0.5);
  if (existente) return { nivel, nodoId: existente.id };
  const muro = muroBajoPunto(nivel, extremo, 1);
  if (muro) return partirEnPunto(nivel, muro.muroId, muro.punto);
  const nodoId = siguienteId(nivel.nodos.map((n) => n.id), "n");
  return { nivel: { ...nivel, nodos: [...nivel.nodos, { id: nodoId, ...redondearPunto(extremo) }] }, nodoId };
}

export function agregarMuro(
  nivel: Nivel,
  desde: Extremo,
  hasta: Extremo,
  espesor = ESPESOR_POR_DEFECTO,
): { nivel: Nivel; muroId: string; nodoHasta: string } {
  const a = nodoDeExtremo(nivel, desde);
  const b = nodoDeExtremo(a.nivel, hasta);
  const muroId = siguienteId(b.nivel.muros.map((m) => m.id), "m");
  const muro: Muro = {
    id: muroId,
    desde: a.nodoId,
    hasta: b.nodoId,
    espesor: medida(espesor),
    altura: null,
    caras: { izquierda: null, derecha: null },
  };
  const nuevo = { ...b.nivel, muros: [...b.nivel.muros, muro] };
  return { nivel: recalcular(nivel, nuevo), muroId, nodoHasta: b.nodoId };
}

/** Carga la cota de un lado (o la borra con null, y vuelve a ser dibujada) y rehace el plano. */
export function cargarMedidaLado(nivel: Nivel, ambienteId: string, indice: number, valor: number | null): Nivel {
  const lado = ladosDeAmbiente(nivel, ambienteId)[indice];
  if (!lado) return nivel;
  const muros = nivel.muros.map((m) => {
    const caras = { ...m.caras };
    lado.caras.forEach((c, i) => {
      if (c.muroId !== m.id) return;
      caras[c.cara] = i > 0 ? null : valor === null ? medida(lado.largo) : medida(valor, true);
    });
    return { ...m, caras };
  });
  return resolverNivel({ ...nivel, muros }).nivel;
}

const conMuro = (nivel: Nivel, muroId: string, cambio: (m: Muro) => Muro): Nivel => ({
  ...nivel,
  muros: nivel.muros.map((m) => (m.id === muroId ? cambio(m) : m)),
});

/** El espesor corre las caras: puede cambiar esquinas y lados, por eso se recalcula todo. */
export const cargarEspesor = (nivel: Nivel, muroId: string, valor: number): Nivel =>
  recalcular(nivel, conMuro(nivel, muroId, (m) => ({ ...m, espesor: medida(valor, true) })));

/** null vuelve a la altura general del nivel. */
export const cargarAlturaMuro = (nivel: Nivel, muroId: string, valor: number | null): Nivel =>
  conMuro(nivel, muroId, (m) => ({ ...m, altura: valor === null ? null : medida(valor, true) }));

export const cargarAlturaGeneral = (nivel: Nivel, valor: number): Nivel => ({ ...nivel, alturaGeneral: medida(valor, true) });

/**
 * Mover un nodo con el dedo. Mientras se arrastra ("resolver" en false) solo
 * cambia el dibujo; al soltar, las medidas tomadas se vuelven a imponer.
 */
export function moverNodo(nivel: Nivel, nodoId: string, p: Punto, resolver = true): Nivel {
  const nuevo = { ...nivel, nodos: nivel.nodos.map((n) => (n.id === nodoId ? { id: n.id, ...redondearPunto(p) } : n)) };
  return resolver ? recalcular(nivel, nuevo) : actualizarAmbientes(nivel, nuevo);
}

/** Borra el muro y sus aberturas; los nodos que quedan sin muros también se van. */
export function borrarMuro(nivel: Nivel, muroId: string): Nivel {
  const muros = nivel.muros.filter((m) => m.id !== muroId);
  const usados = new Set(muros.flatMap((m) => [m.desde, m.hasta]));
  const nuevo: Nivel = {
    ...nivel,
    muros,
    nodos: nivel.nodos.filter((n) => usados.has(n.id)),
    aberturas: nivel.aberturas.filter((a) => a.muroId !== muroId),
  };
  return recalcular(nivel, nuevo);
}

/** Los muros que nacen o mueren en ese nodo. */
export const murosDelNodo = (nivel: Nivel, nodoId: string): string[] =>
  nivel.muros.filter((m) => m.desde === nodoId || m.hasta === nodoId).map((m) => m.id);

/** Junta dos nodos en uno solo: los muros del primero pasan al segundo y el que queda sin largo se va. */
export function unirNodos(nivel: Nivel, desdeId: string, haciaId: string): Nivel {
  if (desdeId === haciaId || !nivel.nodos.some((n) => n.id === haciaId)) return nivel;
  const muros = nivel.muros
    .map((m) => ({
      ...m,
      desde: m.desde === desdeId ? haciaId : m.desde,
      hasta: m.hasta === desdeId ? haciaId : m.hasta,
    }))
    .filter((m) => m.desde !== m.hasta);
  const usados = new Set(muros.flatMap((m) => [m.desde, m.hasta]));
  return recalcular(nivel, { ...nivel, muros, nodos: nivel.nodos.filter((n) => usados.has(n.id)) });
}

/** La unión en T: el nodo llega al eje de otro muro, que se parte ahí. */
export function unirNodoConMuro(nivel: Nivel, nodoId: string, muroId: string, punto: Punto): Nivel {
  const r = partirEnPunto(nivel, muroId, punto);
  const conNodoMovido = {
    ...r.nivel,
    nodos: r.nivel.nodos.map((n) => (n.id === nodoId ? { id: n.id, ...redondearPunto(punto) } : n)),
  };
  return unirNodos(conNodoMovido, nodoId, r.nodoId);
}

/**
 * Soltar un nodo arrastrado: si cae encima de otro nodo los junta, si cae sobre
 * el eje de otro muro lo parte y se engancha ahí, y si no, lo deja donde quedó.
 * Es lo que hace que un recorrido dibujado a dedo termine cerrando.
 */
export function soltarNodo(nivel: Nivel, nodoId: string, p: Punto, radio: number): Nivel {
  const propios = new Set(murosDelNodo(nivel, nodoId));
  const cercano = nivel.nodos
    .filter((n) => n.id !== nodoId)
    .map((n) => ({ n, d: distancia(n, p) }))
    .filter((c) => c.d <= radio)
    .sort((a, b) => a.d - b.d)[0];
  if (cercano) return unirNodos(moverNodo(nivel, nodoId, cercano.n, false), nodoId, cercano.n.id);

  const sobreMuro = muroBajoPunto(nivel, p, radio, propios);
  if (sobreMuro) return unirNodoConMuro(nivel, nodoId, sobreMuro.muroId, sobreMuro.punto);

  return moverNodo(nivel, nodoId, p, true);
}

export type MotivoEstirar = "paralelos" | "fuera";

/**
 * El "estirar hasta" de Revit: el muro crece o se recorta sobre su propia
 * dirección hasta encontrarse con el eje del otro, y ahí se unen. Se mueve la
 * punta más cercana al cruce; la otra no se toca.
 */
export function estirarMuroHasta(nivel: Nivel, muroId: string, objetivoId: string): { nivel: Nivel } | { motivo: MotivoEstirar } {
  const m = nivel.muros.find((x) => x.id === muroId);
  const o = nivel.muros.find((x) => x.id === objetivoId);
  if (!m || !o || m.id === o.id) return { motivo: "paralelos" };
  const a = posicionNodo(nivel, m.desde);
  const b = posicionNodo(nivel, m.hasta);
  const c = posicionNodo(nivel, o.desde);
  const d = posicionNodo(nivel, o.hasta);
  const corte = interseccion(a, resta(b, a), c, resta(d, c));
  if (!corte) return { motivo: "paralelos" };

  // El cruce tiene que caer sobre el muro objetivo: si no, el otro también habría que estirarlo.
  const u = unitario(resta(d, c));
  const t = productoEscalar(resta(corte, c), u);
  const largoObjetivo = distancia(c, d);
  if (t < -0.5 || t > largoObjetivo + 0.5) return { motivo: "fuera" };

  const nodoId = distancia(a, corte) <= distancia(b, corte) ? m.desde : m.hasta;
  const X = redondearPunto(corte);
  const movido = moverNodo(nivel, nodoId, X, false);
  // Sobre una punta del objetivo se juntan los nodos; en el medio se parte el muro.
  if (t <= 0.5) return { nivel: unirNodos(movido, nodoId, o.desde) };
  if (t >= largoObjetivo - 0.5) return { nivel: unirNodos(movido, nodoId, o.hasta) };
  return { nivel: unirNodoConMuro(nivel, nodoId, objetivoId, X) };
}

/**
 * El "alinear" de Revit: el muro se corre de costado, sin girar ni cambiar de
 * largo, hasta quedar sobre la misma línea que el otro. Solo tiene sentido
 * entre muros que ya van en la misma dirección.
 */
export function alinearMuroCon(nivel: Nivel, muroId: string, objetivoId: string): { nivel: Nivel } | { motivo: "no-paralelos" } {
  const m = nivel.muros.find((x) => x.id === muroId);
  const o = nivel.muros.find((x) => x.id === objetivoId);
  if (!m || !o || m.id === o.id) return { motivo: "no-paralelos" };
  const a = posicionNodo(nivel, m.desde);
  const b = posicionNodo(nivel, m.hasta);
  const c = posicionNodo(nivel, o.desde);
  const u = unitario(resta(posicionNodo(nivel, o.hasta), c));
  const v = unitario(resta(b, a));
  // Más de 15 grados de diferencia ya no es "el mismo muro torcido": es otro muro.
  if (Math.abs(productoEscalar(u, v)) < Math.cos((15 * Math.PI) / 180)) return { motivo: "no-paralelos" };

  // Cada punta se proyecta sobre la línea del otro muro; el corrimiento es el promedio,
  // así el muro se apoya en la línea sin girar aunque no fuera exactamente paralelo.
  const sobreLinea = (p: Punto) => suma(c, por(u, productoEscalar(resta(p, c), u)));
  const corrimiento = por(suma(resta(sobreLinea(a), a), resta(sobreLinea(b), b)), 0.5);
  const mover = new Set([m.desde, m.hasta]);
  const nodos = nivel.nodos.map((n) => (mover.has(n.id) ? { id: n.id, ...redondearPunto(suma(n, corrimiento)) } : n));
  return { nivel: recalcular(nivel, { ...nivel, nodos }) };
}

export const renombrarAmbiente = (nivel: Nivel, ambienteId: string, nombre: string): Nivel => ({
  ...nivel,
  ambientes: nivel.ambientes.map((a) => (a.id === ambienteId ? { ...a, nombre } : a)),
});

export const cambiarDesnivel = (nivel: Nivel, ambienteId: string, cm: number): Nivel => ({
  ...nivel,
  ambientes: nivel.ambientes.map((a) => (a.id === ambienteId ? { ...a, desnivelPiso: Math.round(cm) } : a)),
});
