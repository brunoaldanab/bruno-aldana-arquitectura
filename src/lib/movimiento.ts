/**
 * Vocabulario de movimiento del sistema.
 *
 * Los valores no son inventados: vienen de los que Apple documenta en
 * "Designing Fluid Interfaces" y de las curvas fuertes que usa Emil Kowalski.
 * Tener un solo lugar donde viven evita que cada componente invente su propia
 * duración y que la app termine moviéndose de ocho maneras distintas.
 */

/** Curva fuerte para entradas y salidas. La blanda del navegador no alcanza. */
export const SALIDA = [0.23, 1, 0.32, 1] as const;
/** Curva fuerte para algo que se mueve de un punto a otro en pantalla. */
export const RECORRIDO = [0.77, 0, 0.175, 1] as const;
/** Curva de cajón/hoja, tomada de iOS. */
export const CAJON = [0.32, 0.72, 0, 1] as const;

/**
 * Resorte por defecto: críticamente amortiguado, sin rebote. Es el que va en
 * casi toda la interfaz — el rebote en algo que solo apareció se siente falso.
 */
export const RESORTE = { type: "spring" as const, bounce: 0, duration: 0.4 };

/**
 * Resorte con inercia, para cuando el movimiento vino de un gesto del usuario.
 * El rebote acá sí corresponde: la mano traía velocidad.
 */
export const RESORTE_GESTO = { type: "spring" as const, bounce: 0.2, duration: 0.4 };

/** Hoja/cajón que sube: un poco más lento y con la curva de iOS. */
export const HOJA = { type: "spring" as const, bounce: 0.1, duration: 0.45 };

/**
 * Proyecta dónde terminaría un gesto si lo dejaran seguir solo.
 *
 * Es la función exacta que usa Apple para la deceleración de scroll. Sirve para
 * que un envión corto alcance para cambiar de paso: se decide por dónde *iba* el
 * dedo, no por dónde lo soltaron.
 */
export function proyectar(velocidad: number, deceleracion = 0.998): number {
  return ((velocidad / 1000) * deceleracion) / (1 - deceleracion);
}

/**
 * Resistencia elástica en los bordes.
 *
 * Cuanto más lejos del límite se arrastra, menos acompaña el elemento. Frenar en
 * seco se lee como que la interfaz se colgó; resistir se lee como que ahí se
 * terminó el contenido.
 */
export function elastico(exceso: number, medida: number, constante = 0.55): number {
  return (exceso * medida * constante) / (medida + constante * Math.abs(exceso));
}
