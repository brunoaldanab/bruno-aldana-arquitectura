// src/lib/visita/servidor.ts
import { relevamientoSchema } from "@/lib/plano/modelo";
import type { ContactoVisita, Operacion } from "./contactos";
import type { RelevamientoRemoto } from "./relevamientos";

export type FilaContacto = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccionProyecto: string | null;
  notas: string | null;
  origen: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function aContactoVisita(fila: FilaContacto): ContactoVisita {
  return {
    id: fila.id,
    nombre: fila.nombre,
    telefono: fila.telefono,
    email: fila.email,
    direccionProyecto: fila.direccionProyecto,
    notas: fila.notas,
    origen: fila.origen,
    createdAt: fila.createdAt.toISOString(),
    updatedAt: fila.updatedAt.toISOString(),
  };
}

/**
 * Primero todos los contactos y después los relevamientos, cada grupo en su orden:
 * el relevamiento de un cliente creado sin señal necesita que el cliente ya exista
 * (llave foránea), aunque en la cola haya quedado antes.
 */
export function ordenarOperaciones(ops: Operacion[]): Operacion[] {
  return [...ops.filter((o) => o.tipo === "contacto"), ...ops.filter((o) => o.tipo === "relevamiento")];
}

/** El servidor tenía una versión que el teléfono no conocía: se guarda igual y se avisa. */
export const hayConflicto = (versionServidor: number | null, versionBase: number): boolean =>
  versionServidor !== null && versionServidor > versionBase;

/** Solo bajan los relevamientos del formato 2; los del formato 1 eran de prueba. */
export function relevamientosV2(filas: { contactoId: string; data: unknown; version: number }[]): RelevamientoRemoto[] {
  return filas.flatMap((f) => {
    const r = relevamientoSchema.safeParse(f.data);
    return r.success ? [{ contactoId: f.contactoId, data: r.data, version: f.version }] : [];
  });
}
