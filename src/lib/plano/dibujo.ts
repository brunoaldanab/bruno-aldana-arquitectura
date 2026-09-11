// src/lib/plano/dibujo.ts
import { ladosDeAmbiente, type Lado } from "./ambientes";
import { direccionMuro, esquinasCara, extremosCara } from "./caras";
import type { Abertura, Nivel } from "./modelo";
import { contornoInterior, puntoEnPoligono, superficie } from "./superficie";
import { normalDerecha, normalIzquierda, por, productoCruz, resta, suma, type Punto } from "./vector";

/**
 * La geometría que dibuja la pantalla y el plano para imprimir. Todo sale del
 * motor: la pantalla no calcula esquinas por su cuenta.
 */

/** Las cuatro esquinas del muro: su cara izquierda de ida y la derecha de vuelta. */
export function poligonoMuro(nivel: Nivel, muroId: string): Punto[] {
  const izq = extremosCara(nivel, { muroId, cara: "izquierda" });
  const der = extremosCara(nivel, { muroId, cara: "derecha" });
  return [izq.inicio, izq.fin, der.inicio, der.fin];
}

export type HojaPuerta = { bisagra: Punto; extremo: Punto; jamba: Punto; barrido: 0 | 1 };

export type GeometriaAbertura = {
  /** El corte en el muro, de cara a cara */
  hueco: Punto[];
  /** Hojas de puerta con su barrido, para dibujar el arco en punteado */
  hojas: HojaPuerta[];
  /** Líneas sueltas: el símbolo de la ventana o las hojas corredizas */
  lineas: [Punto, Punto][];
  /** Dónde va el código, del lado de la cara medida */
  etiqueta: Punto;
};

function hoja(bisagra: Punto, jamba: Punto, direccion: Punto, largo: number): HojaPuerta {
  const extremo = suma(bisagra, por(direccion, largo));
  // En pantalla (y hacia abajo) el giro positivo es el horario, que es el sentido 1 del arco SVG.
  const barrido = productoCruz(resta(extremo, bisagra), resta(jamba, bisagra)) > 0 ? 1 : 0;
  return { bisagra, extremo, jamba, barrido };
}

export function geometriaAbertura(nivel: Nivel, a: Abertura): GeometriaAbertura {
  const muro = nivel.muros.find((m) => m.id === a.muroId)!;
  const e = muro.espesor.valor;
  const u = direccionMuro(nivel, a.muroId);
  const haciaMuro = a.cara === "derecha" ? normalIzquierda(u) : normalDerecha(u);
  const D = esquinasCara(nivel, { muroId: a.muroId, cara: a.cara }).desde;
  const p0 = suma(D, por(u, a.desde.valor));
  const p1 = suma(D, por(u, a.desde.valor + a.ancho.valor));
  const q0 = suma(p0, por(haciaMuro, e));
  const q1 = suma(p1, por(haciaMuro, e));
  const hueco = [p0, p1, q1, q0];
  const ancho = a.ancho.valor;
  const etiqueta = suma(por(suma(p0, p1), 0.5), por(haciaMuro, -30));

  const hojas: HojaPuerta[] = [];
  const lineas: [Punto, Punto][] = [];
  if (a.tipo === "ventana") {
    const m0 = suma(p0, por(haciaMuro, e / 2));
    const m1 = suma(p1, por(haciaMuro, e / 2));
    lineas.push([p0, p1], [m0, m1], [q0, q1], [p0, q0], [p1, q1]);
  } else if (a.tipo === "puerta") {
    // Abre hacia su cara salvo que se diga lo contrario; la bisagra por defecto va en el inicio.
    const haciaSuCara = (a.abreHacia ?? a.cara) === a.cara;
    const [b0, b1] = haciaSuCara ? [p0, p1] : [q0, q1];
    const direccion = por(haciaMuro, haciaSuCara ? -1 : 1);
    if (a.apertura === "corrediza") {
      const c0 = suma(p0, por(haciaMuro, e / 3));
      const c1 = suma(p0, por(haciaMuro, (2 * e) / 3));
      lineas.push([c0, suma(c0, por(u, ancho * 0.6))], [suma(c1, por(u, ancho * 0.4)), suma(c1, por(u, ancho))]);
    } else if (a.apertura === "doble") {
      const centro = por(suma(b0, b1), 0.5);
      hojas.push(hoja(b0, centro, direccion, ancho / 2), hoja(b1, centro, direccion, ancho / 2));
    } else {
      const [bisagra, jamba] = a.bisagra === "fin" ? [b1, b0] : [b0, b1];
      hojas.push(hoja(bisagra, jamba, direccion, ancho));
    }
  }
  return { hueco, hojas, lineas, etiqueta };
}

export type Cota = {
  indice: number;
  inicio: Punto;
  fin: Punto;
  /** Hacia adentro del ambiente, para ubicar el texto y las líneas de referencia */
  normal: Punto;
  texto: string;
  tomada: boolean;
  lado: Lado;
};

/** Las cotas interiores de un ambiente, corridas "separacion" cm hacia adentro de cada lado. */
export function cotasDeAmbiente(nivel: Nivel, ambienteId: string, separacion: number): Cota[] {
  const poligono = contornoInterior(nivel, ambienteId);
  return ladosDeAmbiente(nivel, ambienteId).map((lado, indice) => {
    const medio = por(suma(lado.inicio, lado.fin), 0.5);
    const izquierda = normalIzquierda(lado.direccion);
    const normal = puntoEnPoligono(suma(medio, izquierda), poligono) ? izquierda : normalDerecha(lado.direccion);
    const tomada = lado.medida?.tomada ?? false;
    return {
      indice,
      inicio: suma(lado.inicio, por(normal, separacion)),
      fin: suma(lado.fin, por(normal, separacion)),
      normal,
      texto: tomada ? String(lado.medida!.valor) : `≈ ${Math.round(lado.largo)}`,
      tomada,
      lado,
    };
  });
}

export const formatoDecimal = (n: number, decimales = 2): string => n.toFixed(decimales).replace(".", ",");

/** "18,47 m²", con ≈ adelante mientras falte medir algún lado. */
export function textoSuperficie(nivel: Nivel, ambienteId: string): string {
  const completo = ladosDeAmbiente(nivel, ambienteId).every((l) => l.medida?.tomada);
  return `${completo ? "" : "≈ "}${formatoDecimal(superficie(nivel, ambienteId))} m²`;
}

/** Cómo se nombran las dos puntas de un lado en pantalla. */
export function nombresPuntas(lado: Pick<Lado, "inicio" | "fin">): { inicio: string; fin: string } {
  const d = resta(lado.fin, lado.inicio);
  if (Math.abs(d.x) >= Math.abs(d.y))
    return d.x >= 0 ? { inicio: "Izquierda", fin: "Derecha" } : { inicio: "Derecha", fin: "Izquierda" };
  return d.y >= 0 ? { inicio: "Arriba", fin: "Abajo" } : { inicio: "Abajo", fin: "Arriba" };
}
