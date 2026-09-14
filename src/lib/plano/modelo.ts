// src/lib/plano/modelo.ts
import { z } from "zod";

export { redondear } from "./vector";

/**
 * Formato "ba-relevamiento" versión 2: lo que guarda la app y lo que lee el
 * botón de pyRevit. Todo en centímetros. Cada magnitud medible es una Medida:
 * "tomada" distingue la medida de láser del valor dibujado a ojo, que queda
 * pendiente hasta que Bruno la mida.
 */
export const TOLERANCIA_CM = 2;
export const ESPESOR_POR_DEFECTO = 15;
export const ALTURA_POR_DEFECTO = 260;

const entero = z.number().int();
const id = z.string().min(1);

export const medidaSchema = z.object({ valor: entero.nonnegative(), tomada: z.boolean() });
export const puntoSchema = z.object({ x: z.number(), y: z.number() });
export const nombreCaraSchema = z.enum(["izquierda", "derecha"]);
export const refCaraSchema = z.object({ muroId: id, cara: nombreCaraSchema });

export const nodoSchema = z.object({ id, x: z.number(), y: z.number() });

export const muroSchema = z.object({
  id,
  desde: id,
  hasta: id,
  espesor: medidaSchema,
  altura: medidaSchema.nullable(),
  caras: z.object({ izquierda: medidaSchema.nullable(), derecha: medidaSchema.nullable() }),
});

export const tipoAberturaSchema = z.enum(["puerta", "ventana", "vano"]);

export const aberturaSchema = z.object({
  id,
  codigo: id,
  tipo: tipoAberturaSchema,
  muroId: id,
  cara: nombreCaraSchema,
  // Puede ser negativo solo si al partir el muro la abertura quedó cortada:
  // el control lo marca como error en vez de esconderlo (ajuste 16).
  desde: z.object({ valor: entero, tomada: z.boolean() }),
  ancho: medidaSchema,
  alto: medidaSchema,
  antepecho: medidaSchema,
  apertura: z
    .enum(["batiente", "doble", "corrediza", "pivotante", "plegable", "fija", "proyectante"])
    .nullable(),
  abreHacia: nombreCaraSchema.nullable(),
  bisagra: z.enum(["inicio", "fin"]).nullable(),
  notas: z.string(),
});

export const columnaSchema = z.object({
  id,
  x: z.number(),
  y: z.number(),
  ancho: medidaSchema,
  profundidad: medidaSchema,
  rotacion: z.number(),
  altura: medidaSchema.nullable(),
});

export const ambienteSchema = z.object({
  id,
  nombre: z.string(),
  contorno: z.array(refCaraSchema),
  desnivelPiso: entero,
});

export const zonaTechoSchema = z.object({
  id,
  /** Null cuando se dibujó a dedo sobre un plano que todavía no cierra ningún ambiente. */
  ambienteId: id.nullable(),
  tipo: z.enum(["losa", "cielo-falso", "cajon"]),
  contorno: z.array(puntoSchema).min(3),
  altura: medidaSchema,
  /** La zona de la que nace, cuando es una bandeja adentro de otra. */
  padreId: id.nullable().default(null),
  /** Cuánto se mete hacia adentro del padre. Null cuando el contorno se dibujó a dedo. */
  margen: medidaSchema.nullable().default(null),
});

/**
 * Los puntos eléctricos que Bruno nunca relevaba y siempre le faltaban. La
 * clave es la del catálogo de `electricos.ts`: de ahí salen el nombre, la
 * familia y la altura que manda la norma boliviana NB 777.
 */
export const tipoPuntoSchema = z.enum([
  "toma-simple",
  "toma-doble",
  "toma-triple",
  "toma-usb",
  "toma-mesada",
  "toma-piso",
  "int-simple",
  "int-doble",
  "int-triple",
  "int-conmutador",
  "int-dimmer",
  "int-sensor",
  "mixto-int-toma",
  "datos-tv",
  "datos-red",
  "datos-red-doble",
  "datos-telefono",
  "fuerza-aire",
  "fuerza-termo",
  "fuerza-cocina",
  "fuerza-lavadora",
  "fuerza-timbre",
]);

export const puntoElectricoSchema = z.object({
  id,
  codigo: id,
  tipo: tipoPuntoSchema,
  muroId: id,
  cara: nombreCaraSchema,
  /** Centímetros sobre la cara, desde su esquina del nodo "desde". */
  desde: medidaSchema,
  /** Altura desde el piso terminado, hasta el punto medio de la caja (NB 777). */
  altura: medidaSchema,
  notas: z.string(),
});

export const molduraSchema = z.object({
  id,
  ambienteId: id,
  caras: z.array(refCaraSchema),
  ancho: medidaSchema,
  caida: medidaSchema,
});

export const vigaSchema = z.object({
  id,
  inicio: puntoSchema,
  fin: puntoSchema,
  ancho: medidaSchema,
  peralte: medidaSchema,
});

const nivelBase = z.object({
  id,
  nombre: z.string(),
  cotaPiso: entero,
  alturaGeneral: medidaSchema,
  nodos: z.array(nodoSchema),
  muros: z.array(muroSchema),
  aberturas: z.array(aberturaSchema),
  columnas: z.array(columnaSchema),
  electricos: z.array(puntoElectricoSchema).default([]),
  ambientes: z.array(ambienteSchema),
  techos: z.array(zonaTechoSchema),
  molduras: z.array(molduraSchema),
  vigas: z.array(vigaSchema),
});

/** Un nivel con referencias rotas no llega nunca a Revit: se rechaza al validar. */
export const nivelSchema = nivelBase.superRefine((n, ctx) => {
  const problema = (message: string) => ctx.addIssue({ code: "custom", message });
  const colecciones = [n.nodos, n.muros, n.aberturas, n.columnas, n.electricos, n.ambientes, n.techos, n.molduras, n.vigas];
  for (const lista of colecciones) {
    const ids = lista.map((e) => e.id);
    if (new Set(ids).size !== ids.length) problema("Hay ids repetidos");
  }
  const nodos = new Set(n.nodos.map((x) => x.id));
  const muros = new Set(n.muros.map((m) => m.id));
  const ambientes = new Set(n.ambientes.map((a) => a.id));
  for (const m of n.muros) {
    if (!nodos.has(m.desde) || !nodos.has(m.hasta)) problema(`El muro ${m.id} apunta a un nodo inexistente`);
    if (m.desde === m.hasta) problema(`El muro ${m.id} empieza y termina en el mismo nodo`);
  }
  for (const a of n.aberturas) if (!muros.has(a.muroId)) problema(`La abertura ${a.codigo} no tiene muro`);
  for (const e of n.electricos) if (!muros.has(e.muroId)) problema(`El punto ${e.codigo} no tiene muro`);
  for (const a of n.ambientes)
    if (a.contorno.some((c) => !muros.has(c.muroId))) problema(`El ambiente ${a.nombre} usa un muro inexistente`);
  const techos = new Set(n.techos.map((t) => t.id));
  for (const t of n.techos) {
    if (t.ambienteId !== null && !ambientes.has(t.ambienteId)) problema(`La zona de techo ${t.id} apunta a un ambiente que no existe`);
    if (t.padreId !== null && !techos.has(t.padreId)) problema(`La bandeja ${t.id} no tiene su zona madre`);
    if (t.padreId === t.id) problema(`La bandeja ${t.id} es su propia madre`);
  }
  for (const m of n.molduras) {
    if (!ambientes.has(m.ambienteId)) problema(`La moldura ${m.id} no tiene ambiente`);
    if (m.caras.some((c) => !muros.has(c.muroId))) problema(`La moldura ${m.id} usa un muro inexistente`);
  }
});

export const controlSchema = z.object({
  tipo: z.enum(["error", "pendiente", "aviso"]),
  codigo: z.string(),
  mensaje: z.string(),
  nivelId: z.string().optional(),
  elemento: z.object({ tipo: z.string(), id: z.string() }).optional(),
});

/**
 * La geometría que resuelve el motor, escrita en el archivo para que el botón
 * de pyRevit no tenga que volver a calcular esquinas (ajuste 7).
 */
export const calculadoSchema = z.object({
  niveles: z.array(
    z.object({
      id,
      muros: z.array(z.object({ id, inicio: puntoSchema, fin: puntoSchema, largo: z.number() })),
      /** Las esquinas de cada cara, para las molduras que recorren solo algunos lados. */
      caras: z
        .array(z.object({ muroId: id, cara: nombreCaraSchema, desde: puntoSchema, hasta: puntoSchema }))
        .default([]),
      aberturas: z.array(z.object({ id, centro: puntoSchema, hastaEsquina: z.number() })),
      electricos: z.array(z.object({ id, punto: puntoSchema })).default([]),
      ambientes: z.array(
        z.object({
          id,
          contorno: z.array(puntoSchema),
          superficie: z.number(),
          perimetro: z.number(),
          puntoInterior: puntoSchema,
        }),
      ),
      controles: z.array(controlSchema),
    }),
  ),
});

export const proyectoSchema = z.object({
  contactoId: z.string(),
  nombre: z.string(),
  direccion: z.string(),
  fechaRelevamiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const relevamientoSchema = z.object({
  formato: z.literal("ba-relevamiento"),
  version: z.literal(2),
  unidades: z.literal("cm"),
  proyecto: proyectoSchema,
  niveles: z.array(nivelSchema).min(1),
  calculado: calculadoSchema.optional(),
});

export type Medida = z.infer<typeof medidaSchema>;
export type NombreCara = z.infer<typeof nombreCaraSchema>;
export type RefCara = z.infer<typeof refCaraSchema>;
export type Nodo = z.infer<typeof nodoSchema>;
export type Muro = z.infer<typeof muroSchema>;
export type TipoAbertura = z.infer<typeof tipoAberturaSchema>;
export type Abertura = z.infer<typeof aberturaSchema>;
export type Columna = z.infer<typeof columnaSchema>;
export type TipoPunto = z.infer<typeof tipoPuntoSchema>;
export type PuntoElectrico = z.infer<typeof puntoElectricoSchema>;
export type Ambiente = z.infer<typeof ambienteSchema>;
export type ZonaTecho = z.infer<typeof zonaTechoSchema>;
export type Moldura = z.infer<typeof molduraSchema>;
export type Viga = z.infer<typeof vigaSchema>;
export type Nivel = z.infer<typeof nivelSchema>;
export type Control = z.infer<typeof controlSchema>;
export type Calculado = z.infer<typeof calculadoSchema>;
export type Proyecto = z.infer<typeof proyectoSchema>;
export type Relevamiento = z.infer<typeof relevamientoSchema>;

export const medida = (valor: number, tomada = false): Medida => ({ valor: Math.round(valor), tomada });

export function nivelVacio(idNivel: string, nombre: string, cotaPiso = 0): Nivel {
  return {
    id: idNivel,
    nombre,
    cotaPiso,
    alturaGeneral: medida(ALTURA_POR_DEFECTO),
    nodos: [],
    muros: [],
    aberturas: [],
    columnas: [],
    electricos: [],
    ambientes: [],
    techos: [],
    molduras: [],
    vigas: [],
  };
}

export function relevamientoVacio(proyecto: Proyecto): Relevamiento {
  return {
    formato: "ba-relevamiento",
    version: 2,
    unidades: "cm",
    proyecto,
    niveles: [nivelVacio("nivel-1", "Planta baja")],
  };
}

/**
 * Ids deterministas: el número siguiente al mayor que ya existe con ese
 * prefijo (ajuste 11). El número tiene que seguir directo al prefijo, así
 * "mol7" no cuenta como un muro "m".
 */
export function siguienteId(ids: string[], prefijo: string): string {
  const patron = new RegExp(`^${prefijo}(\\d+)$`);
  let mayor = 0;
  for (const i of ids) {
    const m = patron.exec(i);
    if (m) mayor = Math.max(mayor, Number(m[1]));
  }
  return `${prefijo}${mayor + 1}`;
}

export const siguienteIdNivel = (r: Relevamiento): string =>
  siguienteId(r.niveles.map((n) => n.id), "nivel-");

const LETRA: Record<TipoAbertura, string> = { puerta: "P", ventana: "V", vano: "A" };

/** P1, V1, A1: únicos en todo el relevamiento, por eso recibe los códigos de todos los niveles. */
export const siguienteCodigo = (codigos: string[], tipo: TipoAbertura): string =>
  siguienteId(codigos, LETRA[tipo]);
