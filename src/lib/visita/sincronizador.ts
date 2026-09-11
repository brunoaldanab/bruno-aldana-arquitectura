// src/lib/visita/sincronizador.ts
import type { AlmacenVisita } from "./almacen";
import { ErrorSinRed, ErrorSinSesion, type ApiVisita } from "./api";
import { compactarCola, fusionarContactos, type ContactoLocal, type ContactoVisita } from "./contactos";

export type EstadoSync = "local" | "subiendo" | "subido" | "sin-senal" | "sin-sesion" | "error";

export const TEXTO_ESTADO: Record<EstadoSync, string> = {
  local: "Guardado en el teléfono",
  subiendo: "Subiendo…",
  subido: "Todo subido",
  "sin-senal": "Sin señal · guardado en el teléfono",
  "sin-sesion": "Iniciá sesión para subir",
  error: "No se pudo subir · se reintenta",
};

/**
 * Un objeto creado una sola vez que guarda en el teléfono y sube cuando puede.
 * No lee el estado de React: la subida es asíncrona y trabajaría con copias viejas.
 */
export function crearSincronizadorVisita(deps: {
  almacen: AlmacenVisita;
  api: ApiVisita;
  alCambiarEstado: (e: EstadoSync) => void;
  alCambiarContactos: (c: ContactoLocal[]) => void;
  demoraMs?: number;
}) {
  const { almacen, api, alCambiarEstado, alCambiarContactos } = deps;
  const demoraMs = deps.demoraMs ?? 1500;
  let enCurso: Promise<void> | null = null;
  let repetir = false;
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  const ordenados = async () => fusionarContactos(await almacen.listarContactos(), []);

  async function correr() {
    try {
      const { claves, operaciones } = await almacen.leerCola();
      if (operaciones.length > 0) {
        alCambiarEstado("subiendo");
        const guardados = await api.subir(compactarCola(operaciones));
        await almacen.quitarDeCola(claves);
        const siguenEnCola = new Set((await almacen.leerCola()).operaciones.map((o) => o.contacto.id));
        await almacen.guardarContactos(guardados.filter((c) => !siguenEnCola.has(c.id)).map((c) => ({ ...c, pendiente: false })));
      }
      const { contactos, ahora } = await api.cambios(await almacen.leerMeta("ultimaSync"));
      const fusion = fusionarContactos(await almacen.listarContactos(), contactos);
      await almacen.guardarContactos(fusion);
      await almacen.guardarMeta("ultimaSync", ahora);
      alCambiarContactos(fusion);
      alCambiarEstado((await almacen.leerCola()).operaciones.length > 0 ? "local" : "subido");
    } catch (e) {
      alCambiarEstado(e instanceof ErrorSinSesion ? "sin-sesion" : e instanceof ErrorSinRed ? "sin-senal" : "error");
    }
  }

  function sincronizar(): Promise<void> {
    if (enCurso) {
      repetir = true;
      return enCurso;
    }
    enCurso = correr().finally(() => {
      enCurso = null;
      if (repetir) {
        repetir = false;
        void sincronizar();
      }
    });
    return enCurso;
  }

  return {
    async iniciar() {
      alCambiarContactos(await ordenados());
      await sincronizar();
    },
    sincronizar,
    async guardarContacto(c: ContactoVisita) {
      await almacen.guardarContactos([{ ...c, pendiente: true }]);
      await almacen.encolar({ tipo: "contacto", contacto: c });
      alCambiarContactos(await ordenados());
      alCambiarEstado("local");
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(() => void sincronizar(), demoraMs);
    },
  };
}
