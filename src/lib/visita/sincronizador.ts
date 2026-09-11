// src/lib/visita/sincronizador.ts
import type { Relevamiento } from "@/lib/plano/modelo";
import type { AlmacenVisita } from "./almacen";
import { ErrorSinRed, ErrorSinSesion, type ApiVisita } from "./api";
import { claveOperacion, compactarCola, fusionarContactos, type ContactoLocal, type ContactoVisita, type Operacion } from "./contactos";

export type EstadoSync = "local" | "subiendo" | "subido" | "subido-conflicto" | "sin-senal" | "sin-sesion" | "error";

export const TEXTO_ESTADO: Record<EstadoSync, string> = {
  local: "Guardado en el teléfono",
  subiendo: "Subiendo…",
  subido: "Todo subido",
  "subido-conflicto": "Subido · reemplazó una versión más nueva",
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
  alCambiarRelevamientos?: (contactoIds: string[]) => void;
  demoraMs?: number;
}) {
  const { almacen, api, alCambiarEstado, alCambiarContactos } = deps;
  const demoraMs = deps.demoraMs ?? 1500;
  let enCurso: Promise<void> | null = null;
  let repetir = false;
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  const ordenados = async () => fusionarContactos(await almacen.listarContactos(), []);

  /** La versión base que vale es la del teléfono ahora: pudo avanzar después de encolar. */
  async function conBaseActual(ops: Operacion[]): Promise<Operacion[]> {
    return Promise.all(
      ops.map(async (op) => {
        if (op.tipo !== "relevamiento") return op;
        const local = await almacen.leerRelevamiento(op.contactoId);
        return { ...op, versionBase: Math.max(op.versionBase, local?.versionBase ?? 0) };
      }),
    );
  }

  async function correr() {
    try {
      let conflicto = false;
      const { claves, operaciones } = await almacen.leerCola();
      if (operaciones.length > 0) {
        alCambiarEstado("subiendo");
        const subida = await api.subir(await conBaseActual(compactarCola(operaciones)));
        await almacen.quitarDeCola(claves);
        const siguen = new Set((await almacen.leerCola()).operaciones.map(claveOperacion));
        await almacen.guardarContactos(
          subida.contactos.filter((c) => !siguen.has(`contacto:${c.id}`)).map((c) => ({ ...c, pendiente: false })),
        );
        for (const r of subida.relevamientos) {
          await almacen.marcarRelevamientoSubido(r.contactoId, r.version);
          conflicto ||= r.conflicto;
        }
      }
      const cambios = await api.cambios(await almacen.leerMeta("ultimaSync"));
      const fusion = fusionarContactos(await almacen.listarContactos(), cambios.contactos);
      await almacen.guardarContactos(fusion);
      const cambiados = await almacen.fusionarRelevamientosRemotos(cambios.relevamientos, cambios.ahora);
      await almacen.guardarMeta("ultimaSync", cambios.ahora);
      alCambiarContactos(fusion);
      if (cambiados.length > 0) deps.alCambiarRelevamientos?.(cambiados);
      const quedan = (await almacen.leerCola()).operaciones.length > 0;
      alCambiarEstado(quedan ? "local" : conflicto ? "subido-conflicto" : "subido");
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

  function programar() {
    alCambiarEstado("local");
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(() => void sincronizar(), demoraMs);
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
      programar();
    },
    leerRelevamiento: (contactoId: string) => almacen.leerRelevamiento(contactoId),
    /** Se guarda en el teléfono al instante; la subida sale 1,5 s después del último cambio. */
    async guardarRelevamiento(contactoId: string, data: Relevamiento) {
      await almacen.guardarYEncolarRelevamiento(contactoId, data, new Date().toISOString());
      programar();
    },
  };
}

export type SincronizadorVisita = ReturnType<typeof crearSincronizadorVisita>;
