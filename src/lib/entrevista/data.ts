import type { TipoProyecto } from "./types";

export const ambientesDepto = [
  "Living / Comedor",
  "Cocina",
  "Dormitorio principal",
  "Dormitorio(s) secundario(s)",
  "Baño(s)",
  "Balcón",
  "Lavandería / área de servicio",
  "Home office",
];

export const ambientesCasa = [
  "Living / Comedor",
  "Cocina",
  "Dormitorio principal",
  "Dormitorio(s) secundario(s)",
  "Baño(s)",
  "Jardín / patio",
  "Garaje",
  "Lavandería / área de servicio",
  "Home office",
  "Quincho / parrillero",
  "Piscina",
  "Sala de estar / TV",
];

export const ambientesOficina = [
  "Recepción",
  "Puestos de trabajo / open space",
  "Oficinas privadas",
  "Sala de reuniones",
  "Kitchenette / office",
  "Baños",
  "Gerencia",
  "Sala de espera",
  "Comedor / break room",
  "Depósito / archivo",
];

export const ambientesUnico = [
  "Dormitorio",
  "Cocina",
  "Baño",
  "Living / Estar",
  "Comedor",
  "Home office",
  "Balcón / terraza",
  "Otro",
];

export const tiposProyecto: { k: TipoProyecto; t: string; d: string; icon: string; disabled: boolean }[] = [
  { k: "vivienda", t: "Vivienda completa", d: "Departamento o casa — todos los ambientes", icon: "⌂", disabled: false },
  { k: "oficina", t: "Oficina / local comercial", d: "Espacio de trabajo o atención al público", icon: "▣", disabled: false },
  { k: "ambiente-unico", t: "Un solo ambiente", d: "Cocina, dormitorio, baño... un espacio puntual", icon: "◧", disabled: false },
  { k: "construccion", t: "Construcción de vivienda", d: "Obra nueva desde el terreno", icon: "△", disabled: true },
];

export const officeFuncionalGroups = [
  {
    categoria: "Ergonomía de puestos",
    items: [
      "Escritorio de altura ajustable (sit-stand)",
      "Silla con soporte lumbar ajustable",
      "Reposabrazos ajustables",
      "Monitor a la altura de los ojos",
      "Distancia ojo-pantalla 50-70cm",
      "Reposapiés donde se necesite",
    ],
  },
  {
    categoria: "Circulación y accesibilidad",
    items: [
      "Pasillos con mínimo 90cm de ancho",
      "Accesibilidad para movilidad reducida (rampas, anchos de puerta)",
      "Rutas de evacuación despejadas y señalizadas",
      "Puertas de salas de reunión con apertura hacia afuera",
    ],
  },
  {
    categoria: "Infraestructura eléctrica y de datos",
    items: [
      "Mínimo 2-3 tomas eléctricas por puesto",
      "Cableado de red estructurado",
      "Puntos de carga USB integrados en mobiliario",
      "Respaldo eléctrico (UPS) para equipos críticos",
    ],
  },
  {
    categoria: "Climatización y confort ambiental",
    items: ["Climatización zonificada por área", "Control de temperatura accesible", "Ventilación cruzada o mecánica adecuada"],
  },
  {
    categoria: "Acústica",
    items: [
      "Aislación entre salas de reunión y open space",
      "Cabinas fonoabsorbentes para llamadas",
      "Materiales que absorban ruido (alfombras, paneles)",
    ],
  },
  {
    categoria: "Seguridad",
    items: ["Salidas de emergencia señalizadas", "Extintores accesibles", "Control de acceso (tarjetas / biometría)"],
  },
  {
    categoria: "Tecnología",
    items: ["Pantallas para videoconferencia en salas", "Wifi de alta densidad (muchos dispositivos)", "Sistema de reserva de salas"],
  },
];

export const rolMobiliarioOpciones = [
  "Escritorio individual",
  "Escritorio grande (doble uso)",
  "Escritorio compartido",
  "Mostrador / counter",
  "Cajonera con llave",
  "Vitrina de exhibición",
  "Sillón de espera para visitas (cuántos asientos)",
  "Mesa de reuniones propia",
  "Estación de pie / mostrador rápido",
  "Silla ergonómica",
  "Repisa/estante abierto",
  "Perchero",
];

export const rolEquipoOpciones = [
  "Computadora de escritorio",
  "Laptop",
  "Doble monitor",
  "Un solo monitor",
  "Impresora/escáner propio",
  "Terminal POS / caja registradora",
  "Teléfono fijo",
  "Lector de tickets/turnos",
  "Calculadora/báscula",
  "Radio o intercomunicador",
];

export const rolAlmacenamientoOpciones = [
  "Archivador visible",
  "Archivador oculto",
  "Caja fuerte",
  "Bóveda de documentos",
  "Estante de catálogos/muestras",
  "Casillero personal",
  "Guardado de objetos personales (cartera, abrigo)",
];

export const rolTecnologiaOpciones = [
  "Cámara de seguridad en su zona",
  "Monitor/TV para visualizar cámaras",
  "Sistema de tickets / turnos",
  "Caja registradora / POS",
  "Teléfono fijo",
  "Impresora / escáner",
  "Terminal de tarjetas",
  "Radio / intercomunicador",
];

export const rolConfortOpciones = [
  "A/C dedicado en su zona",
  "Iluminación de tarea reforzada",
  "Necesita privacidad acústica",
  "Necesita privacidad visual",
];

export const rolInstalacionesOpciones = [
  "2 tomas de corriente",
  "4 tomas de corriente",
  "6+ tomas de corriente",
  "Punto de red / internet por cable",
  "Wifi es suficiente",
  "Regulador/UPS (equipo sensible a cortes)",
  "Cable a la vista aceptable",
  "Cableado debe quedar oculto",
];

export function nuevoRol(): import("./types").Rol {
  return {
    id: "rol_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    nombre: "",
    funcion: "",
    recibeClientes: "",
    recorrido: "",
    mobiliario: [],
    equipo: [],
    instalaciones: [],
    almacenamiento: [],
    organizacion: "",
    tecnologia: [],
    conectaCon: [],
    conexionDetalle: "",
    cruces: "",
    confort: [],
    notas: "",
  };
}
