// src/lib/plano/herramientas.ts
import { ladosDeAmbiente } from "./ambientes";
import { posicionNodo } from "./caras";
import type { Control } from "./modelo";
import { arrastrarAbertura, colocarAbertura } from "./edicion";
import {
  agregarBandeja,
  agregarColumna,
  agregarMoldura,
  agregarViga,
  agregarZonaDibujada,
  agregarZonaTecho,
  zonaDeAmbiente,
} from "./elementos";
import { arrastrarPuntoElectrico, colocarPuntoElectrico, TIPO_POR_DEFECTO } from "./electricos";
import type { Nivel } from "./modelo";
import { agregarMuro, ajustarPunto, moverNodo, type Extremo } from "./operaciones";
import { ambienteEnPunto, puntoEnPoligono } from "./superficie";
import { seleccionDeMuro, tocarPlanta, tocarTecho, type Seleccion } from "./toque";
import { areaConSigno, distancia, por, suma, type Punto } from "./vector";

/**
 * Qué hace un toque según la herramienta elegida. La pantalla solo convierte el
 * dedo a centímetros y llama acá: así dibujar un cuarto con toques se prueba sin
 * navegador.
 */

export type Modo = "planta" | "techo";
export type Herramienta =
  | "tocar"
  | "muro"
  | "puerta"
  | "ventana"
  | "vano"
  | "columna"
  | "electrico"
  | "zona"
  | "bandeja"
  | "dibujar"
  | "moldura"
  | "viga";

export const HERRAMIENTAS: Record<Modo, Herramienta[]> = {
  planta: ["tocar", "muro", "puerta", "ventana", "vano", "columna", "electrico"],
  techo: ["tocar", "zona", "bandeja", "dibujar", "moldura", "viga"],
};

/**
 * El trazo en curso: la punta desde donde sigue el muro encadenado, el inicio de
 * la viga, o los puntos ya marcados de una zona de techo dibujada a dedo.
 */
export type Trazo = { extremo: Extremo; punto: Punto; primero: string | null; puntos?: Punto[] } | null;

export type EstadoToque = { nivel: Nivel; modo: Modo; herramienta: Herramienta; trazo: Trazo; codigosOtros: string[] };
export type ResultadoToque = {
  nivel: Nivel;
  seleccion: Seleccion | null;
  trazo: Trazo;
  herramienta: Herramienta;
  /** Por qué el toque no hizo nada. La pantalla lo muestra un momento sobre el plano. */
  aviso?: string;
};

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

/** De un control de la lista de pendientes al elemento que hay que abrir. */
export function seleccionDeElemento(nivel: Nivel, elemento: NonNullable<Control["elemento"]>): Seleccion | null {
  const { tipo, id } = elemento;
  if (tipo === "muro") {
    const m = nivel.muros.find((x) => x.id === id);
    if (!m) return null;
    const medio = por(suma(posicionNodo(nivel, m.desde), posicionNodo(nivel, m.hasta)), 0.5);
    return seleccionDeMuro(nivel, id, medio);
  }
  if (tipo === "ambiente") {
    // El ambiente se abre por su primer lado sin medir, que es lo que hay que cargar.
    const amb = nivel.ambientes.find((a) => a.id === id);
    if (!amb) return null;
    const indice = ladosDeAmbiente(nivel, id).findIndex((l) => !l.medida?.tomada);
    return indice >= 0 ? seleccionDeCota(nivel, `${id}:${indice}`) : { tipo: "ambiente", id };
  }
  const listas: Record<string, { id: string }[]> = {
    abertura: nivel.aberturas,
    columna: nivel.columnas,
    electrico: nivel.electricos,
    techo: nivel.techos,
    moldura: nivel.molduras,
    viga: nivel.vigas,
  };
  const lista = listas[tipo];
  if (!lista?.some((e) => e.id === id)) return null;
  return { tipo, id } as Seleccion;
}

/** Después de deshacer o borrar, la selección puede apuntar a algo que ya no existe. */
export function seleccionVigente(nivel: Nivel, sel: Seleccion | null): Seleccion | null {
  if (!sel) return null;
  const listas: Record<Seleccion["tipo"], { id: string }[]> = {
    nodo: nivel.nodos, muro: nivel.muros, abertura: nivel.aberturas, columna: nivel.columnas,
    electrico: nivel.electricos, ambiente: nivel.ambientes, techo: nivel.techos,
    moldura: nivel.molduras, viga: nivel.vigas,
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
      return r
        ? { nivel: r.nivel, seleccion: { tipo: "abertura", id: r.id }, trazo: null, herramienta: "tocar" }
        : { ...nada, aviso: "Tocá encima de una pared para colocarla" };
    }
    case "columna": {
      const r = agregarColumna(e.nivel, { x: p.x, y: p.y, ancho: COLUMNA_POR_DEFECTO, profundidad: COLUMNA_POR_DEFECTO });
      return { nivel: r.nivel, seleccion: { tipo: "columna", id: r.id }, trazo: null, herramienta: "tocar" };
    }
    case "electrico": {
      const r = colocarPuntoElectrico(e.nivel, TIPO_POR_DEFECTO, p, radio, e.codigosOtros);
      return r
        ? { nivel: r.nivel, seleccion: { tipo: "electrico", id: r.id }, trazo: null, herramienta: "tocar" }
        : { ...nada, aviso: "Tocá encima de una pared para poner el enchufe" };
    }
    case "bandeja": {
      // La bandeja nace adentro de la zona más chica que contenga el toque.
      const zona = e.nivel.techos
        .filter((t) => puntoEnPoligono(p, t.contorno))
        .sort((a, b) => Math.abs(areaConSigno(a.contorno)) - Math.abs(areaConSigno(b.contorno)))[0];
      if (!zona) return { ...nada, aviso: "La bandeja va adentro de un cielo falso: primero poné la zona" };
      const r = agregarBandeja(e.nivel, zona.id);
      return r
        ? { nivel: r.nivel, seleccion: { tipo: "techo", id: r.id }, trazo: null, herramienta: "tocar" }
        : { ...nada, aviso: "No entra otra bandeja adentro de esa: es muy chica" };
    }
    case "dibujar": {
      const puntos = [...(e.trazo?.puntos ?? []), p];
      // Volver al primer punto cierra la zona, igual que el muro encadenado.
      if (puntos.length > 3 && distancia(p, puntos[0]) < 30) {
        const r = agregarZonaDibujada(e.nivel, puntos.slice(0, -1), e.nivel.alturaGeneral.valor);
        return r
          ? { nivel: r.nivel, seleccion: { tipo: "techo", id: r.id }, trazo: null, herramienta: "tocar" }
          : { ...nada, herramienta: "dibujar" };
      }
      return { ...nada, herramienta: "dibujar", trazo: { extremo: p, punto: p, primero: null, puntos } };
    }
    case "zona":
    case "moldura": {
      const ambienteId = ambienteEnPunto(e.nivel, p);
      if (!ambienteId)
        return {
          ...nada,
          aviso:
            e.herramienta === "zona"
              ? "La zona cubre un ambiente cerrado. Cerrá las paredes, o usá «A dedo»"
              : "La moldura recorre el borde de un ambiente cerrado. Cerrá las paredes",
        };
      if (e.herramienta === "zona") {
        const ya = zonaDeAmbiente(e.nivel, ambienteId);
        if (ya) return { ...nada, seleccion: { tipo: "techo", id: ya.id }, herramienta: "tocar", aviso: "Este ambiente ya tiene su cielo falso" };
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

/** El botón "Terminar": cierra la zona que se venía dibujando, o suelta el trazo. */
export function terminarTrazo(e: EstadoToque): ResultadoToque {
  const puntos = e.trazo?.puntos ?? [];
  if (e.herramienta === "dibujar" && puntos.length >= 3) {
    const r = agregarZonaDibujada(e.nivel, puntos, e.nivel.alturaGeneral.valor);
    if (r) return { nivel: r.nivel, seleccion: { tipo: "techo", id: r.id }, trazo: null, herramienta: "tocar" };
  }
  return { nivel: e.nivel, seleccion: null, trazo: null, herramienta: e.herramienta };
}

export type Arrastre = { tipo: "nodo" | "abertura" | "electrico"; id: string };

/** Con Tocar, apoyar el dedo sobre un nodo o una abertura y moverlo los arrastra; en otro lado desplaza el plano. */
export function iniciarArrastre(e: EstadoToque, p: Punto, radio: number): Arrastre | null {
  if (e.modo !== "planta" || e.herramienta !== "tocar") return null;
  const sel = tocarPlanta(e.nivel, p, radio);
  return sel && (sel.tipo === "nodo" || sel.tipo === "abertura" || sel.tipo === "electrico") ? { tipo: sel.tipo, id: sel.id } : null;
}

/** Mientras se arrastra solo cambia el dibujo; al soltar ("final") las medidas se vuelven a imponer. */
export function aplicarArrastre(nivel: Nivel, a: Arrastre, p: Punto, final: boolean): Nivel {
  const cm = { x: Math.round(p.x), y: Math.round(p.y) };
  if (a.tipo === "nodo") return moverNodo(nivel, a.id, cm, final);
  return a.tipo === "abertura" ? arrastrarAbertura(nivel, a.id, cm) : arrastrarPuntoElectrico(nivel, a.id, cm);
}
