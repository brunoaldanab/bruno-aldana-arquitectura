/*
 * Puntuación de paletas: cuánto le gustó cada una, del 1 al 5.
 *
 * Está separado de la pantalla porque la regla no es obvia y conviene poder
 * probarla: elegir y puntuar son el mismo gesto. Tocar la tercera estrella
 * significa "me gusta, y tanto así"; volver a tocar esa misma estrella
 * significa "en realidad no", y la paleta se descarta. Un solo toque para cada
 * intención, que es lo que hace falta cuando esto se usa adelante del cliente.
 */

export const PUNTAJE_MAXIMO = 5;

export interface SeleccionPuntuada {
  seleccion: string[];
  puntajes: Record<string, number>;
}

/**
 * Devuelve el estado nuevo tras tocar la estrella `estrellas` de la paleta
 * `key`. Nunca modifica lo que recibe.
 */
export function aplicarPuntaje(
  actual: SeleccionPuntuada,
  key: string,
  estrellas: number
): SeleccionPuntuada {
  const puntajes = { ...actual.puntajes };
  const eraSuPuntaje = puntajes[key] === estrellas;

  if (eraSuPuntaje) {
    delete puntajes[key];
    return { seleccion: actual.seleccion.filter((k) => k !== key), puntajes };
  }

  puntajes[key] = estrellas;
  return {
    seleccion: actual.seleccion.includes(key) ? actual.seleccion : [...actual.seleccion, key],
    puntajes,
  };
}

/**
 * Las paletas elegidas, de la que más le gustó a la que menos. Las que se
 * marcaron antes de que existiera la puntuación no tienen nota; van al final
 * conservando el orden en que se eligieron, que es la única señal que hay.
 */
export function ordenarPorPuntaje(
  seleccion: string[],
  puntajes: Record<string, number> = {}
): string[] {
  return seleccion
    .map((key, orden) => ({ key, orden, puntaje: puntajes[key] ?? 0 }))
    .sort((a, b) => b.puntaje - a.puntaje || a.orden - b.orden)
    .map((x) => x.key);
}
