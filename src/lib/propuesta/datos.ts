import { paletteDefs, styleCards } from "@/lib/entrevista/data";
import { fotoPortada } from "@/lib/entrevista/duelo";
import { ordenarPorPuntaje } from "@/lib/entrevista/puntaje";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import type { EntrevistaState, TipoProyecto } from "@/lib/entrevista/types";
import {
  desglosePorAmbiente,
  sumaDesglose,
  fechaVencimiento,
  formatearBs,
  formatearFecha,
  parsearM2,
  plazoDiasHabiles,
  precioDiseno,
  reparto,
} from "./calculo";
import { TARIFA_M2 } from "./constantes";
import type { ColorPaleta, PropuestaData } from "./tipos";

export interface EntradaPropuesta {
  nombreCliente: string;
  state: EntrevistaState;
  galeria: GaleriaData;
  /** Se inyecta para que las pruebas no dependan del día en que corren. */
  emision: Date;
}

const TITULO_POR_TIPO: Record<TipoProyecto, string> = {
  "": "Propuesta de diseño",
  vivienda: "Diseño integral de vivienda",
  oficina: "Diseño integral de oficina",
  "ambiente-unico": "Diseño de ambiente",
  construccion: "Diseño y construcción",
};

/** Traduce claves internas a los nombres que ve el cliente. */
function nombresDe(claves: string[], catalogo: { k: string; t: string }[]): string[] {
  return claves.map((k) => catalogo.find((c) => c.k === k)?.t ?? k);
}

export function armarPropuesta(entrada: EntradaPropuesta): PropuestaData | { falta: "m2" } {
  const { nombreCliente, state, galeria, emision } = entrada;

  // Primero el desglose ambiente por ambiente, que es la forma correcta de
  // cobrar: el mínimo se aplica a cada espacio chico por separado. Solo si falta
  // alguna superficie se cae en el total del proyecto, que es una aproximación.
  const lineas = desglosePorAmbiente(state.ambientesSeleccion, state.superficies);

  // Sin superficie no hay precio, y un precio inventado es peor que ninguno.
  const m2 = lineas
    ? lineas.reduce((total, l) => total + l.m2, 0)
    : parsearM2(state.proyecto.m2);
  if (m2 === null) return { falta: "m2" };

  const precio = lineas ? sumaDesglose(lineas) : precioDiseno(m2);
  const { anticipo, saldo } = reparto(precio);

  const estilosCatalogo = [
    ...styleCards.map((c) => ({ k: c.k, t: c.t })),
    ...galeria.estiloCustom.map((c) => ({ k: c.key, t: c.titulo })),
  ];

  // En orden de preferencia: la paleta que más le gustó encabeza la propuesta.
  // El puntaje en sí es una nota de trabajo y no se le muestra al cliente; lo
  // que sí se le muestra es la consecuencia, que es el orden.
  const paleta: ColorPaleta[] = ordenarPorPuntaje(state.paleta.seleccion, state.paleta.puntajes).flatMap((clave) => {
    const def = paletteDefs.find((p) => p.key === clave);
    if (!def) return [];
    return def.colores.map((c) => ({ nombre: c.n, hex: c.h }));
  });

  return {
    nombreCliente,
    titulo: TITULO_POR_TIPO[state.proyecto.tipoProyecto],
    portada: fotoPortada(state, galeria),
    emisionTexto: formatearFecha(emision),
    venceTexto: formatearFecha(fechaVencimiento(emision)),

    palabra: state.cierre.palabra,
    evitar: state.cierre.evitar,
    estilos: nombresDe(state.estilo.seleccion, estilosCatalogo),
    ambientes: state.ambientesSeleccion,
    // El paso de materiales ya guarda el nombre visible ("Madera clara"), no una
    // clave: acá no hay nada que traducir.
    materiales: state.materiales.seleccion,
    paleta,

    m2,
    m2Texto: `${String(m2).replace(".", ",")} m²`,
    lineas,
    cantidadAmbientes: state.ambientesSeleccion.length,
    precio,
    precioTexto: formatearBs(precio),
    tarifaTexto: `Bs ${TARIFA_M2}/m²`,
    anticipoTexto: formatearBs(anticipo),
    saldoTexto: formatearBs(saldo),
    plazoDias: plazoDiasHabiles(m2),
  };
}
