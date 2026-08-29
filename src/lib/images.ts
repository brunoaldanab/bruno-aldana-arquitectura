import type { StepId } from "@/lib/entrevista/steps";
import type { TipoProyecto } from "@/lib/entrevista/types";

/**
 * Fotos de stock (Pexels, uso libre) usadas como piel visual del sistema.
 * Cada clave es un solo lugar de uso — para cambiar una imagen que no convenza,
 * alcanza con reemplazar esa URL. No requiere API key: son URLs directas al CDN
 * de Pexels (`images.pexels.com/photos/{id}/...`), pedí `w=` mayor si hace falta
 * más resolución.
 */
export const images = {
  /** Texturas para las 8 tarjetas de MaterialesStep (ficha de entrevista). */
  materials: {
    maderaClara: "https://images.pexels.com/photos/314071/pexels-photo-314071.jpeg?auto=compress&cs=tinysrgb&w=900",
    maderaOscura: "https://images.pexels.com/photos/4709011/pexels-photo-4709011.jpeg?auto=compress&cs=tinysrgb&w=900",
    marmol: "https://images.pexels.com/photos/6634139/pexels-photo-6634139.jpeg?auto=compress&cs=tinysrgb&w=900",
    piedraOscura: "https://images.pexels.com/photos/3707669/pexels-photo-3707669.jpeg?auto=compress&cs=tinysrgb&w=900",
    metalNegro: "https://images.pexels.com/photos/6800730/pexels-photo-6800730.jpeg?auto=compress&cs=tinysrgb&w=900",
    laton: "https://images.pexels.com/photos/3544171/pexels-photo-3544171.jpeg?auto=compress&cs=tinysrgb&w=900",
    cemento: "https://images.pexels.com/photos/11254898/pexels-photo-11254898.jpeg?auto=compress&cs=tinysrgb&w=900",
    lino: "https://images.pexels.com/photos/7794365/pexels-photo-7794365.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
} as const;

/**
 * Una foto del sistema, con su corrección de brillo individual.
 *
 * El grado global (saturación, contraste, tinte plomo) vive en `globals.css` y
 * es igual para todas. Pero un grado global no puede emparejar fotos que nacen
 * con exposiciones distintas: subir las oscuras y bajar las claras al mismo
 * tiempo requiere un valor por foto, que es este `brillo`.
 *
 * Cada valor está calculado para llevar esa foto a una luminancia media de 0.22
 * medida en canvas. Medido sobre el set completo, el grado más estas
 * correcciones bajan la dispersión de luminancia entre fotos de 0.123 a 0.011
 * (−91%) y la de saturación de 0.113 a 0.049 (−56%): por eso el conjunto se lee
 * como un sistema y no como fotos sueltas.
 *
 * Si cambiás una foto, ajustá su brillo entre 0.45 y 2.6 hasta que pese lo mismo
 * que las vecinas: por encima de 1 aclara, por debajo oscurece.
 */
export interface Foto {
  src: string;
  brillo: number;
}

/** Arma una foto de Pexels con su corrección de brillo. */
const foto = (id: number, brillo: number, w = 1920): Foto => ({
  src: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`,
  brillo,
});

/**
 * Una escena = la foto de fondo que acompaña a un paso de la entrevista, más el
 * texto corto que se sobreimprime. La foto responde a lo que se está hablando en
 * ese momento: planos cuando se cargan datos, obra cuando se hablan plazos,
 * muestrarios cuando se elige la paleta.
 */
export interface Escena {
  /** Foto por defecto del paso, sirva el proyecto que sirva. */
  foto: Foto;
  /** Frase corta que se sobreimprime sobre la foto. */
  kicker: string;
  /**
   * Variantes por tipo de proyecto: una oficina y un departamento no se ilustran
   * con la misma imagen. Si el tipo no está acá, se usa `foto`.
   */
  porTipo?: Partial<Record<TipoProyecto, Foto>>;
}

/**
 * Catálogo de escenas de la ficha de entrevista, una por paso.
 *
 * Para cambiar cualquier foto alcanza con reemplazar su `foto(id, brillo)` — el
 * número es el id de la foto en Pexels (`pexels.com/photo/<id>`). Todas fueron
 * elegidas midiendo luminancia y saturación, no a ojo: quedan en clave oscura y
 * desaturada para que el texto blanco encima se lea sin pelear con la imagen.
 */
export const escenasEntrevista: Record<StepId, Escena> = {
  "tipo-proyecto": {
    foto: foto(14927772, 1.13),
    kicker: "El punto de partida",
  },
  "datos-generales": {
    foto: foto(10375938, 0.45),
    kicker: "Los datos del proyecto",
  },
  ambientes: {
    foto: foto(13722886, 0.86),
    kicker: "Los espacios a intervenir",
    porTipo: {
      oficina: foto(13219418, 1.08),
      "ambiente-unico": foto(13722858, 1.84),
    },
  },
  oficina: {
    foto: foto(10922371, 1.56),
    kicker: "Cómo se trabaja acá",
  },
  roles: {
    foto: foto(13977666, 0.96),
    kicker: "Quién usa cada espacio",
  },
  estilo: {
    foto: foto(13212791, 1.34),
    kicker: "El carácter del espacio",
  },
  duelo: {
    foto: foto(13705213, 1.24),
    kicker: "Qué pesa más",
  },
  "mobiliario-galeria": {
    foto: foto(12127447, 0.79),
    kicker: "Las piezas que lo habitan",
  },
  paleta: {
    foto: foto(12800841, 0.77),
    kicker: "El color del proyecto",
  },
  materiales: {
    foto: foto(18624456, 2.55),
    kicker: "Lo que se toca",
  },
  "detalle-ambientes": {
    foto: foto(10831155, 0.96),
    kicker: "Ambiente por ambiente",
  },
  "mobiliario-existente": {
    foto: foto(12885119, 1.53),
    kicker: "Lo que ya está",
  },
  presupuesto: {
    foto: foto(16960657, 2.58),
    kicker: "El marco económico",
  },
  plazos: {
    foto: foto(12314551, 0.72),
    kicker: "Los tiempos de obra",
  },
  cierre: {
    foto: foto(12689707, 0.89),
    kicker: "Lo que falta acordar",
  },
  resumen: {
    foto: foto(13722861, 1.14),
    kicker: "Todo junto",
  },
};

/**
 * Fondos de pantalla completa, con la misma corrección de exposición que las
 * escenas de la entrevista para que todo el sistema pese igual.
 */
export const fondos = {
  /** Portada del estudio: interior de luz cenital, con una gran zona en sombra
   *  donde el título entra sin pelear con la foto. */
  home: foto(10883155, 2.01),
  /** Login: interior minimalista de comedor, atmosférico y tranquilo. */
  login: foto(17066896, 0.6, 1600),
} as const;

/** Devuelve la foto que corresponde a un paso según el tipo de proyecto. */
export function escenaDePaso(stepId: StepId, tipoProyecto: TipoProyecto): Escena {
  const escena = escenasEntrevista[stepId];
  return { ...escena, foto: escena.porTipo?.[tipoProyecto] ?? escena.foto };
}
