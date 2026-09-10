// src/app/contactos/[id]/relevamiento/sincronizador.ts
import type { Relevamiento } from "@/lib/relevamiento/formato";
import { guardarLocal } from "@/lib/relevamiento/almacen";
import { guardarRelevamiento } from "./actions";

export type EstadoSync = "cargando" | "local" | "subiendo" | "subido" | "sin-senal" | "conflicto";

const ESPERA_MS = 1500;

export function crearSincronizador(
  contactoId: string,
  alCambiarDatos: (r: Relevamiento) => void,
  alCambiarEstado: (e: EstadoSync) => void,
) {
  let data: Relevamiento | null = null;
  let versionBase = 0;
  let pendiente = false;
  let cambios = 0;
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  function persistir() {
    if (!data) return Promise.resolve();
    return guardarLocal(contactoId, { data, versionBase, pendiente, guardadoEn: new Date().toISOString() }).catch(() => {});
  }

  function programar() {
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(() => void subir(), ESPERA_MS);
  }

  async function subir() {
    if (!data || !pendiente) return;
    if (!navigator.onLine) {
      alCambiarEstado("sin-senal");
      return;
    }
    const enviados = cambios;
    alCambiarEstado("subiendo");
    try {
      const r = await guardarRelevamiento(contactoId, data, versionBase);
      versionBase = r.version;
      if (cambios === enviados) pendiente = false;
      await persistir();
      if (pendiente) {
        alCambiarEstado("local");
        programar();
      } else {
        alCambiarEstado(r.conflicto ? "conflicto" : "subido");
      }
    } catch {
      alCambiarEstado("sin-senal");
    }
  }

  return {
    iniciar(inicial: Relevamiento, version: number, conCambios: boolean) {
      data = inicial;
      versionBase = version;
      pendiente = conCambios;
      alCambiarDatos(inicial);
      void persistir();
      if (conCambios) {
        alCambiarEstado("local");
        void subir();
      } else {
        alCambiarEstado("subido");
      }
    },
    cambiar(r: Relevamiento) {
      data = r;
      pendiente = true;
      cambios += 1;
      alCambiarDatos(r);
      alCambiarEstado("local");
      void persistir();
      programar();
    },
    reintentar() {
      if (pendiente) void subir();
    },
    datos() {
      return data;
    },
  };
}
