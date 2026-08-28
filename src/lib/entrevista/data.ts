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

export interface StyleCard {
  k: string;
  t: string;
  mood: string;
  d: string;
  facts: { k: string; v: string }[];
  custom?: true;
}

export const styleCards: StyleCard[] = [
  {
    k: "minimalista",
    t: "Moderno minimalista",
    mood: "Calma · Orden · Precisión",
    d: "Líneas limpias, poco ornamento, funcional",
    facts: [
      { k: "De qué se trata", v: "Menos elementos, mejor elegidos. Superficies limpias, guardado oculto, casi nada a la vista." },
      { k: "Materiales típicos", v: "Madera clara sin veta marcada, laca mate, piedra lisa, metal cepillado." },
      { k: "Ideal para", v: "Quien prioriza el orden visual y no quiere \"pensar\" al mirar el espacio." },
      { k: "Cuidado con", v: "Puede sentirse frío o impersonal si no se suma textura o algún objeto con historia." },
    ],
  },
  {
    k: "calido",
    t: "Cálido contemporáneo",
    mood: "Confort · Cercanía · Hogar",
    d: "Formas suaves, madera visible, confort",
    facts: [
      { k: "De qué se trata", v: "Líneas modernas pero con materiales nobles a la vista — madera, lino, cerámica artesanal." },
      { k: "Materiales típicos", v: "Madera con veta visible, textiles gruesos, cerámica, mimbre." },
      { k: "Ideal para", v: "Familias que buscan un espacio moderno pero que \"abrace\", no que impresione." },
      { k: "Cuidado con", v: "Sin curaduría puede desordenarse visualmente — cada pieza debe ganarse su lugar." },
    ],
  },
  {
    k: "clasico",
    t: "Clásico renovado",
    mood: "Elegancia · Permanencia",
    d: "Molduras, simetría, detalles sobrios",
    facts: [
      { k: "De qué se trata", v: "Proporciones simétricas, molduras o zócalos marcados, mobiliario con presencia." },
      { k: "Materiales típicos", v: "Madera oscura, mármol, textiles con caída, herrajes en bronce." },
      { k: "Ideal para", v: "Quien quiere un espacio \"que no pase de moda\" y con cierta formalidad." },
      { k: "Cuidado con", v: "Sin actualizarlo con piezas contemporáneas puede sentirse pesado o anticuado." },
    ],
  },
  {
    k: "industrial",
    t: "Industrial / loft",
    mood: "Carácter · Crudeza · Urbano",
    d: "Estructura vista, materiales crudos",
    facts: [
      { k: "De qué se trata", v: "La estructura se muestra en lugar de esconderse — cemento, metal, instalaciones vistas." },
      { k: "Materiales típicos", v: "Cemento alisado, metal negro, ladrillo visto, cuero envejecido." },
      { k: "Ideal para", v: "Espacios de techos altos, o clientes con gusto urbano y poco convencional." },
      { k: "Cuidado con", v: "Puede resultar duro o ruidoso acústicamente si no se compensa con textiles." },
    ],
  },
  {
    k: "escandinavo",
    t: "Escandinavo",
    mood: "Luz · Simpleza · Frescura",
    d: "Formas simples, mucha luz, orden",
    facts: [
      { k: "De qué se trata", v: "Funcionalidad nórdica: pocos objetos, mucha luz natural, madera clara constante." },
      { k: "Materiales típicos", v: "Madera de pino o roble claro, lana, lino blanco, metal delgado." },
      { k: "Ideal para", v: "Espacios con poca luz natural, o clientes que buscan sensación de amplitud." },
      { k: "Cuidado con", v: "Sin un acento de color puede sentirse todo igual, sin punto focal." },
    ],
  },
  {
    k: "bohemio",
    t: "Bohemio ecléctico",
    mood: "Expresión · Historia · Textura",
    d: "Formas orgánicas, mezcla de piezas",
    facts: [
      { k: "De qué se trata", v: "Mezcla curada de objetos, texturas y orígenes — cada pieza cuenta una historia." },
      { k: "Materiales típicos", v: "Fibras naturales, cerámica pintada, textiles con patrones, madera rústica." },
      { k: "Ideal para", v: "Clientes coleccionistas, viajeros, o que no quieren un espacio \"de catálogo\"." },
      { k: "Cuidado con", v: "El límite entre \"curado\" y \"desordenado\" es fino — requiere buen ojo de composición." },
    ],
  },
];

export const mobiliarioCardsBase: StyleCard[] = [
  {
    k: "contemporaneo",
    t: "Contemporáneo",
    mood: "Actual · Versátil",
    d: "Líneas rectas, funcional, se adapta a cualquier estilo",
    facts: [
      { k: "De qué se trata", v: "Mobiliario de líneas simples que envejece bien y combina fácil." },
      { k: "Materiales típicos", v: "Madera + metal, tapizados lisos." },
      { k: "Ideal para", v: "Proyectos que buscan versatilidad a largo plazo." },
      { k: "Cuidado con", v: "Puede sentirse genérico sin un acento distintivo." },
    ],
  },
  {
    k: "clasico-mueble",
    t: "Clásico / Tradicional",
    mood: "Elegante · Atemporal",
    d: "Formas curvas, maderas nobles, detalles tallados",
    facts: [
      { k: "De qué se trata", v: "Piezas con historia, proporciones clásicas y materiales nobles." },
      { k: "Materiales típicos", v: "Madera maciza, tapizados con textura, herrajes metálicos." },
      { k: "Ideal para", v: "Espacios formales o de alto perfil." },
      { k: "Cuidado con", v: "Requiere curaduría para no sentirse recargado." },
    ],
  },
  {
    k: "modular",
    t: "Modular / Sistema",
    mood: "Flexible · Escalable",
    d: "Piezas que se combinan y reconfiguran según necesidad",
    facts: [
      { k: "De qué se trata", v: "Mobiliario pensado para crecer o reorganizarse sin comprar de nuevo." },
      { k: "Materiales típicos", v: "Melamina, metal, sistemas de rieles." },
      { k: "Ideal para", v: "Espacios que cambian de uso o de tamaño de equipo." },
      { k: "Cuidado con", v: "La estética puede quedar en segundo plano frente a la función." },
    ],
  },
];

export interface PaletteDef {
  key: string;
  nombre: string;
  colores: { n: string; h: string }[];
  psicologia: string;
}

export const paletteDefs: PaletteDef[] = [
  {
    key: "elegante-oscuro",
    nombre: "Minimalista Elegante",
    colores: [
      { n: "Negro grafito", h: "#1C1B19" },
      { n: "Gris plomo", h: "#6E6A62" },
      { n: "Blanco roto", h: "#F2EEE4" },
      { n: "Dorado sutil", h: "#B4913F" },
    ],
    psicologia:
      "Autoridad y control. El contraste negro–blanco con toques dorados comunica sofisticación y estatus. Es la paleta de quien valora la precisión visual — puede sentirse fría si no se equilibra con textura (lino, madera oscura, cuero).",
  },
  {
    key: "calido-cercano",
    nombre: "Minimalista Cálido",
    colores: [
      { n: "Crema", h: "#F1E8DA" },
      { n: "Terracota suave", h: "#C9A583" },
      { n: "Madera clara", h: "#D9BA8B" },
      { n: "Blanco hueso", h: "#F7F3EC" },
    ],
    psicologia:
      "Calidez sin ruido visual. Tonos tierra claros generan cercanía y serenidad sin perder la limpieza del minimalismo. Ideal para quien busca un hogar tranquilo pero acogedor, no clínico.",
  },
  {
    key: "familiar-acogedor",
    nombre: "Familiar / Acogedor",
    colores: [
      { n: "Mostaza", h: "#C79A3D" },
      { n: "Verde oliva", h: "#5F6B3E" },
      { n: "Terracota", h: "#B5654A" },
      { n: "Madera media", h: "#9C6B45" },
    ],
    psicologia:
      "Unión y confort. Colores tierra más saturados evocan vida en comunidad — cenas largas, chicos jugando, reuniones. Es la paleta típica de una casa que prioriza el tiempo compartido por sobre la formalidad.",
  },
  {
    key: "clasico-atemporal",
    nombre: "Clásico Atemporal",
    colores: [
      { n: "Marfil", h: "#EDE6D3" },
      { n: "Camel", h: "#A9764F" },
      { n: "Verde botella", h: "#2F4A3D" },
      { n: "Dorado envejecido", h: "#9C7A34" },
    ],
    psicologia:
      "Permanencia y legado. Comunica que la familia no busca \"estar a la moda\" sino construir algo duradero. Transmite seguridad y buen gusto sin caer en la ostentación.",
  },
  {
    key: "contemporaneo-sofisticado",
    nombre: "Contemporáneo Sofisticado",
    colores: [
      { n: "Grafito", h: "#2B2A28" },
      { n: "Gris plomo", h: "#8B8880" },
      { n: "Blanco frío", h: "#EDEDE8" },
      { n: "Negro mate", h: "#161514" },
    ],
    psicologia:
      "Orden mental. Una escala de grises casi sin color evoca seriedad y modernidad urbana. Frecuente en perfiles ejecutivos o creativos que necesitan un espacio que no compita visualmente con su vida diaria.",
  },
  {
    key: "natural-organico",
    nombre: "Natural / Orgánico",
    colores: [
      { n: "Verde salvia", h: "#7C8B6B" },
      { n: "Arena", h: "#DCCBAE" },
      { n: "Terracota", h: "#B5654A" },
      { n: "Madera natural", h: "#B98F63" },
    ],
    psicologia:
      "Conexión y calma. Paleta inspirada en paisajes naturales — reduce el estrés visual. Recomendada para quien busca desconectar del ritmo urbano dentro de su propio hogar.",
  },
  {
    key: "dramatico-nocturno",
    nombre: "Dramático / Nocturno",
    colores: [
      { n: "Azul marino", h: "#1F2B38" },
      { n: "Negro", h: "#161514" },
      { n: "Dorado", h: "#B4913F" },
      { n: "Borgoña", h: "#5C2A2A" },
    ],
    psicologia:
      "Intimidad y lujo. Tonos profundos y saturados generan misterio y una sensación envolvente. Funciona muy bien en dormitorios o livings de uso nocturno, pero exige buena iluminación artificial para no oscurecer de más.",
  },
  {
    key: "escandinavo-luminoso",
    nombre: "Escandinavo Luminoso",
    colores: [
      { n: "Blanco", h: "#FAF9F5" },
      { n: "Gris claro", h: "#D9D5CC" },
      { n: "Azul pálido", h: "#B9CBD1" },
      { n: "Madera clara", h: "#E4C9A0" },
    ],
    psicologia:
      "Claridad mental. Baja saturación que maximiza la sensación de luz y amplitud. Asociada psicológicamente a la calma y el orden — buena elección para espacios pequeños o con poca luz natural.",
  },
];

export interface OfficePaletteCombo {
  key: string;
  nombre: string;
  colores: { n: string; h: string }[];
  uso: string;
  custom?: true;
}

export const officePaletteCombos: OfficePaletteCombo[] = [
  {
    key: "azul-gris-corp",
    nombre: "Azul corporativo + Gris plata",
    colores: [
      { n: "Azul marino", h: "#1F3A5F" },
      { n: "Gris plata", h: "#B9BEC5" },
      { n: "Blanco", h: "#F5F5F5" },
      { n: "Naranja acento", h: "#E8703A" },
    ],
    uso: "La combinación más usada en bancos, seguros y consultoras — transmite confianza y seriedad, con un acento cálido para no sentirse frío.",
  },
  {
    key: "blanco-madera-negro",
    nombre: "Blanco + Madera clara + Negro",
    colores: [
      { n: "Blanco", h: "#FAFAF8" },
      { n: "Madera clara", h: "#D9BA8B" },
      { n: "Negro mate", h: "#1A1A1A" },
      { n: "Gris cálido", h: "#B0A99F" },
    ],
    uso: "Estética escandinava-corporativa — muy usada en oficinas de tecnología y coworkings modernos.",
  },
  {
    key: "verde-salvia-madera",
    nombre: "Verde salvia + Madera natural",
    colores: [
      { n: "Verde salvia", h: "#8A9A7E" },
      { n: "Madera natural", h: "#C9A574" },
      { n: "Blanco hueso", h: "#F7F3EC" },
      { n: "Verde oscuro", h: "#3E4A38" },
    ],
    uso: "Paleta biofílica — cada vez más común en empresas que priorizan el bienestar del equipo.",
  },
  {
    key: "negro-dorado-blanco",
    nombre: "Negro + Dorado + Blanco",
    colores: [
      { n: "Negro", h: "#111111" },
      { n: "Dorado", h: "#B4913F" },
      { n: "Blanco", h: "#FFFFFF" },
      { n: "Gris carbón", h: "#333333" },
    ],
    uso: "Lujo ejecutivo — gerencias, estudios jurídicos e inmobiliarias de alto segmento.",
  },
  {
    key: "azul-petroleo-terracota",
    nombre: "Azul petróleo + Terracota",
    colores: [
      { n: "Azul petróleo", h: "#2B4C4F" },
      { n: "Terracota", h: "#C1694F" },
      { n: "Crema", h: "#EFE6D8" },
      { n: "Gris cálido", h: "#8D8579" },
    ],
    uso: "Combinación creativa y cálida, frecuente en agencias de diseño y marketing.",
  },
  {
    key: "grafito-mostaza",
    nombre: "Gris grafito + Amarillo mostaza",
    colores: [
      { n: "Grafito", h: "#3A3A3C" },
      { n: "Amarillo mostaza", h: "#D8A93E" },
      { n: "Blanco", h: "#FAFAFA" },
      { n: "Gris claro", h: "#D6D6D6" },
    ],
    uso: "Paleta de energía tipo startup — dinamismo sin perder seriedad.",
  },
  {
    key: "beige-cafe-crema",
    nombre: "Beige + Café + Crema",
    colores: [
      { n: "Beige", h: "#DCCBAE" },
      { n: "Café", h: "#6B4A34" },
      { n: "Crema", h: "#F5EFE3" },
      { n: "Gris piedra", h: "#9C9689" },
    ],
    uso: "Paleta cálida tradicional — frecuente en despachos, notarías y oficinas familiares.",
  },
  {
    key: "blanco-azul-cielo-madera",
    nombre: "Blanco + Azul cielo + Madera clara",
    colores: [
      { n: "Blanco", h: "#FAF9F5" },
      { n: "Azul cielo", h: "#A9C6D8" },
      { n: "Madera clara", h: "#E4C9A0" },
      { n: "Gris claro", h: "#D9D5CC" },
    ],
    uso: "Escandinavo aplicado a oficina — luminoso y calmo, ideal para espacios chicos.",
  },
  {
    key: "verde-bosque-cuero",
    nombre: "Verde bosque + Cuero café",
    colores: [
      { n: "Verde bosque", h: "#2F4A3D" },
      { n: "Cuero café", h: "#7A5230" },
      { n: "Crema", h: "#EDE6D3" },
      { n: "Dorado envejecido", h: "#9C7A34" },
    ],
    uso: "Ejecutivo clásico con toque natural — estudios y gerencias de perfil tradicional.",
  },
  {
    key: "blanco-rojo-gris",
    nombre: "Blanco + Rojo corporativo + Gris",
    colores: [
      { n: "Blanco", h: "#FFFFFF" },
      { n: "Rojo corporativo", h: "#C6303E" },
      { n: "Gris medio", h: "#8B8B8B" },
      { n: "Negro", h: "#1A1A1A" },
    ],
    uso: "Cuando la marca tiene un color fuerte propio — se usa como acento dominante sobre neutros.",
  },
];

export const materialCards = [
  { n: "Madera clara", css: "linear-gradient(100deg,#E4C9A0,#D9BA8B 45%,#E4C9A0 90%)" },
  { n: "Madera oscura", css: "linear-gradient(100deg,#5A3E28,#4A3120 45%,#5A3E28 90%)" },
  { n: "Mármol / cuarzo claro", css: "linear-gradient(120deg,#F2EEE6 30%,#D8D2C4 55%,#F2EEE6 80%)" },
  { n: "Piedra oscura", css: "linear-gradient(120deg,#3A3A38,#55534E 55%,#3A3A38 90%)" },
  { n: "Metal negro mate", css: "linear-gradient(100deg,#232220,#302F2C 60%,#232220)" },
  { n: "Latón / dorado", css: "linear-gradient(100deg,#B4913F,#D9BE7A 50%,#B4913F 90%)" },
  { n: "Cemento alisado", css: "linear-gradient(100deg,#B7B2A6,#C7C2B4 55%,#B7B2A6)" },
  { n: "Textil / lino natural", css: "linear-gradient(100deg,#EFE7D6,#E3D9C2 55%,#EFE7D6)" },
];

export const colorSwatches = [
  { n: "Blanco roto", h: "#F2EEE4" },
  { n: "Beige arena", h: "#DCCBAE" },
  { n: "Terracota", h: "#B5654A" },
  { n: "Verde salvia", h: "#7C8B6B" },
  { n: "Azul grisáceo", h: "#4F7089" },
  { n: "Negro grafito", h: "#242119" },
  { n: "Camel", h: "#A9764F" },
  { n: "Oliva profundo", h: "#54563B" },
  { n: "Rosa arcilla", h: "#C89486" },
  { n: "Gris piedra", h: "#9C9689" },
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
