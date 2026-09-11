// src/lib/plano/herramientas.ts
import { ladosDeAmbiente } from "./ambientes";
import { posicionNodo } from "./caras";
import { arrastrarAbertura, colocarAbertura } from "./edicion";
import { agregarColumna, agregarMoldura, agregarViga, agregarZonaTecho } from "./elementos";
import type { Nivel } from "./modelo";
import { agregarMuro, ajustarPunto, moverNodo, type Extremo } from "./operaciones";
import { ambienteEnPunto } from "./superficie";
import { tocarPlanta, tocarTecho, type Seleccion } from "./toque";
import { distancia, por, suma, type Punto } from "./vector";

/**
 * Qué hace un toque según la herramienta elegida. La pantalla solo convierte el
 * dedo a centímetros y llama acá: así dibujar un cuarto con toques se prueba sin
 * navegador.
 */

export type Modo = "planta" | "techo";
export type Herramienta = "tocar" | "muro" | "puerta" | "ventana" | "vano" | "columna" | "zona" | "moldura" | "viga";

export const HERRAMIENTAS: Record<Modo, Herramienta[]> = {
  planta: ["tocar", "muro", "puerta", "ventana", "vano", "columna"],
  techo: ["tocar", "zona", "moldura", "viga"],
};

/** El trazo en curso: la punta desde donde sigue el muro encadenado, o el inicio de la viga. */
export type Trazo = { extremo: Extremo; punto: Punto; primero: string | null } | null;

export type EstadoToque = { nivel: Nivel; modo: Modo; herramienta: Herramienta; trazo: Trazo; codigosOtros: string[] };
export type ResultadoToque = { nivel: Nivel; seleccion: Seleccion | null; trazo: Trazo; herramienta: Herramienta };

export const COLUMNA_POR_DEFECTO = 30;
export const MOLDURA_POR_DEFECTO = { ancho: 10, caida: 10 };
export const VIGA_POR_DEFECTO = { ancho: 20, peralte: 40 };

/** "amb1:2" → el muro del lado 2 del ambiente, con su cota. */
export function seleccionDeCota(nivel: Nivel, cota: string): Seleccion | null {
  const [ambienteId, texto] = cota.split(":");
  const indice = Number(texto);
  const lado = nivel.ambientes.some((a) => a.id === ambienteId) ? ladosDeAmbiente(nivel, ambienteId)[indice] : undefined;
  if (!lado) return null;
  const { muroId, cara } = lado.caras[0];
  return { tipo: "muro", id: muroId, cara, punto: por(suma(lado.inicio, lado.fin), 0.5), ambienteId, indice };
}

/** Después de deshacer o borrar, la selección puede apuntar a algo que ya no existe. */
export function seleccionVigente(nivel: Nivel, sel: Seleccion | null): Seleccion | null {
  if (!sel) return null;
  const listas: Record<Seleccion["tipo"], { id: string }[]> = {
    nodo: nivel.nodos, muro: nivel.muros, abertura: nivel.aberturas, columna: nivel.columnas,
    ambiente: nivel.ambientes, techo: nivel.techos, moldura: nivel.molduras, viga: nivel.vigas,
  };
  if (!listas[sel.tipo].some((e) => e.id === sel.id)) return null;
  if (sel.tipo === "muro" && sel.ambienteId && !nivel.ambientes.some((a) => a.id === sel.ambienteId))
    return { ...sel, ambienteId: null, indice: null };
  return sel;
}

function toqueMuro(e: EstadoToque, p: Punto, radio: number): ResultadoToque {
  const aj = ajustarPunto(e.nivel, e.trazo?.punto ?? null, p, { radio });
  const extremo: Extremo = aj.nodoId ? { nodoId: aj.nodoId } : aj.punto;
  if (!e.trazo) {
    return { nivel: e.nivel, seleccion: null, herramienta: "muro", trazo: { extremo, punto: aj.punto, primero: aj.nodoId } };
  }
  if (distancia(aj.punto, e.trazo.punto) < 1) return { nivel: e.nivel, seleccion: null, herramienta: "muro", trazo: e.trazo };
  const r = agregarMuro(e.nivel, e.trazo.extremo, extremo);
  const primero = e.trazo.primero ?? r.nivel.muros.find((m) => m.id === r.muroId)!.desde;
  // Tocar el primer nodo cierra el ambiente y termina el trazo.
  const trazo: Trazo =
    r.nodoHasta === primero ? null : { extremo: { nodoId: r.nodoHasta }, punto: posicionNodo(r.nivel, r.nodoHasta), primero };
  return { nivel: r.nivel, seleccion: null, herramienta: "muro", trazo };
}

export function aplicarToque(e: EstadoToque, p: Punto, radio: number, cota: string | null = null): ResultadoToque {
  const nada = { nivel: e.nivel, seleccion: null, trazo: null, herramienta: e.herramienta };
  // Tocar una cota abre su medida con cualquier herramienta de planta, salvo con un muro a medio trazar:
  // después de cerrar un ambiente con Muro, lo siguiente es medirlo.
  if (cota && e.modo === "planta" && !e.trazo) {
    const seleccion = seleccionDeCota(e.nivel, cota);
    if (seleccion) return { ...nada, seleccion, herramienta: "tocar" };
  }

  switch (e.herramienta) {
    case "tocar":
      return { ...nada, seleccion: e.modo === "planta" ? tocarPlanta(e.nivel, p, radio) : tocarTecho(e.nivel, p, radio) };
    case "muro":
      return toqueMuro(e, p, radio);
    case "puerta":
    case "ventana":
    case "vano": {
      const r = colocarAbertura(e.nivel, e.herramienta, p, radio, e.codigosOtros);
      return r ? { nivel: r.nivel, seleccion: { tipo: "abertura", id: r.id }, trazo: null, herramienta: "tocar" } : nada;
    }
    case "columna": {
      const r = agregarColumna(e.nivel, { x: p.x, y: p.y, ancho: COLUMNA_POR_DEFECTO, profundidad: COLUMNA_POR_DEFECTO });
      return { nivel: r.nivel, seleccion: { tipo: "columna", id: r.id }, trazo: null, herramienta: "tocar" };
    }
    case "zona":
    case "moldura": {
      const ambienteId = ambienteEnPunto(e.nivel, p);
      if (!ambienteId) return nada;
      if (e.herramienta === "zona") {
        const r = agregarZonaTecho(e.nivel, { ambienteId, tipo: "cielo-falso", altura: e.nivel.alturaGeneral.valor });
        return { nivel: r.nivel, seleccion: { tipo: "techo", id: r.id }, trazo: null, herramienta: "tocar" };
      }
      const r = agregarMoldura(e.nivel, { ambienteId, ...MOLDURA_POR_DEFECTO });
      return { nivel: r.nivel, seleccion: { tipo: "moldura", id: r.id }, trazo: null, herramienta: "tocar" };
    }
    case "viga": {
      if (!e.trazo) return { ...nada, trazo: { extremo: p, punto: p, primero: null } };
      if (distancia(p, e.trazo.punto) < 1) return { ...nada, trazo: e.trazo };
      const r = agregarViga(e.nivel, { inicio: e.trazo.punto, fin: p, ...VIGA_POR_DEFECTO });
      return { nivel: r.nivel, seleccion: { tipo: "viga", id: r.id }, trazo: null, herramienta: "tocar" };
    }
  }
}

export type Arrastre = { tipo: "nodo" | "abertura"; id: string };

/** Con Tocar, apoyar el dedo sobre un nodo o una abertura y moverlo los arrastra; en otro lado desplaza el plano. */
export function iniciarArrastre(e: EstadoToque, p: Punto, radio: number): Arrastre | null {
  if (e.modo !== "planta" || e.herramienta !== "tocar") return null;
  const sel = tocarPlanta(e.nivel, p, radio);
  return sel && (sel.tipo === "nodo" || sel.tipo === "abertura") ? { tipo: sel.tipo, id: sel.id } : null;
}

/** Mientras se arrastra solo cambia el dibujo; al soltar ("final") las medidas se vuelven a imponer. */
export function aplicarArrastre(nivel: Nivel, a: Arrastre, p: Punto, final: boolean): Nivel {
  const cm = { x: Math.round(p.x), y: Math.round(p.y) };
  return a.tipo === "nodo" ? moverNodo(nivel, a.id, cm, final) : arrastrarAbertura(nivel, a.id, cm);
}
