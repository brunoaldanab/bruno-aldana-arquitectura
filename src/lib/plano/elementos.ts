// src/lib/plano/elementos.ts
import { direccionMuro, esquinasCara, largoCara, posicionNodo } from "./caras";
import {
  medida,
  siguienteCodigo,
  siguienteId,
  type Abertura,
  type Nivel,
  type NombreCara,
  type RefCara,
  type TipoAbertura,
  type ZonaTecho,
} from "./modelo";
import { ambienteEnPunto, contornoInterior, puntoEnPoligono } from "./superficie";
import {
  areaConSigno,
  interseccion,
  normalDerecha,
  normalIzquierda,
  por,
  productoEscalar,
  redondear,
  redondearPunto,
  resta,
  suma,
  unitario,
  type Punto,
} from "./vector";

/**
 * Lo que va sobre los muros y los ambientes: aberturas, columnas, zonas de
 * techo, molduras y vigas. Todo nace dibujado (tomada: false) y pasa a tomado
 * cuando Bruno carga la medida.
 */

const APERTURA_POR_TIPO: Record<TipoAbertura, Abertura["apertura"]> = {
  puerta: "batiente",
  ventana: "corrediza",
  vano: null,
};

// En puertas y vanos el antepecho es 0 por definición: no es una medida pendiente.
const antepechoDe = (tipo: TipoAbertura, valor = 0) => (tipo === "ventana" ? medida(valor) : medida(0, true));

export function agregarAbertura(
  nivel: Nivel,
  datos: { tipo: TipoAbertura; muroId: string; cara: NombreCara; desde: number; ancho: number; alto: number; antepecho?: number },
  codigosUsados: string[] = [],
): { nivel: Nivel; id: string; codigo: string } {
  const id = siguienteId(nivel.aberturas.map((a) => a.id), "a");
  const codigo = siguienteCodigo([...nivel.aberturas.map((a) => a.codigo), ...codigosUsados], datos.tipo);
  const abertura: Abertura = {
    id,
    codigo,
    tipo: datos.tipo,
    muroId: datos.muroId,
    cara: datos.cara,
    desde: medida(datos.desde),
    ancho: medida(datos.ancho),
    alto: medida(datos.alto),
    antepecho: antepechoDe(datos.tipo, datos.antepecho),
    apertura: APERTURA_POR_TIPO[datos.tipo],
    abreHacia: null,
    bisagra: null,
    notas: "",
  };
  return { nivel: { ...nivel, aberturas: [...nivel.aberturas, abertura] }, id, codigo };
}

type CambiosAbertura = Partial<Pick<Abertura, "tipo" | "cara" | "apertura" | "abreHacia" | "bisagra" | "notas">>;

/** Cambiar el tipo cambia la letra del código y lo que significa el antepecho. */
export function editarAbertura(nivel: Nivel, id: string, cambios: CambiosAbertura, codigosUsados: string[] = []): Nivel {
  const aberturas = nivel.aberturas.map((a) => {
    if (a.id !== id) return a;
    const editada = { ...a, ...cambios };
    if (cambios.tipo && cambios.tipo !== a.tipo) {
      const otros = [...nivel.aberturas.filter((x) => x.id !== id).map((x) => x.codigo), ...codigosUsados];
      editada.codigo = siguienteCodigo(otros, cambios.tipo);
      editada.antepecho = antepechoDe(cambios.tipo, a.tipo === "ventana" ? a.antepecho.valor : 0);
      if (!("apertura" in cambios)) editada.apertura = APERTURA_POR_TIPO[cambios.tipo];
    }
    return editada;
  });
  return { ...nivel, aberturas };
}

/** Lo que falta desde el borde de la abertura hasta la otra esquina de su cara. */
export const hastaEsquina = (nivel: Nivel, a: Abertura): number =>
  redondear(largoCara(nivel, { muroId: a.muroId, cara: a.cara }) - a.desde.valor - a.ancho.valor);

/** Centro de la abertura sobre el eje del muro: es donde el botón de pyRevit la inserta. */
export function centroAbertura(nivel: Nivel, a: Abertura): Punto {
  const u = direccionMuro(nivel, a.muroId);
  const sobreCara = suma(esquinasCara(nivel, { muroId: a.muroId, cara: a.cara }).desde, por(u, a.desde.valor + a.ancho.valor / 2));
  const inicio = posicionNodo(nivel, nivel.muros.find((m) => m.id === a.muroId)!.desde);
  return redondearPunto(suma(inicio, por(u, productoEscalar(resta(sobreCara, inicio), u))));
}

export function agregarColumna(
  nivel: Nivel,
  datos: { x: number; y: number; ancho: number; profundidad: number; rotacion?: number },
): { nivel: Nivel; id: string } {
  const id = siguienteId(nivel.columnas.map((c) => c.id), "c");
  const columna = {
    id,
    ...redondearPunto(datos),
    ancho: medida(datos.ancho),
    profundidad: medida(datos.profundidad),
    rotacion: datos.rotacion ?? 0,
    altura: null,
  };
  return { nivel: { ...nivel, columnas: [...nivel.columnas, columna] }, id };
}

/** Sin contorno, la zona cubre el ambiente entero. */
export function agregarZonaTecho(
  nivel: Nivel,
  datos: { ambienteId: string; tipo: ZonaTecho["tipo"]; contorno?: Punto[]; altura: number; padreId?: string; margen?: number },
): { nivel: Nivel; id: string } {
  const id = siguienteId(nivel.techos.map((t) => t.id), "t");
  const contorno = (datos.contorno ?? contornoInterior(nivel, datos.ambienteId)).map(redondearPunto);
  const zona: ZonaTecho = {
    id,
    ambienteId: datos.ambienteId,
    tipo: datos.tipo,
    contorno,
    altura: medida(datos.altura),
    padreId: datos.padreId ?? null,
    margen: datos.margen === undefined ? null : medida(datos.margen),
  };
  return { nivel: { ...nivel, techos: [...nivel.techos, zona] }, id };
}

export const MARGEN_BANDEJA = 40;
export const CAIDA_BANDEJA = 20;

/**
 * El contorno metido "d" cm hacia adentro: cada lado se corre en paralelo y las
 * esquinas salen de cortar los lados corridos, como se replantea una bandeja en
 * obra. Devuelve null si el margen se come el polígono.
 */
export function poligonoHaciaAdentro(poligono: Punto[], d: number): Punto[] | null {
  if (poligono.length < 3 || d <= 0) return null;
  const horario = areaConSigno(poligono) > 0;
  const lineas = poligono.map((p, i) => {
    const u = unitario(resta(poligono[(i + 1) % poligono.length], p));
    const adentro = horario ? normalDerecha(u) : normalIzquierda(u);
    return { punto: suma(p, por(adentro, d)), u };
  });
  const puntos: Punto[] = [];
  for (let i = 0; i < lineas.length; i++) {
    const a = lineas[(i - 1 + lineas.length) % lineas.length];
    const b = lineas[i];
    const corte = interseccion(a.punto, a.u, b.punto, b.u);
    if (!corte) return null;
    puntos.push(redondearPunto(corte));
  }
  /*
   * Un margen que se pasa no siempre da vuelta el recorrido: en un rectángulo
   * los dos pares de lados se cruzan a la vez y el polígono sale del derecho,
   * más grande y corrido afuera. Por eso la prueba es que haya achicado y que
   * todas las esquinas nuevas caigan adentro del contorno original.
   */
  const area = areaConSigno(puntos);
  if (area === 0 || area > 0 !== horario || Math.abs(area) >= Math.abs(areaConSigno(poligono))) return null;
  if (puntos.some((p) => !puntoEnPoligono(p, poligono))) return null;
  return puntos;
}

/** Una bandeja adentro de una zona: mismo ambiente, margen parejo y un escalón más abajo. */
export function agregarBandeja(
  nivel: Nivel,
  padreId: string,
  margen = MARGEN_BANDEJA,
): { nivel: Nivel; id: string } | null {
  const padre = nivel.techos.find((t) => t.id === padreId);
  if (!padre) return null;
  const contorno = poligonoHaciaAdentro(padre.contorno, margen);
  if (!contorno) return null;
  return agregarZonaTecho(nivel, {
    ambienteId: padre.ambienteId,
    tipo: "cajon",
    contorno,
    altura: Math.max(0, padre.altura.valor - CAIDA_BANDEJA),
    padreId,
    margen,
  });
}

/** Cambiar el margen de una bandeja la vuelve a replantear desde su zona madre. */
export function cargarMargenBandeja(nivel: Nivel, id: string, margen: number): Nivel {
  const zona = nivel.techos.find((t) => t.id === id);
  if (!zona?.padreId) return nivel;
  const padre = nivel.techos.find((t) => t.id === zona.padreId);
  const contorno = padre && poligonoHaciaAdentro(padre.contorno, margen);
  if (!contorno) return nivel;
  return { ...nivel, techos: nivel.techos.map((t) => (t.id === id ? { ...t, contorno, margen: medida(margen, true) } : t)) };
}

/** Una zona dibujada a dedo: sus puntos mandan y no tiene margen. */
export function agregarZonaDibujada(nivel: Nivel, puntos: Punto[], altura: number): { nivel: Nivel; id: string } | null {
  if (puntos.length < 3) return null;
  const centro = por(puntos.reduce(suma, { x: 0, y: 0 }), 1 / puntos.length);
  const ambienteId = ambienteEnPunto(nivel, centro) ?? nivel.ambientes[0]?.id;
  if (!ambienteId) return null;
  return agregarZonaTecho(nivel, { ambienteId, tipo: "cajon", contorno: puntos, altura });
}

/** Sin caras, la moldura recorre todo el contorno del ambiente. */
export function agregarMoldura(
  nivel: Nivel,
  datos: { ambienteId: string; caras?: RefCara[]; ancho: number; caida: number },
): { nivel: Nivel; id: string } {
  const id = siguienteId(nivel.molduras.map((m) => m.id), "mol");
  const caras = datos.caras ?? nivel.ambientes.find((a) => a.id === datos.ambienteId)?.contorno ?? [];
  const moldura = { id, ambienteId: datos.ambienteId, caras, ancho: medida(datos.ancho), caida: medida(datos.caida) };
  return { nivel: { ...nivel, molduras: [...nivel.molduras, moldura] }, id };
}

export function agregarViga(
  nivel: Nivel,
  datos: { inicio: Punto; fin: Punto; ancho: number; peralte: number },
): { nivel: Nivel; id: string } {
  const id = siguienteId(nivel.vigas.map((v) => v.id), "v");
  const viga = {
    id,
    inicio: redondearPunto(datos.inicio),
    fin: redondearPunto(datos.fin),
    ancho: medida(datos.ancho),
    peralte: medida(datos.peralte),
  };
  return { nivel: { ...nivel, vigas: [...nivel.vigas, viga] }, id };
}

export type TipoElemento = "abertura" | "columna" | "electrico" | "techo" | "moldura" | "viga";

export type CamposMedida = {
  abertura: "desde" | "ancho" | "alto" | "antepecho";
  columna: "ancho" | "profundidad" | "altura";
  electrico: "desde" | "altura";
  techo: "altura";
  moldura: "ancho" | "caida";
  viga: "ancho" | "peralte";
};

const COLECCION = {
  abertura: "aberturas",
  columna: "columnas",
  electrico: "electricos",
  techo: "techos",
  moldura: "molduras",
  viga: "vigas",
} as const satisfies Record<TipoElemento, keyof Nivel>;

/** Carga una medida de láser en un elemento. En la altura de una columna, null vuelve a la altura general. */
export function cargarMedidaElemento<T extends TipoElemento>(
  nivel: Nivel,
  tipo: T,
  id: string,
  campo: CamposMedida[T],
  valor: number | null,
): Nivel {
  const clave = COLECCION[tipo];
  const lista = (nivel[clave] as { id: string }[]).map((e) =>
    e.id === id ? { ...e, [campo]: valor === null ? null : medida(valor, true) } : e,
  );
  return { ...nivel, [clave]: lista };
}

export function borrarElemento(nivel: Nivel, tipo: TipoElemento, id: string): Nivel {
  const clave = COLECCION[tipo];
  return { ...nivel, [clave]: (nivel[clave] as { id: string }[]).filter((e) => e.id !== id) };
}
