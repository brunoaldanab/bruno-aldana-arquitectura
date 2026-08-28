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
  };
}
