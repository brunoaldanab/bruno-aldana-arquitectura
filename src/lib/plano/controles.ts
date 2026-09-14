// src/lib/plano/controles.ts
import { ladosDeAmbiente } from "./ambientes";
import { direccionMuro, largoCara, posicionNodo } from "./caras";
import { centroAbertura, hastaEsquina } from "./elementos";
import { tipoDe } from "./electricos";
import type { Control, Medida, Nivel, Relevamiento } from "./modelo";
import { resolverNivel } from "./resolver";
import { contornoInterior, puntoEnPoligono } from "./superficie";
import { distancia, por, productoEscalar, resta, suma, type Punto } from "./vector";

/**
 * Lo que la pantalla muestra y el archivo lleva: errores que impiden llevar el
 * plano a Revit, medidas pendientes y avisos que conviene confirmar. Nada se
 * esconde: el archivo sale igual, con esta lista adentro.
 */

const DISTANCIA_ESQUINA = 5;
const TOLERANCIA_BORDE = 0.5;

const cm = (n: number) => String(n).replace(".", ",");

function distanciaASegmento(p: Punto, a: Punto, b: Punto): number {
  const ab = resta(b, a);
  const l2 = productoEscalar(ab, ab);
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, productoEscalar(resta(p, a), ab) / l2));
  return distancia(p, suma(a, por(ab, t)));
}

const sobreBorde = (p: Punto, poligono: Punto[]) =>
  poligono.some((a, i) => distanciaASegmento(p, a, poligono[(i + 1) % poligono.length]) <= TOLERANCIA_BORDE);

export function revisarNivel(nivel: Nivel): Control[] {
  const controles: Control[] = [];
  const agregar = (tipo: Control["tipo"], codigo: string, mensaje: string, elemento?: Control["elemento"]) =>
    controles.push({ tipo, codigo, mensaje, nivelId: nivel.id, ...(elemento ? { elemento } : {}) });
  const pendiente = (m: Medida | null, mensaje: string, elemento?: Control["elemento"]) => {
    if (m && !m.tomada) agregar("pendiente", "pendiente", mensaje, elemento);
  };
  const nombreDe = (id: string | null) => nivel.ambientes.find((a) => a.id === id)?.nombre ?? id ?? "sin ambiente";

  // Errores de cierre: solo los ambientes con medidas pueden contradecirse.
  for (const c of resolverNivel(nivel).cierres) {
    if (c.estado === "abierto")
      agregar("error", "ambiente-abierto", `${nombreDe(c.ambienteId)}: No cierra · faltan ${cm(c.error)} cm`, { tipo: "ambiente", id: c.ambienteId });
  }

  // Aberturas: dentro de su cara, sin pisarse y sin pasar la altura del muro.
  const tramos = new Map<string, { codigo: string; desde: number; hasta: number }[]>();
  for (const a of nivel.aberturas) {
    const elemento = { tipo: "abertura", id: a.id };
    const muro = nivel.muros.find((m) => m.id === a.muroId)!;
    const largo = largoCara(nivel, { muroId: a.muroId, cara: a.cara });
    if (a.desde.valor < 0 || a.desde.valor + a.ancho.valor > largo + TOLERANCIA_BORDE) {
      agregar("error", "abertura-fuera", `${a.codigo} se sale de su cara`, elemento);
    } else if (a.desde.valor < DISTANCIA_ESQUINA || hastaEsquina(nivel, a) < DISTANCIA_ESQUINA) {
      agregar("aviso", "abertura-esquina", `${a.codigo} queda a menos de ${DISTANCIA_ESQUINA} cm de una esquina`, elemento);
    }
    const altura = (muro.altura ?? nivel.alturaGeneral).valor;
    if (a.antepecho.valor + a.alto.valor > altura)
      agregar("error", "abertura-alta", `${a.codigo} es más alta que el muro (${altura} cm)`, elemento);
    // Las dos caras de un muro se comparan sobre el eje.
    const t = productoEscalar(resta(centroAbertura(nivel, a), posicionNodo(nivel, muro.desde)), direccionMuro(nivel, muro.id));
    tramos.set(a.muroId, [...(tramos.get(a.muroId) ?? []), { codigo: a.codigo, desde: t - a.ancho.valor / 2, hasta: t + a.ancho.valor / 2 }]);
  }
  for (const lista of tramos.values()) {
    lista.forEach((a, i) =>
      lista.slice(i + 1).forEach((b) => {
        if (Math.min(a.hasta, b.hasta) - Math.max(a.desde, b.desde) > TOLERANCIA_BORDE)
          agregar("error", "aberturas-pisadas", `${a.codigo} y ${b.codigo} se pisan`);
      }),
    );
  }

  // Zonas de techo: sus vértices dentro del ambiente y ningún vértice del ambiente dentro de la zona (ajuste 10).
  for (const t of nivel.techos) {
    const elemento = { tipo: "techo", id: t.id };
    const existe = t.ambienteId !== null && nivel.ambientes.some((a) => a.id === t.ambienteId);
    const ambiente = existe ? contornoInterior(nivel, t.ambienteId!) : [];
    // Una zona sin ambiente es un aviso, no un error: se mide igual y se resuelve al cerrar las paredes.
    if (!existe) {
      agregar("aviso", "techo-sin-ambiente", `La zona de techo ${t.id} no cae dentro de ningún ambiente cerrado`, elemento);
    } else if (
      t.contorno.some((p) => !puntoEnPoligono(p, ambiente) && !sobreBorde(p, ambiente)) ||
      ambiente.some((p) => puntoEnPoligono(p, t.contorno) && !sobreBorde(p, t.contorno))
    ) {
      agregar("error", "techo-fuera", `La zona de techo ${t.id} se sale de ${nombreDe(t.ambienteId!)}`, elemento);
    }
    if (t.altura.valor > nivel.alturaGeneral.valor)
      agregar("aviso", "techo-alto", `La zona de techo ${t.id} está más alta que la altura general: confirmar si es doble altura`, elemento);
  }

  // Pendientes: toda medida dibujada que Revit necesita (ajuste 8).
  pendiente(nivel.alturaGeneral, "Altura general");
  for (const m of nivel.muros) {
    pendiente(m.espesor, `Espesor de ${m.id}`, { tipo: "muro", id: m.id });
    pendiente(m.altura, `Altura de ${m.id}`, { tipo: "muro", id: m.id });
  }
  for (const amb of nivel.ambientes) {
    ladosDeAmbiente(nivel, amb.id).forEach((lado, i) => {
      if (!lado.medida?.tomada) agregar("pendiente", "pendiente", `${amb.nombre}: lado ${i + 1}`, { tipo: "ambiente", id: amb.id });
    });
  }
  for (const a of nivel.aberturas) {
    const e = { tipo: "abertura", id: a.id };
    pendiente(a.desde, `${a.codigo}: desde la esquina`, e);
    pendiente(a.ancho, `${a.codigo}: ancho`, e);
    pendiente(a.alto, `${a.codigo}: alto`, e);
    if (a.tipo === "ventana") pendiente(a.antepecho, `${a.codigo}: antepecho`, e);
  }
  for (const e of nivel.electricos) {
    const elemento = { tipo: "electrico", id: e.id };
    const largo = largoCara(nivel, { muroId: e.muroId, cara: e.cara });
    if (e.desde.valor < 0 || e.desde.valor > largo + TOLERANCIA_BORDE)
      agregar("error", "electrico-fuera", `${e.codigo} se sale de su pared`, elemento);
    const altura = (nivel.muros.find((m) => m.id === e.muroId)!.altura ?? nivel.alturaGeneral).valor;
    if (e.altura.valor > altura)
      agregar("error", "electrico-alto", `${e.codigo} está más alto que el muro (${altura} cm)`, elemento);
    pendiente(e.desde, `${e.codigo} · ${tipoDe(e.tipo).nombre}: desde la esquina`, elemento);
    pendiente(e.altura, `${e.codigo} · ${tipoDe(e.tipo).nombre}: altura`, elemento);
  }
  for (const c of nivel.columnas) {
    const e = { tipo: "columna", id: c.id };
    pendiente(c.ancho, `Columna ${c.id}: ancho`, e);
    pendiente(c.profundidad, `Columna ${c.id}: profundidad`, e);
    pendiente(c.altura, `Columna ${c.id}: altura`, e);
  }
  for (const t of nivel.techos) {
    pendiente(t.altura, `Zona de techo ${t.id}: altura`, { tipo: "techo", id: t.id });
    pendiente(t.margen, `Bandeja ${t.id}: margen`, { tipo: "techo", id: t.id });
  }
  for (const m of nivel.molduras) {
    pendiente(m.ancho, `Moldura ${m.id}: ancho`, { tipo: "moldura", id: m.id });
    pendiente(m.caida, `Moldura ${m.id}: caída`, { tipo: "moldura", id: m.id });
  }
  for (const v of nivel.vigas) {
    pendiente(v.ancho, `Viga ${v.id}: ancho`, { tipo: "viga", id: v.id });
    pendiente(v.peralte, `Viga ${v.id}: peralte`, { tipo: "viga", id: v.id });
  }

  // Avisos de forma: muros que no encierran nada y ambientes sin acceso (los vanos cuentan, ajuste 9).
  const murosDeAmbientes = new Set(nivel.ambientes.flatMap((a) => a.contorno.map((c) => c.muroId)));
  for (const m of nivel.muros) {
    if (!murosDeAmbientes.has(m.id)) agregar("aviso", "muro-suelto", `El muro ${m.id} no cierra ningún ambiente`, { tipo: "muro", id: m.id });
  }
  for (const amb of nivel.ambientes) {
    const muros = new Set(amb.contorno.map((c) => c.muroId));
    const acceso = nivel.aberturas.some((a) => a.tipo !== "ventana" && muros.has(a.muroId));
    if (!acceso) agregar("aviso", "sin-puertas", `${amb.nombre} no tiene puertas`, { tipo: "ambiente", id: amb.id });
  }

  return controles;
}

export const contarPendientes = (nivel: Nivel): number =>
  revisarNivel(nivel).filter((c) => c.tipo === "pendiente").length;

/** Los controles de todos los niveles, más los códigos de abertura repetidos entre niveles. */
export function revisarRelevamiento(r: Relevamiento): Control[] {
  const controles = r.niveles.flatMap(revisarNivel);
  const veces = new Map<string, number>();
  for (const a of r.niveles.flatMap((n) => [...n.aberturas, ...n.electricos])) veces.set(a.codigo, (veces.get(a.codigo) ?? 0) + 1);
  for (const [codigo, n] of veces) {
    if (n > 1) controles.push({ tipo: "error", codigo: "codigo-repetido", mensaje: `El código ${codigo} está repetido` });
  }
  return controles;
}
