import {
  DIAS_HABILES_MINIMO,
  M2_POR_DIA_HABIL,
  PORCENTAJE_ANTICIPO,
  TARIFA_M2,
  VALIDEZ_DIAS,
} from "./constantes";

/**
 * Lee la superficie del campo de texto de la entrevista.
 *
 * El campo es libre y la gente escribe "77", "77 m2" o "77,5". Se toma el primer
 * número que aparezca: quitar los caracteres no numéricos no sirve, porque el
 * "2" de "m2" quedaría pegado al número.
 */
export function parsearM2(texto: string): number | null {
  const encontrado = texto.replace(",", ".").match(/\d+(\.\d+)?/);
  if (!encontrado) return null;
  const n = Number.parseFloat(encontrado[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Precio del diseño: tarifa única por metro cuadrado, sin pisos ni excepciones. */
export function precioDiseno(m2: number): number {
  return Math.round(m2 * TARIFA_M2);
}

/** Plazo de entrega en días hábiles. */
export function plazoDiasHabiles(m2: number): number {
  return Math.max(DIAS_HABILES_MINIMO, Math.round(m2 / M2_POR_DIA_HABIL));
}

/**
 * Reparte el precio en anticipo y saldo.
 *
 * El saldo se calcula restando y no multiplicando por 0,7: si los dos se
 * redondearan por separado, podrían no sumar el total y el cliente vería una
 * cuenta que no cierra.
 */
export function reparto(precio: number): { anticipo: number; saldo: number } {
  const anticipo = Math.round(precio * PORCENTAJE_ANTICIPO);
  return { anticipo, saldo: precio - anticipo };
}

/** Hasta cuándo vale la propuesta, contando días corridos. */
export function fechaVencimiento(emision: Date): Date {
  const vence = new Date(emision);
  vence.setDate(vence.getDate() + VALIDEZ_DIAS);
  return vence;
}

/**
 * Formatea un monto en bolivianos.
 *
 * El separador se arma a mano en vez de usar `Intl`: así el resultado no depende
 * de qué datos de idioma tenga instalados el servidor donde corre.
 */
export function formatearBs(monto: number): string {
  const entero = Math.round(monto).toString();
  return `Bs ${entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/** Fecha en día/mes/año, que es el formato que se usa en Bolivia. */
export function formatearFecha(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

/** Una línea del desglose: qué se cobra por un ambiente y por qué. */
export interface LineaAmbiente {
  ambiente: string;
  m2: number;
  /** Lo que se cobra por este ambiente: su superficie a la tarifa única. */
  cobra: number;
}

/**
 * Desglosa el precio ambiente por ambiente.
 *
 * Cada ambiente se cobra por su superficie a la tarifa única. El desglose existe
 * para que el cliente vea de dónde sale el total, no para aplicar reglas
 * distintas por ambiente.
 *
 * Devuelve `null` si falta la superficie de aunque sea un ambiente: un desglose
 * a medias cobraría de menos sin que se note.
 */
export function desglosePorAmbiente(
  ambientes: string[],
  superficies: Record<string, string> | undefined
): LineaAmbiente[] | null {
  if (ambientes.length === 0) return null;

  const lineas: LineaAmbiente[] = [];
  for (const ambiente of ambientes) {
    const m2 = parsearM2(superficies?.[ambiente] ?? "");
    if (m2 === null) return null;
    const cobra = Math.round(m2 * TARIFA_M2);
    lineas.push({ ambiente, m2, cobra });
  }
  return lineas;
}

/** Suma de un desglose. */
export function sumaDesglose(lineas: LineaAmbiente[]): number {
  return lineas.reduce((total, l) => total + l.cobra, 0);
}
