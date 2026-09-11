// src/lib/visita/contactos.ts
import { z } from "zod";
import { operacionRelevamientoSchema } from "./relevamientos";

/**
 * El contacto tal como viaja entre el teléfono y el servidor en el modo visita.
 * Las fechas van como texto ISO para que se guarden igual en IndexedDB y en JSON.
 */
const texto = z.string().max(5000).nullable();

export const contactoVisitaSchema = z.object({
  id: z.string().min(1).max(64),
  nombre: z.string().min(1).max(200),
  telefono: texto,
  email: z.string().email().nullable(),
  direccionProyecto: texto,
  notas: texto,
  origen: texto,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ContactoVisita = z.infer<typeof contactoVisitaSchema>;

/** El contacto guardado en el teléfono. `pendiente` = tiene cambios que todavía no se subieron. */
export interface ContactoLocal extends ContactoVisita {
  pendiente: boolean;
}

export const operacionContactoSchema = z.object({ tipo: z.literal("contacto"), contacto: contactoVisitaSchema });

/** Lo que espera en la cola: un contacto o un relevamiento entero. */
export const operacionSchema = z.discriminatedUnion("tipo", [operacionContactoSchema, operacionRelevamientoSchema]);
export type Operacion = z.infer<typeof operacionSchema>;
export type OperacionContacto = Extract<Operacion, { tipo: "contacto" }>;
export type OperacionRelevamiento = Extract<Operacion, { tipo: "relevamiento" }>;

export const idDeOperacion = (op: Operacion): string => (op.tipo === "contacto" ? op.contacto.id : op.contactoId);
export const claveOperacion = (op: Operacion): string => `${op.tipo}:${idDeOperacion(op)}`;

export type CamposContacto = {
  nombre: string;
  telefono: string;
  email: string;
  direccionProyecto: string;
  notas: string;
  origen: string;
};

const vacioANull = (v: string) => (v.trim() === "" ? null : v.trim());

export function leerFormularioContacto(
  campos: CamposContacto,
  base: { id: string; createdAt: string },
  ahora: string,
): { ok: true; contacto: ContactoVisita } | { ok: false; error: string } {
  const nombre = campos.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };
  const email = vacioANull(campos.email);
  if (email !== null && !z.string().email().safeParse(email).success) return { ok: false, error: "Email inválido." };
  return {
    ok: true,
    contacto: {
      id: base.id,
      nombre,
      telefono: vacioANull(campos.telefono),
      email,
      direccionProyecto: vacioANull(campos.direccionProyecto),
      notas: vacioANull(campos.notas),
      origen: vacioANull(campos.origen),
      createdAt: base.createdAt,
      updatedAt: ahora,
    },
  };
}

/** Junta lo del teléfono con lo que bajó del servidor. Lo que se cambió en obra y no se subió nunca se pisa. */
export function fusionarContactos(locales: ContactoLocal[], remotos: ContactoVisita[]): ContactoLocal[] {
  const porId = new Map(locales.map((c) => [c.id, c]));
  for (const r of remotos) {
    const actual = porId.get(r.id);
    if (actual?.pendiente) continue;
    porId.set(r.id, { ...r, pendiente: false });
  }
  return [...porId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Si un contacto o un relevamiento se editó varias veces sin señal, alcanza con subir
 * su última versión. Se compacta por tipo e id: el contacto y el relevamiento de un
 * mismo cliente comparten id y son cosas distintas.
 */
export function compactarCola(ops: Operacion[]): Operacion[] {
  const ultima = new Map<string, number>();
  ops.forEach((op, i) => ultima.set(claveOperacion(op), i));
  return ops.filter((op, i) => ultima.get(claveOperacion(op)) === i);
}
