export interface RoomProfilePregunta {
  id: string;
  label: string;
  placeholder: string;
}

export interface RoomProfileFuncionalGroup {
  categoria: string;
  items: string[];
}

export interface RoomProfile {
  tips: string[];
  mobiliario: string[];
  iluminacion: string[];
  preguntas: RoomProfilePregunta[];
  funcional: RoomProfileFuncionalGroup[];
}

export const roomProfiles: Record<string, RoomProfile> = {
  cocina: {
    tips: [
      "Preguntá primero cómo cocinan realmente día a día — eso define el layout más que el gusto estético.",
      "Una isla necesita al menos 90cm de circulación libre alrededor.",
      "La ventilación / extracción de olores es crítica si la cocina está integrada al living.",
    ],
    mobiliario: [
      "Isla central",
      "Mesón / barra desayunador",
      "Alacena / despensa",
      "Campana extractora vista",
      "Electrodomésticos empotrados",
      "Carro auxiliar",
      "Mesa de comedor diario",
    ],
    iluminacion: ["Luz general (techo)", "Luz bajo alacena (sobre mesón)", "Foco sobre isla", "Luz natural suficiente", "Necesita reforzar luz natural"],
    preguntas: [
      { id: "uso", label: "¿Cuánto cocinan y qué tipo de cocina hacen?", placeholder: "Ej: cocinan todos los días, comida casera, a veces reciben..." },
      { id: "electro", label: "Electrodomésticos que ya tienen o van a comprar", placeholder: "Heladera, horno, microondas, lavavajillas..." },
      { id: "isla", label: "¿Isla o barra? ¿Para cuántas personas debe tener asientos?", placeholder: "Ej: barra para 2, uso rápido de desayuno..." },
    ],
    funcional: [
      {
        categoria: "Triángulo de trabajo y circulación",
        items: ["Triángulo heladera-cocina-lavaplatos sin cruces", "Distancia mesón-isla 90-120cm", "Circulación mínima 120cm en cocinas de un mesón", "Zona de \"aterrizaje\" caliente junto a horno"],
      },
      {
        categoria: "Alturas ergonómicas",
        items: ["Altura de mesón según quién cocina (85-95cm)", "Alacena alta accesible sin escalón", "Cajones con organizadores en vez de puertas bajas"],
      },
      {
        categoria: "Instalaciones y seguridad",
        items: ["Ventilación mecánica con salida al exterior", "Tomas eléctricas en mesón (mín. 4, con norma cerca de agua)", "Acceso a gas con norma de seguridad", "Piso antideslizante", "Punto de basura/reciclaje accesible"],
      },
      {
        categoria: "Almacenamiento y detalle",
        items: ["Espacio accesible para electrodomésticos pequeños", "Punto de agua adicional (filtro/hervidor)", "Materiales de mesón resistentes a calor/manchas", "Iluminación de tarea sin sombra propia", "Puerta/vano amplio para transporte de compras"],
      },
      {
        categoria: "Accesibilidad y seguridad avanzada",
        items: ["Mesón a doble altura si hay usuario en silla de ruedas", "Esquinas redondeadas si hay niños chicos", "Traba de seguridad en gas/electricidad si aplica"],
      },
    ],
  },
  dormitorio: {
    tips: [
      "Confirmá de quién es el dormitorio — principal, infantil, huéspedes cambia todo el enfoque.",
      "El tamaño de la cama define el layout completo del closet y la circulación.",
      "Luz cálida y regulable ayuda a que el dormitorio se sienta descanso, no oficina.",
    ],
    mobiliario: ["Cama king/queen", "Clóset walk-in", "Placard tradicional", "Escritorio / rincón de trabajo", "Veladores", "Tocador / espejo", "Sillón de lectura"],
    iluminacion: ["Luz general regulable", "Veladores con luz de lectura", "Luz interior de closet", "Blackout / cortina especial"],
    preguntas: [
      { id: "quien", label: "¿De quién es este dormitorio y qué necesita guardar?", placeholder: "Ej: dormitorio principal, ropa de trabajo + casual..." },
      { id: "trabajo", label: "¿Necesita zona de trabajo o solo es para descansar?", placeholder: "..." },
      { id: "ropa", label: "Ropa de cama / colores que ya tienen y quieren mantener", placeholder: "..." },
    ],
    funcional: [
      {
        categoria: "Circulación y ergonomía",
        items: ["Circulación mínima 60-70cm a cada lado de la cama", "Veladores accesibles sin levantarse de más", "Control de luz accesible desde la cama", "Enchufes/cargadores accesibles desde la cama"],
      },
      {
        categoria: "Closet y almacenamiento",
        items: ["Altura de barral según usuario", "Cajones bajos vs. altos según movilidad", "Vestidor con iluminación frontal (no cenital)", "Almacenamiento de temporada previsto", "Espejo con luz adecuada"],
      },
      {
        categoria: "Confort ambiental",
        items: ["Aislación acústica si da a la calle", "Blackout si hay mucha luz de mañana", "Ventilación cruzada (ventana operable)", "Temperatura estable durante la noche"],
      },
      {
        categoria: "Seguridad",
        items: ["Ventana practicable como salida de emergencia", "Distancia segura de enchufes respecto a la cama", "Puerta con sello acústico / privacidad"],
      },
      {
        categoria: "Accesibilidad",
        items: ["Espacio de circulación para andador/silla de ruedas si aplica", "Interruptor a altura accesible", "Cama a altura de transferencia segura si es necesario", "Toma de corriente con altura accesible desde silla de ruedas"],
      },
    ],
  },
  bano: {
    tips: [
      "Definí si es baño social (lo ven las visitas) o privado — cambia el nivel de formalidad.",
      "La ventilación (natural o extractor) es un dato técnico crítico, no solo estético.",
      "El guardado de toallas y productos suele subestimarse — preguntalo siempre.",
    ],
    mobiliario: ["Mueble bajo lavamanos con guardado", "Ducha", "Tina", "Inodoro suspendido", "Espejo con luz integrada", "Toallero calefaccionado"],
    iluminacion: ["Luz general", "Luz en espejo (frontal, sin sombras)", "Luz cálida relajante", "Necesita ventilación / extractor"],
    preguntas: [
      { id: "tipo", label: "¿Es baño social o de uso privado?", placeholder: "..." },
      { id: "griferia", label: "Grifería y sanitarios: ¿ya definidos o a elegir?", placeholder: "..." },
      { id: "guardado", label: "¿Cuánto guardado necesitan (toallas, productos, botiquín)?", placeholder: "..." },
    ],
    funcional: [
      {
        categoria: "Circulación y accesibilidad",
        items: ["Circulación mínima 60cm frente al lavamanos", "Espacio de giro 150cm (accesibilidad universal)", "Puerta que abra hacia afuera (seguridad)", "Altura de lavamanos según usuarios"],
      },
      {
        categoria: "Seguridad e higiene",
        items: ["Barra de apoyo prevista en ducha", "Piso antideslizante certificado", "Guardado cerrado para productos de limpieza", "Enchufe con protección diferencial cerca del lavamanos"],
      },
      {
        categoria: "Instalaciones",
        items: ["Desagüe de ducha correctamente pendientado", "Ventilación mecánica si no hay ventana", "Impermeabilización antes de terminaciones", "Sifón de piso accesible para mantenimiento"],
      },
      {
        categoria: "Confort",
        items: ["Iluminación cálida vs. fría según uso", "Luz de espejo sin sombras para maquillarse/afeitarse", "Toallero calefaccionado en climas fríos"],
      },
      {
        categoria: "Accesibilidad avanzada",
        items: ["Ducha a ras de piso (sin resalte)", "Inodoro a altura de transferencia si es necesario", "Grifería de palanca fácil de accionar", "Espacio libre bajo lavamanos para silla de ruedas", "Timbre de emergencia si hay usuario de riesgo"],
      },
    ],
  },
  comedor: {
    tips: [
      "Preguntá la cantidad real de comensales del día a día vs. la que quieren para eventos grandes.",
      "La luz colgante sobre la mesa es el elemento que más define el carácter del comedor.",
      "Si está integrado al living, conviene marcar un quiebre visual (alfombra, cielo, color).",
    ],
    mobiliario: ["Mesa para 4", "Mesa para 6-8", "Mesa extensible", "Sillas", "Vajillero / aparador", "Carro bar", "Lámpara colgante sobre mesa"],
    iluminacion: ["Colgante sobre mesa (foco fuerte)", "Luz general regulable", "Ambiente cálido para cenas"],
    preguntas: [
      { id: "comensales", label: "¿Cuántas personas comen ahí normalmente, y cuántas en ocasiones especiales?", placeholder: "..." },
      { id: "formal", label: "¿Es un comedor formal o de uso diario informal?", placeholder: "..." },
      { id: "vajilla", label: "Vajilla / cristalería que quieran exhibir", placeholder: "Define si necesitan vajillero con vidrio..." },
    ],
    funcional: [
      {
        categoria: "Circulación",
        items: ["Circulación mínima 90cm alrededor de la mesa", "Distancia mesa-pared mínima 90cm (sillas afuera)", "Acceso directo o cercano a la cocina", "Ancho de paso libre hacia el resto de la casa"],
      },
      {
        categoria: "Iluminación técnica",
        items: ["Altura de lámpara colgante 75-90cm sobre mesa", "Dimmer para pasar de uso diario a cena especial", "Luz cálida (2700-3000K) para ambiente de cena"],
      },
      {
        categoria: "Materiales y mantenimiento",
        items: ["Superficie de mesa resistente a manchas/calor", "Aparador con acceso sin obstruir circulación", "Ventilación si se usa para reuniones largas", "Silla apilable/plegable si el espacio es reducido"],
      },
      {
        categoria: "Ergonomía de mesa",
        items: ["Ancho mínimo 60cm de mesa por comensal", "Altura estándar de mesa 75cm con sillas", "Espacio libre bajo mesa para piernas (mín. 60cm)"],
      },
      {
        categoria: "Acústica y confort",
        items: ["Absorción acústica si el comedor es muy reflejante (piso duro, techo alto)", "Climatización que no incomode en la zona de asientos fijos"],
      },
      {
        categoria: "Accesibilidad",
        items: ["Silla con reposabrazos removible para adultos mayores", "Espacio de giro si hay usuario con silla de ruedas", "Mesa con altura libre para silla de ruedas (mín. 70cm)", "Camino de circulación sin alfombras sueltas (riesgo de tropiezo)"],
      },
    ],
  },
  living: {
    tips: [
      "El tamaño y ubicación del sofá define toda la circulación del ambiente.",
      "Preguntá el tamaño de TV con anticipación — condiciona distancia y mueble.",
      "Si hay mascotas o niños chicos, eso cambia la elección de telas.",
    ],
    mobiliario: ["Sofá 3 cuerpos", "Sofá seccional / módulos", "Mesa de centro", "Rack / mueble TV", "Sillón individual", "Estantería / biblioteca", "Alfombra"],
    iluminacion: ["Luz general", "Lámparas de pie/mesa (ambiente)", "Foco sobre arte o decoración", "Ya tiene mucha luz natural"],
    preguntas: [
      { id: "uso", label: "¿Cómo usan el living — ver TV, recibir visitas, ambos?", placeholder: "..." },
      { id: "tv", label: "Tamaño de TV y si necesitan sistema de audio", placeholder: "..." },
      { id: "mascotas", label: "¿Tienen mascotas o niños chicos?", placeholder: "Define telas y alturas..." },
    ],
    funcional: [
      {
        categoria: "Ergonomía visual",
        items: ["Distancia sofá-TV proporcional al tamaño de pantalla", "Orientación del sofá evitando contraluz en TV", "Altura de mesa de centro proporcional al sofá", "Altura de asiento de sofá ergonómica (42-45cm)"],
      },
      {
        categoria: "Circulación",
        items: ["Circulación mínima 90cm entre sofá y mesa de centro", "Paso hacia otros ambientes sin interrumpir la zona de estar", "Espacio libre frente al sofá para levantarse cómodo"],
      },
      {
        categoria: "Instalaciones",
        items: ["Enchufes para lámparas sin cables cruzando el paso", "Control de iluminación por escenas (TV / visitas)", "Aislación acústica si hay home theater", "Punto de red/cable para consolas o streaming"],
      },
      {
        categoria: "Materiales y mantenimiento",
        items: ["Tela de sofá resistente si hay mascotas/niños", "Alfombra de pelo corto en zonas de mucho tránsito", "Superficies fáciles de limpiar en mesa de centro"],
      },
      {
        categoria: "Acústica",
        items: ["Materiales blandos (cortinas, alfombra) para bajar reverberación", "Aislación de ruido de calle si hay ventanales grandes"],
      },
      {
        categoria: "Accesibilidad",
        items: ["Altura de sofá cómoda para adultos mayores", "Circulación amplia si hay silla de ruedas o andador", "Mando/control de TV accesible sin estirarse", "Bordes redondeados en mesa de centro si hay niños"],
      },
    ],
  },
  homeoffice: {
    tips: [
      "La ergonomía de la silla y la altura del escritorio son la base — no es solo estética.",
      "Preguntá sobre videollamadas: define qué pared/fondo va a verse en cámara.",
      "El cableado y la cantidad de enchufes se planifican ahora, no después de instalado el piso.",
    ],
    mobiliario: ["Escritorio individual", "Escritorio doble/compartido", "Silla ergonómica", "Estantería / archivo", "Fondo para videollamadas", "Pizarra / corcho"],
    iluminacion: ["Luz natural de frente (no a contraluz en cámara)", "Luz de tarea sobre escritorio", "Luz general"],
    preguntas: [
      { id: "horas", label: "¿Cuántas horas al día se usa y para qué tipo de trabajo?", placeholder: "..." },
      { id: "video", label: "¿Hacen videollamadas seguido?", placeholder: "Define fondo y luz..." },
      { id: "equipos", label: "Equipos que ya tienen y necesidades de cableado", placeholder: "Monitores, impresora..." },
    ],
    funcional: [
      {
        categoria: "Ergonomía",
        items: ["Altura de escritorio ergonómica (72-75cm o ajustable)", "Silla con soporte lumbar y reposabrazos", "Monitor a la altura de los ojos", "Distancia ojo-pantalla 50-70cm", "Espacio para piernas mínimo 60cm de profundidad"],
      },
      {
        categoria: "Instalaciones",
        items: ["Tomas eléctricas y de red cerca del escritorio", "Cableado organizado y oculto", "Iluminación sin reflejos en pantalla", "Suficientes tomas para múltiples dispositivos"],
      },
      {
        categoria: "Confort de uso prolongado",
        items: ["Aislación acústica si hay llamadas frecuentes", "Ventilación / circulación de aire adecuada", "Almacenamiento accesible sin levantarse mucho", "Temperatura estable durante jornadas largas"],
      },
      {
        categoria: "Videollamadas y presencia digital",
        items: ["Fondo neutro y ordenado en cámara", "Luz de frente sin contraluz de ventana", "Reducción de eco/reverberación en la sala"],
      },
      {
        categoria: "Seguridad postural",
        items: ["Posibilidad de alternar sentado/parado", "Silla con altura de asiento regulable", "Espacio de aproximación frontal libre para silla de ruedas", "Altura de estantería de uso frecuente al alcance"],
      },
    ],
  },
  balcon: {
    tips: [
      "Definí si es para comer, relajarse o solo decorativo — cambia todo el mobiliario.",
      "Los materiales deben resistir sol y humedad — no todo mueble de interior sirve afuera.",
      "Las plantas necesitan que definan mantenimiento real disponible, no el ideal.",
    ],
    mobiliario: ["Mesa y sillas exterior", "Reposera / sillón", "Macetas / jardinera", "Toldo o cobertor", "Iluminación exterior", "Parrilla pequeña"],
    iluminacion: ["Luz cálida para la noche", "Solo luz natural de día", "Guirnaldas / ambiente decorativo"],
    preguntas: [
      { id: "uso", label: "¿Para qué lo van a usar principalmente?", placeholder: "Comer, relajarse, plantas..." },
      { id: "clima", label: "¿Cuánto sol/viento recibe?", placeholder: "Condiciona materiales..." },
      { id: "mantenimiento", label: "¿Cuánto tiempo real tienen para mantenimiento de plantas?", placeholder: "..." },
    ],
    funcional: [
      {
        categoria: "Seguridad estructural",
        items: ["Baranda con altura de seguridad (mín. 90-100cm)", "Separación entre barrotes máx. 10-12cm (niños)", "Resistencia estructural para mobiliario pesado (jardineras)", "Carga máxima permitida verificada (norma del edificio)"],
      },
      {
        categoria: "Instalaciones exteriores",
        items: ["Piso antideslizante apto exterior", "Desagüe de piso para evitar encharque", "Punto eléctrico con protección IP para exterior", "Grifo o toma de agua si hay muchas plantas"],
      },
      {
        categoria: "Confort climático",
        items: ["Protección solar según orientación (toldo/pérgola)", "Circulación mínima para mesa y sillas sin quedar contra la baranda", "Protección contra viento si el piso es alto"],
      },
      {
        categoria: "Materiales",
        items: ["Mobiliario con resistencia UV (no se decolora)", "Textiles de secado rápido / repelentes al agua", "Macetas con buen drenaje para no dañar el piso"],
      },
      {
        categoria: "Uso nocturno",
        items: ["Iluminación cálida regulable para la noche", "Enchufe exterior para luces decorativas"],
      },
      {
        categoria: "Accesibilidad y practicidad",
        items: ["Umbral sin desnivel para silla de ruedas/andador", "Altura de baranda que permita ver sentado", "Espacio de giro para maceteros grandes", "Mobiliario liviano y fácil de mover para limpieza"],
      },
    ],
  },
  oficinaEspacio: {
    tips: [
      "Cada espacio de oficina debería reforzar la marca — no ser un living genérico.",
      "Definí capacidad real de uso simultáneo, no la capacidad ideal.",
      "Acústica y privacidad visual suelen ser el problema #1 en oficinas abiertas.",
    ],
    mobiliario: ["Mobiliario modular", "Puestos individuales", "Mesa de reuniones", "Sillón de espera", "Estantería / archivo", "Cabina fonoabsorbente"],
    iluminacion: ["Luz general uniforme", "Luz de tarea en puestos", "Iluminación de marca / acento"],
    preguntas: [
      { id: "capacidad", label: "Capacidad real de uso simultáneo de este espacio", placeholder: "..." },
      { id: "privacidad", label: "¿Necesita privacidad visual o acústica particular?", placeholder: "..." },
      { id: "marca", label: "Elementos de marca a incorporar acá", placeholder: "Logo, colores, señalética..." },
    ],
    funcional: [
      {
        categoria: "Circulación y accesibilidad",
        items: ["Pasillos con mínimo 90cm de ancho", "Accesibilidad para movilidad reducida", "Ruta de evacuación despejada", "Puerta con ancho reglamentario de acceso"],
      },
      {
        categoria: "Acústica y privacidad",
        items: ["Aislación acústica respecto a espacios abiertos", "Privacidad visual donde se requiera", "Materiales que absorban ruido", "Cabina o sala para llamadas privadas"],
      },
      {
        categoria: "Instalaciones",
        items: ["Tomas eléctricas y de red suficientes", "Climatización adecuada al uso del espacio", "Iluminación acorde a la tarea que se realiza ahí", "Puntos de carga accesibles para visitas"],
      },
      {
        categoria: "Ergonomía y confort",
        items: ["Mobiliario ergonómico según tiempo de uso", "Altura de mesa/mostrador acorde a la función", "Asientos de espera cómodos para más de 15 min"],
      },
      {
        categoria: "Seguridad y normativa",
        items: ["Señalética de seguridad visible", "Extintor accesible", "Cumplimiento de normativa de accesibilidad universal", "Ruta de acceso sin escalones o con rampa alternativa", "Botón de pánico o contacto de emergencia visible"],
      },
    ],
  },
  otro: {
    tips: [
      "Preguntá el uso real del espacio antes que nada — no asumas por el nombre.",
      "Definí qué mobiliario ya existe y qué falta.",
      "La iluminación y el mantenimiento real disponible siempre condicionan la propuesta.",
    ],
    mobiliario: ["Mobiliario a definir", "Almacenamiento", "Iluminación exterior", "Mobiliario existente a reubicar"],
    iluminacion: ["Luz general", "Luz natural suficiente", "A definir"],
    preguntas: [
      { id: "uso", label: "¿Cuál es el uso principal de este espacio?", placeholder: "..." },
      { id: "existente", label: "¿Qué mobiliario ya tienen ahí y quieren mantener?", placeholder: "..." },
      { id: "puntual", label: "Algo puntual que quieran resolver o mejorar acá", placeholder: "..." },
    ],
    funcional: [
      {
        categoria: "Circulación y seguridad",
        items: ["Circulación mínima adecuada al uso", "Piso apto para el tipo de tránsito esperado", "Iluminación suficiente para uso seguro"],
      },
      {
        categoria: "Instalaciones",
        items: ["Tomas eléctricas suficientes", "Ventilación adecuada", "Punto de agua si el uso lo requiere"],
      },
    ],
  },
};

export function matchRoomProfile(room: string): RoomProfile {
  const n = room.toLowerCase();
  if (n.includes("cocina") && !n.includes("kitchenette")) return roomProfiles.cocina;
  if (n.includes("dormitorio")) return roomProfiles.dormitorio;
  if (n.includes("baño") || n.includes("bano")) return roomProfiles.bano;
  if (n.includes("comedor")) return roomProfiles.comedor;
  if (n.includes("living") || n.includes("estar")) return roomProfiles.living;
  if (n.includes("home office")) return roomProfiles.homeoffice;
  if (n.includes("balcón") || n.includes("balcon") || n.includes("terraza")) return roomProfiles.balcon;
  if (
    n.includes("recepción") ||
    n.includes("recepcion") ||
    n.includes("puestos") ||
    n.includes("reunion") ||
    n.includes("gerencia") ||
    n.includes("kitchenette") ||
    n.includes("espera") ||
    n.includes("break room") ||
    n.includes("depósito") ||
    n.includes("deposito") ||
    n.includes("archivo")
  )
    return roomProfiles.oficinaEspacio;
  return roomProfiles.otro;
}
