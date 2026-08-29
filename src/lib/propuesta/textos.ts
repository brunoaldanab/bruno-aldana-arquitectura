/**
 * Los textos que no cambian de una propuesta a otra.
 *
 * Viven acá y no dentro del componente para que se puedan revisar y corregir sin
 * tocar el maquetado, y para que quede claro qué es fijo y qué se calcula.
 */
export const TEXTOS = {
  intro:
    "Desarrollar un espacio moderno, funcional y profesional, optimizando la distribución y generando una propuesta coherente con la identidad y las necesidades del cliente.",

  alcance: [
    "Análisis y levantamiento de las condiciones actuales.",
    "Redistribución y optimización de los espacios.",
    "Diseño integral de interiores y mobiliario.",
    "Materiales, colores, acabados e iluminación.",
    "Ergonomía, funcionalidad e identidad visual.",
    "Planos de distribución, elevaciones, cortes y detalles.",
    "Visualizaciones 3D de los espacios principales.",
    "Reuniones de coordinación y revisión.",
  ],

  metodologia: [
    { n: "01", titulo: "Diseño", texto: "Análisis, distribución, interiorismo, mobiliario, materiales y visualización 3D." },
    { n: "02", titulo: "Presupuesto", texto: "Con el diseño aprobado se cotizan partidas, materiales, mano de obra y proveedores." },
    { n: "03", titulo: "Ejecución", texto: "Dirección y supervisión de los trabajos conforme al diseño y especificaciones aprobadas." },
  ],

  /**
   * El orden es deliberado: lo visual primero y los planos al final, sin detallar.
   * Un entregable muy especificado se lleva a un carpintero más barato, y además
   * se convierte después en una lista de reclamos. El alcance fino se conversa.
   */
  queRecibis: [
    "Visualizaciones arquitectónicas hiperrealistas de cada ambiente.",
    "Recorrido virtual interactivo: vas a caminar tu proyecto antes de que exista.",
    "Planos generales del proyecto.",
    "2 rondas de ajustes incluidas.",
  ],

  supervisionIntro:
    "Los honorarios profesionales por este servicio corresponden al 10% del costo total de las partidas de obra bajo nuestra dirección y supervisión.",

  supervisionIncluye: [
    "Obra civil y albañilería.",
    "Revestimientos, pisos, cielos falsos, pintura y acabados.",
    "Carpintería fija y mobiliario diseñado para el proyecto.",
    "Instalaciones eléctricas, iluminación y sanitarias incorporadas al alcance.",
    "Elementos arquitectónicos y de interiorismo.",
    "Coordinación de contratistas y proveedores.",
    "Seguimiento del avance y correcta ejecución.",
  ],

  supervisionExcluye: [
    "Computadoras y equipos tecnológicos.",
    "Equipos de oficina y electrodomésticos.",
    "Climatización adquirida como producto terminado.",
    "Mobiliario prefabricado adquirido directamente.",
    "Decoración, accesorios y otros bienes terminados.",
    "Bienes que no requieran dirección o supervisión directa.",
  ],

  /**
   * El ejemplo usa 20.000 y no 200.000: el número grande asustaba, y 20.000 es el
   * piso real de las ejecuciones de interiores del estudio. Un ejemplo
   * conservador resulta más creíble.
   */
  supervisionEjemplo:
    "Si las partidas bajo nuestra dirección y supervisión ascienden a Bs 20.000, los honorarios profesionales serían Bs 2.000.",

  inicio:
    "Una vez aceptada la propuesta y realizado el pago inicial, coordinamos el levantamiento de información y el comienzo del diseño.",

  pieDePagina: "Bruno Aldana · Arquitectura · Interiorismo · Diseño · Construcción",
} as const;
