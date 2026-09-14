// src/lib/plano/electricos.ts
import { direccionMuro, distanciaEnCara, esquinasCara, largoCara } from "./caras";
import { medida, siguienteId, type Nivel, type NombreCara, type PuntoElectrico, type TipoPunto } from "./modelo";
import { caraConAmbiente, muroCercano } from "./toque";
import { por, suma, type Punto } from "./vector";

/**
 * Los enchufes, las llaves de luz y las demás salidas. Bruno nunca los relevaba
 * y después le faltaban siempre, así que acá viven el catálogo de los tipos que
 * de verdad se usan en viviendas y oficinas y la altura que cada uno lleva.
 *
 * Las alturas por defecto son las de la norma boliviana NB 777, medidas al
 * punto medio de la caja: interruptores a 125, tomacorrientes a 30, los de
 * mesada de cocina a 120, las tomas de fuerza a 150 y los apliques a 200.
 */

export type Familia = "tomacorriente" | "interruptor" | "mixto" | "datos" | "fuerza";

export type Tipo = {
  clave: TipoPunto;
  familia: Familia;
  nombre: string;
  /** Lo que se dibuja adentro del símbolo en el plano */
  simbolo: string;
  altura: number;
};

export const FAMILIAS: { clave: Familia; nombre: string; letra: string }[] = [
  { clave: "tomacorriente", nombre: "Tomacorrientes", letra: "T" },
  { clave: "interruptor", nombre: "Llaves de luz", letra: "L" },
  { clave: "mixto", nombre: "Combinados", letra: "C" },
  { clave: "datos", nombre: "TV, internet y teléfono", letra: "D" },
  { clave: "fuerza", nombre: "Fuerza y especiales", letra: "F" },
];

export const TIPOS: Tipo[] = [
  { clave: "toma-doble", familia: "tomacorriente", nombre: "Tomacorriente doble", simbolo: "2", altura: 30 },
  { clave: "toma-simple", familia: "tomacorriente", nombre: "Tomacorriente simple", simbolo: "1", altura: 30 },
  { clave: "toma-triple", familia: "tomacorriente", nombre: "Tomacorriente triple", simbolo: "3", altura: 30 },
  { clave: "toma-usb", familia: "tomacorriente", nombre: "Tomacorriente con USB", simbolo: "U", altura: 30 },
  { clave: "toma-mesada", familia: "tomacorriente", nombre: "Tomacorriente sobre mesada", simbolo: "M", altura: 120 },
  { clave: "toma-piso", familia: "tomacorriente", nombre: "Tomacorriente de piso", simbolo: "P", altura: 0 },
  { clave: "int-simple", familia: "interruptor", nombre: "Llave de 1 tecla", simbolo: "1", altura: 125 },
  { clave: "int-doble", familia: "interruptor", nombre: "Llave de 2 teclas", simbolo: "2", altura: 125 },
  { clave: "int-triple", familia: "interruptor", nombre: "Llave de 3 teclas", simbolo: "3", altura: 125 },
  { clave: "int-conmutador", familia: "interruptor", nombre: "Conmutador · se prende desde dos lugares", simbolo: "↔", altura: 125 },
  { clave: "int-dimmer", familia: "interruptor", nombre: "Dimmer · regulador", simbolo: "~", altura: 125 },
  { clave: "int-sensor", familia: "interruptor", nombre: "Sensor de movimiento", simbolo: "◔", altura: 210 },
  { clave: "mixto-int-toma", familia: "mixto", nombre: "Llave + tomacorriente", simbolo: "+", altura: 125 },
  { clave: "datos-tv", familia: "datos", nombre: "Salida de TV", simbolo: "TV", altura: 30 },
  { clave: "datos-red", familia: "datos", nombre: "Salida de red · RJ45", simbolo: "R", altura: 30 },
  { clave: "datos-red-doble", familia: "datos", nombre: "Doble salida de red · puesto de oficina", simbolo: "R2", altura: 30 },
  { clave: "datos-telefono", familia: "datos", nombre: "Salida de teléfono", simbolo: "☎", altura: 30 },
  { clave: "fuerza-aire", familia: "fuerza", nombre: "Aire acondicionado", simbolo: "A", altura: 220 },
  { clave: "fuerza-termo", familia: "fuerza", nombre: "Termotanque", simbolo: "T", altura: 180 },
  { clave: "fuerza-cocina", familia: "fuerza", nombre: "Cocina u horno eléctrico", simbolo: "C", altura: 150 },
  { clave: "fuerza-lavadora", familia: "fuerza", nombre: "Lavadora", simbolo: "L", altura: 150 },
  { clave: "fuerza-timbre", familia: "fuerza", nombre: "Timbre o aplique", simbolo: "◉", altura: 200 },
];

export const TIPO_POR_DEFECTO: TipoPunto = "toma-doble";

const PORCLAVE = new Map(TIPOS.map((t) => [t.clave, t]));

export const tipoDe = (clave: TipoPunto): Tipo => PORCLAVE.get(clave)!;

export const letraDe = (clave: TipoPunto): string => FAMILIAS.find((f) => f.clave === tipoDe(clave).familia)!.letra;

/** T1, L1, D1: únicos en todo el relevamiento, como los códigos de las aberturas. */
export const siguienteCodigoPunto = (codigos: string[], clave: TipoPunto): string => siguienteId(codigos, letraDe(clave));

export function agregarPuntoElectrico(
  nivel: Nivel,
  datos: { tipo: TipoPunto; muroId: string; cara: NombreCara; desde: number; altura?: number },
  codigosUsados: string[] = [],
): { nivel: Nivel; id: string; codigo: string } {
  const id = siguienteId(nivel.electricos.map((e) => e.id), "e");
  const codigo = siguienteCodigoPunto([...nivel.electricos.map((e) => e.codigo), ...codigosUsados], datos.tipo);
  const punto: PuntoElectrico = {
    id,
    codigo,
    tipo: datos.tipo,
    muroId: datos.muroId,
    cara: datos.cara,
    desde: medida(datos.desde),
    altura: medida(datos.altura ?? tipoDe(datos.tipo).altura),
    notas: "",
  };
  return { nivel: { ...nivel, electricos: [...nivel.electricos, punto] }, id, codigo };
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Un toque sobre la pared deja el punto ahí, del lado del ambiente. */
export function colocarPuntoElectrico(
  nivel: Nivel,
  tipo: TipoPunto,
  toque: Punto,
  radio: number,
  codigosUsados: string[] = [],
): { nivel: Nivel; id: string; codigo: string } | null {
  const muroId = muroCercano(nivel, toque, radio);
  if (!muroId) return null;
  const { cara } = caraConAmbiente(nivel, muroId, toque);
  const ref = { muroId, cara };
  const largo = largoCara(nivel, ref);
  const desde = limitar(Math.round(distanciaEnCara(nivel, ref, toque)), 0, Math.max(0, Math.floor(largo)));
  return agregarPuntoElectrico(nivel, { tipo, muroId, cara, desde }, codigosUsados);
}

/** Arrastrar lo corre sobre su cara de a 1 cm; lo arrastrado queda dibujado, no medido. */
export function arrastrarPuntoElectrico(nivel: Nivel, id: string, p: Punto): Nivel {
  const e = nivel.electricos.find((x) => x.id === id);
  if (!e) return nivel;
  const ref = { muroId: e.muroId, cara: e.cara };
  const desde = limitar(Math.round(distanciaEnCara(nivel, ref, p)), 0, Math.max(0, Math.floor(largoCara(nivel, ref))));
  if (desde === e.desde.valor) return nivel;
  return { ...nivel, electricos: nivel.electricos.map((x) => (x.id === id ? { ...x, desde: { valor: desde, tomada: false } } : x)) };
}

/**
 * Cambiar el tipo cambia la letra del código, y arrastra la altura al valor de
 * la norma mientras esa altura no se haya medido todavía.
 */
export function editarPuntoElectrico(
  nivel: Nivel,
  id: string,
  cambios: { tipo?: TipoPunto; notas?: string },
  codigosUsados: string[] = [],
): Nivel {
  const electricos = nivel.electricos.map((e) => {
    if (e.id !== id) return e;
    const editado = { ...e, ...cambios };
    if (cambios.tipo && cambios.tipo !== e.tipo) {
      if (letraDe(cambios.tipo) !== letraDe(e.tipo)) {
        const otros = [...nivel.electricos.filter((x) => x.id !== id).map((x) => x.codigo), ...codigosUsados];
        editado.codigo = siguienteCodigoPunto(otros, cambios.tipo);
      }
      if (!e.altura.tomada) editado.altura = medida(tipoDe(cambios.tipo).altura);
    }
    return editado;
  });
  return { ...nivel, electricos };
}

/** Dónde cae el punto sobre la cara del muro: es lo que dibuja el plano y lo que lee pyRevit. */
export function posicionPunto(nivel: Nivel, e: PuntoElectrico): Punto {
  const { desde } = esquinasCara(nivel, { muroId: e.muroId, cara: e.cara });
  return suma(desde, por(direccionMuro(nivel, e.muroId), e.desde.valor));
}
