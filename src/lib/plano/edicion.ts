// src/lib/plano/edicion.ts
import { ladosDeAmbiente } from "./ambientes";
import { distanciaEnCara, largoCara, posicionNodo } from "./caras";
import { agregarAbertura } from "./elementos";
import { nivelVacio, siguienteIdNivel, type Nivel, type Relevamiento, type TipoAbertura, type ZonaTecho } from "./modelo";
import { cargarMedidaLado } from "./operaciones";
import { caraConAmbiente, muroCercano } from "./toque";
import { distancia, por, productoEscalar, redondearPunto, resta, suma, unitario, type Punto } from "./vector";

/**
 * Las ediciones que pide la pantalla y que el motor no tenía: colocar una
 * abertura con un toque, arrastrarla y cargar un lado eligiendo qué punta queda
 * quieta. Todas son puras, como el resto del motor.
 */

export const MEDIDAS_ABERTURA: Record<TipoAbertura, { ancho: number; alto: number; antepecho?: number }> = {
  puerta: { ancho: 90, alto: 210 },
  ventana: { ancho: 150, alto: 120, antepecho: 90 },
  vano: { ancho: 90, alto: 210 },
};

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Coloca la abertura centrada donde tocó el dedo, del lado del ambiente, sin salirse de la cara. */
export function colocarAbertura(
  nivel: Nivel,
  tipo: TipoAbertura,
  toque: Punto,
  radio: number,
  codigosUsados: string[] = [],
): { nivel: Nivel; id: string; codigo: string } | null {
  const muroId = muroCercano(nivel, toque, radio);
  if (!muroId) return null;
  const { cara } = caraConAmbiente(nivel, muroId, toque);
  const ref = { muroId, cara };
  const largo = largoCara(nivel, ref);
  const base = MEDIDAS_ABERTURA[tipo];
  const ancho = Math.max(1, Math.min(base.ancho, Math.floor(largo)));
  const desde = limitar(Math.round(distanciaEnCara(nivel, ref, toque) - ancho / 2), 0, Math.max(0, Math.floor(largo - ancho)));
  return agregarAbertura(nivel, { tipo, muroId, cara, desde, ancho, alto: base.alto, antepecho: base.antepecho }, codigosUsados);
}

/** Arrastrar corre la abertura sobre su cara de a 1 cm. Lo arrastrado es dibujado: la medida de láser se carga aparte. */
export function arrastrarAbertura(nivel: Nivel, id: string, p: Punto): Nivel {
  const a = nivel.aberturas.find((x) => x.id === id);
  if (!a) return nivel;
  const ref = { muroId: a.muroId, cara: a.cara };
  const largo = largoCara(nivel, ref);
  const desde = limitar(Math.round(distanciaEnCara(nivel, ref, p) - a.ancho.valor / 2), 0, Math.max(0, Math.floor(largo - a.ancho.valor)));
  if (desde === a.desde.valor) return nivel;
  return { ...nivel, aberturas: nivel.aberturas.map((x) => (x.id === id ? { ...x, desde: { valor: desde, tomada: false } } : x)) };
}

/** Corre todo el nivel: nodos, columnas, zonas de techo y vigas. La forma no cambia. */
export function trasladarNivel(nivel: Nivel, d: Punto): Nivel {
  const mover = (p: Punto) => redondearPunto(suma(p, d));
  return {
    ...nivel,
    nodos: nivel.nodos.map((n) => ({ id: n.id, ...mover(n) })),
    columnas: nivel.columnas.map((c) => ({ ...c, ...mover(c) })),
    techos: nivel.techos.map((t) => ({ ...t, contorno: t.contorno.map(mover) })),
    vigas: nivel.vigas.map((v) => ({ ...v, inicio: mover(v.inicio), fin: mover(v.fin) })),
  };
}

/**
 * Carga la cota de un lado dejando quieta la punta elegida: el motor resuelve la
 * forma y después el plano se corre entero para que esa esquina no se mueva en
 * la pantalla.
 */
export function cargarLadoConPunta(
  nivel: Nivel,
  ambienteId: string,
  indice: number,
  valor: number | null,
  punta: "inicio" | "fin",
): Nivel {
  const lado = ladosDeAmbiente(nivel, ambienteId)[indice];
  if (!lado) return nivel;
  const nodoFijo = punta === "inicio" ? lado.nodoInicio : lado.nodoFin;
  const antes = posicionNodo(nivel, nodoFijo);
  const nuevo = cargarMedidaLado(nivel, ambienteId, indice, valor);
  if (!nuevo.nodos.some((n) => n.id === nodoFijo)) return nuevo;
  const d = resta(antes, posicionNodo(nuevo, nodoFijo));
  return distancia(d, { x: 0, y: 0 }) < 0.05 ? nuevo : trasladarNivel(nuevo, d);
}

export const editarZonaTecho = (nivel: Nivel, id: string, tipo: ZonaTecho["tipo"]): Nivel => ({
  ...nivel,
  techos: nivel.techos.map((t) => (t.id === id ? { ...t, tipo } : t)),
});

/** El punto sobre el eje del muro más cercano al toque: ahí se agrega la columna o se parte. */
export function proyectarEnEje(nivel: Nivel, muroId: string, p: Punto): Punto {
  const m = nivel.muros.find((x) => x.id === muroId)!;
  const a = posicionNodo(nivel, m.desde);
  const b = posicionNodo(nivel, m.hasta);
  const u = unitario(resta(b, a));
  const t = limitar(productoEscalar(resta(p, a), u), 0, distancia(a, b));
  return redondearPunto(suma(a, por(u, t)));
}

/** El nivel nuevo arranca donde termina el anterior. */
export function agregarNivel(r: Relevamiento): { relevamiento: Relevamiento; nivelId: string } {
  const nivelId = siguienteIdNivel(r);
  const ultimo = r.niveles[r.niveles.length - 1];
  const nivel = nivelVacio(nivelId, `Nivel ${r.niveles.length + 1}`, ultimo.cotaPiso + ultimo.alturaGeneral.valor);
  return { relevamiento: { ...r, niveles: [...r.niveles, nivel] }, nivelId };
}

export const reemplazarNivel = (r: Relevamiento, nivel: Nivel): Relevamiento => ({
  ...r,
  niveles: r.niveles.map((n) => (n.id === nivel.id ? nivel : n)),
});

/** Los códigos P1, V1 son únicos en todo el relevamiento. */
export const codigosDeOtrosNiveles = (r: Relevamiento, nivelId: string): string[] =>
  r.niveles.filter((n) => n.id !== nivelId).flatMap((n) => n.aberturas.map((a) => a.codigo));
