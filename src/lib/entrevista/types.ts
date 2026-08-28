export type TipoProyecto = "" | "vivienda" | "oficina" | "ambiente-unico" | "construccion";

export interface FotoRef {
  dataUrl: string;
  reaction: string;
  rating: number;
  comment: string;
}

export interface EstiloDetalle {
  fotos: FotoRef[];
  notas: string;
  audios: { url: string; name: string }[];
}

export interface CardPersonalizada {
  k: string;
  t: string;
  mood: string;
  d: string;
  facts: { k: string; v: string }[];
  custom: true;
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

export interface OfficePaletteDetalle {
  fotos: (string | null)[];
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
  estilosPersonalizados: Record<string, CardPersonalizada[]>;
  mobiliarioGaleria: {
    seleccion: string[];
    detalle: Record<string, EstiloDetalle>;
  };
  mobiliarioTiposPersonalizados: Record<string, CardPersonalizada[]>;
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
    detalle: Record<string, OfficePaletteDetalle>;
    personalizadas: unknown[];
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
    estilosPersonalizados: {},
    mobiliarioGaleria: { seleccion: [], detalle: {} },
    mobiliarioTiposPersonalizados: {},
    paleta: { seleccion: [], base: [], evitar: [], calidoFrio: 5, notas: "", customColores: [] },
    paletaOficina: { seleccion: [], detalle: {}, personalizadas: [] },
    materiales: { seleccion: [], notas: "" },
    ambientesDetalle: {},
    mobiliario: { reutilizar: "", noNegociables: "", electrodomesticos: "", arte: "" },
    presupuesto: { monto: "", distribucion: "", incluyeObra: "", flexible: "" },
    plazos: { fecha: "", motivo: "", etapas: "" },
    cierre: { evitar: "", palabra: "", pendientes: "" },
  };
}
