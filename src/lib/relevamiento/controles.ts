// src/lib/relevamiento/controles.ts
import type { Ambiente, Elemento, Relevamiento } from "./formato";
import { diagonalCalculada, errorDeCierre } from "./geometria";

export type NivelHallazgo = "error" | "aviso" | "ok";

export interface Hallazgo {
  nivel: NivelHallazgo;
  ambienteId: string;
  ref?: string;
  mensaje: string;
}

/** Diferencia aceptada entre lo medido y lo calculado: por debajo es error de láser, no de relevamiento. */
export const TOLERANCIA_CM = 2;

const vacio = (v: unknown) => v === null || v === undefined;

/**
 * Los datos que le faltan a una puerta o ventana, con el nombre con que Bruno los dice.
 * Es el control de "siete datos, siempre los siete" del protocolo.
 */
export function datosFaltantes(e: Elemento): string[] {
  if (e.tipo !== "puerta" && e.tipo !== "ventana") return [];
  const faltan: string[] = [];
  if (vacio(e.pared)) faltan.push("en qué pared");
  if (vacio(e.desde)) faltan.push("dónde empieza");
  if (vacio(e.hasta)) faltan.push("dónde termina");
  if (vacio(e.alto)) faltan.push("alto");
  if (e.tipo === "ventana" && vacio(e.antepecho)) faltan.push("antepecho");
  if (vacio(e.espesorMuro)) faltan.push("espesor de muro");
  if (vacio(e.apertura)) faltan.push("tipo de apertura");
  if (e.tipo === "puerta" && (e.apertura === "batiente" || e.apertura === "pivotante")) {
    if (vacio(e.abreHacia)) faltan.push("hacia dónde abre");
    if (vacio(e.bisagra)) faltan.push("bisagra");
  }
  return faltan;
}

export function controlarAmbiente(a: Ambiente): Hallazgo[] {
  const h: Hallazgo[] = [];
  const error = (mensaje: string, ref?: string) => h.push({ nivel: "error", ambienteId: a.id, ref, mensaje });
  const aviso = (mensaje: string, ref?: string) => h.push({ nivel: "aviso", ambienteId: a.id, ref, mensaje });

  if (a.paredes.length === 0) {
    error("El ambiente no tiene paredes");
  } else {
    a.paredes.forEach((p, i) => {
      if (p.largo === null) error(`Pared ${i + 1} sin medir`, p.id);
    });
    const cierre = errorDeCierre(a.paredes);
    if (cierre !== null && cierre > TOLERANCIA_CM) error(`El recorrido no cierra: faltan ${cierre} cm`);
  }

  const alturas = a.alturas.filter((x) => x.medida !== null).length;
  if (alturas === 0) error("Falta la altura del ambiente");
  else if (alturas < 3) aviso(`Altura medida en ${alturas} de 3 puntos`);

  const completas = a.paredes.length > 0 && a.paredes.every((p) => p.largo !== null);
  const medidas = a.diagonales.filter((d) => d.medida !== null);
  if (completas && medidas.length === 0) aviso("Sin diagonales: no se puede saber si el ambiente está a escuadra");
  for (const d of medidas) {
    const calculada = diagonalCalculada(a.paredes, d.desdeVertice, d.hastaVertice);
    if (calculada !== null && Math.abs(calculada - (d.medida as number)) > TOLERANCIA_CM) {
      aviso(`La diagonal mide ${d.medida} y el plano da ${calculada}: el ambiente no está a escuadra o hay una medida mal`);
    }
  }

  const aberturas = a.elementos.filter((e) => e.tipo === "puerta" || e.tipo === "ventana");
  for (const e of aberturas) {
    const faltan = datosFaltantes(e);
    if (faltan.length > 0) error(`${e.codigo}: falta ${faltan.join(", ")}`, e.id);
    const pared = a.paredes.find((p) => p.id === e.pared);
    if (!pared || vacio(e.desde) || vacio(e.hasta)) continue;
    if ((e.desde as number) >= (e.hasta as number)) error(`${e.codigo} empieza después de terminar`, e.id);
    if (pared.largo !== null && (e.hasta as number) > pared.largo) {
      error(`${e.codigo} termina en ${e.hasta} pero la pared mide ${pared.largo}`, e.id);
    }
  }
  for (let i = 0; i < aberturas.length; i++) {
    for (let j = i + 1; j < aberturas.length; j++) {
      const x = aberturas[i];
      const y = aberturas[j];
      if (x.pared !== y.pared || [x.desde, x.hasta, y.desde, y.hasta].some(vacio)) continue;
      if ((x.desde as number) < (y.hasta as number) && (y.desde as number) < (x.hasta as number)) {
        error(`${x.codigo} y ${y.codigo} se pisan en la misma pared`, x.id);
      }
    }
  }

  if (h.length === 0) h.push({ nivel: "ok", ambienteId: a.id, mensaje: "Todo cierra" });
  return h;
}

export function controlarRelevamiento(r: Relevamiento): Hallazgo[] {
  return r.niveles.flatMap((n) => n.ambientes.flatMap(controlarAmbiente));
}
