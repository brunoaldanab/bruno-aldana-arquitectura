// src/lib/visita/api.ts
import { z } from "zod";
import { contactoVisitaSchema, type ContactoVisita, type Operacion } from "./contactos";
import {
  relevamientoRemotoSchema,
  resultadoRelevamientoSchema,
  type RelevamientoRemoto,
  type ResultadoRelevamiento,
} from "./relevamientos";

export class ErrorSinSesion extends Error {
  constructor() { super("La sesión venció"); }
}
export class ErrorSinRed extends Error {
  constructor() { super("Sin conexión"); }
}

export interface ApiVisita {
  subir(ops: Operacion[]): Promise<{ contactos: ContactoVisita[]; relevamientos: ResultadoRelevamiento[] }>;
  cambios(desde: string | null): Promise<{ contactos: ContactoVisita[]; relevamientos: RelevamientoRemoto[]; ahora: string }>;
}

const respuestaSubir = z.object({ contactos: z.array(contactoVisitaSchema), relevamientos: z.array(resultadoRelevamientoSchema) });
const respuestaCambios = z.object({
  contactos: z.array(contactoVisitaSchema),
  relevamientos: z.array(relevamientoRemotoSchema),
  ahora: z.string(),
});

async function pedir(url: string, init?: RequestInit): Promise<unknown> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, { cache: "no-store", credentials: "same-origin", ...init });
  } catch {
    throw new ErrorSinRed();
  }
  if (respuesta.status === 401) throw new ErrorSinSesion();
  if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);
  return respuesta.json();
}

export function crearApiFetch(): ApiVisita {
  return {
    async subir(ops) {
      const json = await pedir("/api/visita/subir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operaciones: ops }),
      });
      return respuestaSubir.parse(json);
    },
    async cambios(desde) {
      const url = desde ? `/api/visita/cambios?desde=${encodeURIComponent(desde)}` : "/api/visita/cambios";
      return respuestaCambios.parse(await pedir(url));
    },
  };
}
