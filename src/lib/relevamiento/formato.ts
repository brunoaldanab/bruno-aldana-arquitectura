// src/lib/relevamiento/formato.ts
import { z } from "zod";

/**
 * El formato "ba-relevamiento" es a la vez lo que guarda la app y lo que lee el
 * botón de pyRevit. Todo va en centímetros enteros: una medida con decimales es
 * un error de carga, no una precisión.
 *
 * `largo: null` significa "todavía no medida". Es lo que le permite al control
 * de cierre decir qué falta, en vez de tratar un cero como una medida.
 */
const cm = z.number().int().nonnegative();

export const giroSchema = z.enum(["D", "I"]);

export const paredSchema = z.object({
  id: z.string(),
  largo: cm.nullable(),
  giro: giroSchema,
  espesor: cm.nullable().optional(),
});

export const alturaSchema = z.object({
  punto: z.enum(["puerta", "centro", "opuesta"]),
  medida: cm.nullable(),
});

export const diagonalSchema = z.object({
  desdeVertice: z.number().int().nonnegative(),
  hastaVertice: z.number().int().nonnegative(),
  medida: cm.nullable(),
});

export const elementoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  tipo: z.enum(["puerta", "ventana", "viga", "columna", "mueble-fijo", "luminaria", "toma", "llave", "aire", "mueble"]),
  pared: z.string().optional(),
  desde: cm.nullable().optional(),
  hasta: cm.nullable().optional(),
  alto: cm.nullable().optional(),
  antepecho: cm.nullable().optional(),
  dintel: cm.nullable().optional(),
  espesorMuro: cm.nullable().optional(),
  apertura: z.enum(["corrediza", "batiente", "pivotante", "fija"]).nullable().optional(),
  abreHacia: z.enum(["adentro", "afuera"]).nullable().optional(),
  bisagra: z.enum(["inicio", "fin"]).nullable().optional(),
  notas: z.string().optional(),
});

export const formaSchema = z.object({
  tipo: z.enum(["rectangulo", "L", "U"]),
  medidas: z.record(z.string(), cm.nullable()),
});

export const ambienteSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  metodo: z.enum(["forma", "recorrido"]),
  forma: formaSchema.optional(),
  paredes: z.array(paredSchema),
  alturas: z.array(alturaSchema),
  diagonales: z.array(diagonalSchema),
  elementos: z.array(elementoSchema),
});

export const nivelSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  cotaPiso: z.number().int(),
  ambientes: z.array(ambienteSchema),
});

export const relevamientoSchema = z.object({
  formato: z.literal("ba-relevamiento"),
  version: z.literal(1),
  proyecto: z.object({
    contactoId: z.string(),
    nombre: z.string(),
    direccion: z.string(),
    fechaRelevamiento: z.string(),
  }),
  niveles: z.array(nivelSchema),
});

export type Giro = z.infer<typeof giroSchema>;
export type Pared = z.infer<typeof paredSchema>;
export type Altura = z.infer<typeof alturaSchema>;
export type Diagonal = z.infer<typeof diagonalSchema>;
export type Elemento = z.infer<typeof elementoSchema>;
export type Ambiente = z.infer<typeof ambienteSchema>;
export type Nivel = z.infer<typeof nivelSchema>;
export type Relevamiento = z.infer<typeof relevamientoSchema>;

/** Un ambiente recién creado: sin paredes, con los tres puntos de altura del protocolo. */
export function crearAmbiente(id: string, nombre: string): Ambiente {
  return {
    id,
    nombre,
    metodo: "forma",
    paredes: [],
    alturas: [
      { punto: "puerta", medida: null },
      { punto: "centro", medida: null },
      { punto: "opuesta", medida: null },
    ],
    diagonales: [],
    elementos: [],
  };
}

export function crearRelevamientoVacio(entrada: {
  contactoId: string;
  nombre: string;
  direccion: string;
  ambientes: string[];
  fecha: string;
}): Relevamiento {
  const nombres = entrada.ambientes.length > 0 ? entrada.ambientes : ["Ambiente 1"];
  return {
    formato: "ba-relevamiento",
    version: 1,
    proyecto: {
      contactoId: entrada.contactoId,
      nombre: entrada.nombre,
      direccion: entrada.direccion,
      fechaRelevamiento: entrada.fecha,
    },
    niveles: [
      {
        id: "nivel-1",
        nombre: "Planta baja",
        cotaPiso: 0,
        ambientes: nombres.map((n, i) => crearAmbiente(`amb-${i + 1}`, n)),
      },
    ],
  };
}
