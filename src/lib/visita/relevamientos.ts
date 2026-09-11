// src/lib/visita/relevamientos.ts
import { z } from "zod";
import { relevamientoSchema, type Relevamiento } from "@/lib/plano/modelo";

/**
 * El relevamiento guardado en el teléfono. `versionBase` es la última versión del
 * servidor que el teléfono conoce (0 si nunca se subió); `pendiente` = tiene cambios
 * que todavía no se subieron.
 */
export interface RelevamientoLocal {
  contactoId: string;
  data: Relevamiento;
  versionBase: number;
  pendiente: boolean;
  guardadoEn: string;
}

export const relevamientoRemotoSchema = z.object({
  contactoId: z.string().min(1).max(64),
  data: relevamientoSchema,
  version: z.number().int().nonnegative(),
});
export type RelevamientoRemoto = z.infer<typeof relevamientoRemotoSchema>;

export const operacionRelevamientoSchema = z.object({
  tipo: z.literal("relevamiento"),
  contactoId: z.string().min(1).max(64),
  data: relevamientoSchema,
  versionBase: z.number().int().nonnegative(),
});

export const resultadoRelevamientoSchema = z.object({
  contactoId: z.string(),
  version: z.number().int(),
  conflicto: z.boolean(),
});
export type ResultadoRelevamiento = z.infer<typeof resultadoRelevamientoSchema>;

/**
 * Junta lo del teléfono con lo que bajó del servidor. Un relevamiento con cambios sin
 * subir nunca se pisa: es trabajo hecho en obra que todavía no llegó a ningún lado.
 * Devuelve también qué contactos cambiaron, para que la pantalla abierta se recargue.
 */
export function fusionarRelevamientos(
  locales: RelevamientoLocal[],
  remotos: RelevamientoRemoto[],
  ahora: string,
): { lista: RelevamientoLocal[]; cambiados: string[] } {
  const porId = new Map(locales.map((r) => [r.contactoId, r]));
  const cambiados: string[] = [];
  for (const r of remotos) {
    const actual = porId.get(r.contactoId);
    if (actual?.pendiente) continue;
    if (actual && actual.versionBase >= r.version) continue;
    porId.set(r.contactoId, { contactoId: r.contactoId, data: r.data, versionBase: r.version, pendiente: false, guardadoEn: ahora });
    cambiados.push(r.contactoId);
  }
  return { lista: [...porId.values()], cambiados };
}
