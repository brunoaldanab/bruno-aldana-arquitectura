// src/lib/relevamiento/sincronizacion.ts
import type { Relevamiento } from "./formato";

export interface CopiaLocal {
  data: Relevamiento;
  /** Versión del servidor sobre la que se hicieron los cambios del teléfono. */
  versionBase: number;
  /** Hay cambios guardados en el teléfono que todavía no se subieron. */
  pendiente: boolean;
  guardadoEn: string;
}

export interface CopiaRemota {
  data: Relevamiento;
  version: number;
}

export type Decision =
  | { accion: "crear" }
  | { accion: "usar-remoto" }
  | { accion: "subir-local" }
  | { accion: "conflicto-gana-local" }
  | { accion: "nada" };

/**
 * Qué hacer al abrir el relevamiento, con la copia del teléfono y la del servidor.
 *
 * Hay un solo usuario y la visita se hace en el teléfono, así que lo medido ahí
 * nunca se pisa: si el servidor avanzó mientras tanto, se avisa y se sube igual.
 */
export function decidirAlAbrir(local: CopiaLocal | null, remoto: CopiaRemota | null): Decision {
  if (!local && !remoto) return { accion: "crear" };
  if (!local) return { accion: "usar-remoto" };
  if (!remoto) return local.pendiente ? { accion: "subir-local" } : { accion: "nada" };
  if (!local.pendiente) return remoto.version > local.versionBase ? { accion: "usar-remoto" } : { accion: "nada" };
  return remoto.version > local.versionBase ? { accion: "conflicto-gana-local" } : { accion: "subir-local" };
}
