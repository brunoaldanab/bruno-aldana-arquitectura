export type TipoProyecto = "" | "vivienda" | "oficina" | "ambiente-unico" | "construccion";

/** Reacción de ESTE cliente a una foto de la biblioteca compartida. */
export interface FotoReaccion {
  reaction: string;
  rating: number;
  comment: string;
}

export interface EstiloDetalle {
  reacciones: Record<string, FotoReaccion>;
  notas: string;
}

export interface Rol {
  id: string;
  nombre: string;
  funcion: string;
  recibeClientes: string;
  recorrido: string;
  mobiliario: string[];
  equipo: string[];
  instalaciones: string[];
  almacenamiento: string[];
  organizacion: string;
  tecnologia: string[];
  conectaCon: string[];
  conexionDetalle: string;
  cruces: string;
  confort: string[];
  notas: string;
}

export interface AmbienteDetalle {
  mobiliario: string[];
  iluminacion: string[];
  comprarNotas: string;
  respuestas: Record<string, string>;
  funcional: string[];
}

/**
 * El resultado del torneo de fotos.
 *
 * Se guarda para que sobreviva al cambio de paso —antes vivía solo en la memoria
 * del componente y volver al duelo obligaba a rehacerlo entero, delante del
 * cliente— y para que la propuesta pueda usar la foto ganadora como portada.
 *
 * Se guarda el id de la foto y no la foto: la imagen ya vive en la biblioteca
 * compartida, y copiar su base64 acá inflaría el JSON de cada entrevista.
 */
export interface DueloResultado {
  fotoId: string;
  styleKey: string;
  styleName: string;
  rating: number;
  reaction: string;
  /** Cuándo se cerró el torneo, en ISO. */
  decididoEn: string;
}

export interface EntrevistaState {
  proyecto: {
    tipoProyecto: TipoProyecto;
    cliente: string;
    tipo: string;
    direccion: string;
    fecha: string;
    m2: string;
    integrantes: string;
    contacto: string;
  };
  ambientesSeleccion: string[];
  oficina: {
    personas: string;
    modalidad: string;
    salaReuniones: string;
    identidadMarca: string;
    tecnologia: string;
    acustica: string;
    visitas: string;
    horario: string;
    funcional: string[];
  };
  roles: Rol[];
  estilo: {
    seleccion: string[];
    atemporalidad: number;
    densidad: string;
    refs: string;
  };
  estiloDetalle: Record<string, EstiloDetalle>;
  mobiliarioGaleria: {
    seleccion: string[];
    detalle: Record<string, EstiloDetalle>;
  };
  paleta: {
    seleccion: string[];
    base: string[];
    evitar: string[];
    calidoFrio: number;
    notas: string;
    customColores: { n: string; h: string }[];
  };
  paletaOficina: {
    seleccion: string[];
  };
  materiales: {
    seleccion: string[];
    notas: string;
  };
  ambientesDetalle: Record<string, AmbienteDetalle>;
  mobiliario: {
    reutilizar: string;
    noNegociables: string;
    electrodomesticos: string;
    arte: string;
  };
  presupuesto: {
    monto: string;
    distribucion: string;
    incluyeObra: string;
    flexible: string;
  };
  plazos: {
    fecha: string;
    motivo: string;
    etapas: string;
  };
  cierre: {
    evitar: string;
    palabra: string;
    pendientes: string;
  };
  /**
   * Opcional a propósito: las entrevistas guardadas antes de que esto existiera
   * no tienen el campo, y `Entrevista.data` es una columna JSON sin migración.
   */
  duelo?: DueloResultado | null;
}

export function createInitialEntrevistaState(): EntrevistaState {
  return {
    proyecto: {
      tipoProyecto: "",
      cliente: "",
      tipo: "",
      direccion: "",
      fecha: "",
      m2: "",
      integrantes: "",
      contacto: "",
    },
    ambientesSeleccion: [],
    oficina: {
      personas: "",
      modalidad: "",
      salaReuniones: "",
      identidadMarca: "",
      tecnologia: "",
      acustica: "",
      visitas: "",
      horario: "",
      funcional: [],
    },
    roles: [],
    estilo: { seleccion: [], atemporalidad: 5, densidad: "equilibrado", refs: "" },
    estiloDetalle: {},
    mobiliarioGaleria: { seleccion: [], detalle: {} },
    paleta: { seleccion: [], base: [], evitar: [], calidoFrio: 5, notas: "", customColores: [] },
    paletaOficina: { seleccion: [] },
    materiales: { seleccion: [], notas: "" },
    ambientesDetalle: {},
    mobiliario: { reutilizar: "", noNegociables: "", electrodomesticos: "", arte: "" },
    presupuesto: { monto: "", distribucion: "", incluyeObra: "", flexible: "" },
    plazos: { fecha: "", motivo: "", etapas: "" },
    cierre: { evitar: "", palabra: "", pendientes: "" },
    duelo: null,
  };
}
