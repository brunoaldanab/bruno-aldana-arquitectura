import { styleCards } from "./data";
import type { GaleriaData, GaleriaFotoDTO } from "./galeria";
import type { DueloResultado, EntrevistaState } from "./types";

/** La foto que representa el gusto del cliente, lista para mostrar. */
export interface FotoCampeon {
  fotoId: string;
  dataUrl: string;
  styleName: string;
  rating: number;
}

/** Reconstruye el campeón guardado buscando su foto en la biblioteca compartida. */
export function campeonGuardado(
  duelo: DueloResultado | null | undefined,
  estiloFotos: GaleriaFotoDTO[]
): FotoCampeon | null {
  if (!duelo) return null;
  const foto = estiloFotos.find((f) => f.id === duelo.fotoId);
  if (!foto) return null;
  return {
    fotoId: foto.id,
    dataUrl: foto.dataUrl,
    styleName: duelo.styleName,
    rating: duelo.rating,
  };
}

/**
 * La foto de portada de la propuesta.
 *
 * Primero el campeón del duelo, que es la elección explícita del cliente. Si esa
 * entrevista es anterior a que el duelo se guardara, se cae en la foto mejor
 * calificada: así el documento funciona con todos los clientes ya cargados y no
 * solo con los nuevos.
 */
export function fotoPortada(state: EntrevistaState, galeria: GaleriaData): FotoCampeon | null {
  const delDuelo = campeonGuardado(state.duelo, galeria.estiloFotos);
  if (delDuelo) return delDuelo;

  const nombrePorClave = new Map<string, string>([
    ...styleCards.map((c) => [c.k, c.t] as [string, string]),
    ...galeria.estiloCustom.map((c) => [c.key, c.titulo] as [string, string]),
  ]);

  let mejor: FotoCampeon | null = null;
  for (const foto of galeria.estiloFotos) {
    const reaccion = state.estiloDetalle[foto.cardKey]?.reacciones[foto.id];
    if (!reaccion) continue;
    if (reaccion.reaction !== "like" && reaccion.reaction !== "super") continue;
    if (mejor && reaccion.rating <= mejor.rating) continue;
    mejor = {
      fotoId: foto.id,
      dataUrl: foto.dataUrl,
      styleName: nombrePorClave.get(foto.cardKey) ?? foto.cardKey,
      rating: reaccion.rating,
    };
  }
  return mejor;
}
