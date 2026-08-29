import type { FotoCampeon } from "@/lib/entrevista/duelo";

/** Un color de la paleta elegida, listo para pintar un cuadradito. */
export interface ColorPaleta {
  nombre: string;
  hex: string;
}

/**
 * Todo lo que la propuesta necesita para renderizarse, ya calculado y formateado.
 *
 * La página no hace cuentas ni consulta la base: recibe esto y lo dibuja.
 */
export interface PropuestaData {
  /* Portada */
  nombreCliente: string;
  titulo: string;
  portada: FotoCampeon | null;
  emisionTexto: string;
  venceTexto: string;

  /* Lo que nos dijiste */
  palabra: string;
  evitar: string;
  estilos: string[];
  ambientes: string[];
  materiales: string[];
  paleta: ColorPaleta[];

  /* Inversión */
  m2: number;
  m2Texto: string;
  cantidadAmbientes: number;
  precio: number;
  precioTexto: string;
  tarifaTexto: string;
  anticipoTexto: string;
  saldoTexto: string;
  plazoDias: number;
}
