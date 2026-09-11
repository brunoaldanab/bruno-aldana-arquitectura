// src/lib/plano/archivo.ts
import { nombreDeArchivo } from "@/lib/relevamiento/descarga";
import { posicionNodo } from "./caras";
import { revisarRelevamiento } from "./controles";
import { centroAbertura, hastaEsquina } from "./elementos";
import { relevamientoSchema, type Calculado, type Relevamiento } from "./modelo";
import { contornoInterior, perimetro, puntoInterior, superficie } from "./superficie";
import { distancia, redondear } from "./vector";

/**
 * El archivo "ba-relevamiento" v2 que se lleva a Revit. Además de lo que
 * cargó Bruno, lleva el bloque "calculado" con la geometría resuelta y los
 * controles (ajuste 7): el botón de pyRevit lo lee directo, así el motor es la
 * única fuente de las esquinas y nadie vuelve a calcularlas distinto.
 */

export function calcularGeometria(r: Relevamiento): Calculado {
  const controles = revisarRelevamiento(r);
  return {
    niveles: r.niveles.map((n) => ({
      id: n.id,
      muros: n.muros.map((m) => {
        const inicio = posicionNodo(n, m.desde);
        const fin = posicionNodo(n, m.hasta);
        return { id: m.id, inicio: { ...inicio }, fin: { ...fin }, largo: redondear(distancia(inicio, fin)) };
      }),
      aberturas: n.aberturas.map((a) => ({ id: a.id, centro: centroAbertura(n, a), hastaEsquina: hastaEsquina(n, a) })),
      ambientes: n.ambientes.map((a) => {
        const contorno = contornoInterior(n, a.id);
        return {
          id: a.id,
          contorno,
          superficie: superficie(n, a.id),
          perimetro: perimetro(n, a.id),
          puntoInterior: puntoInterior(contorno),
        };
      }),
      // Los controles de todo el relevamiento (como un código repetido) van en cada nivel.
      controles: controles.filter((c) => !c.nivelId || c.nivelId === n.id),
    })),
  };
}

export const conCalculado = (r: Relevamiento): Relevamiento => ({ ...r, calculado: calcularGeometria(r) });

export const aJson = (r: Relevamiento): string => JSON.stringify(conCalculado(r), null, 2);

export const nombreArchivo = (r: Relevamiento): string => nombreDeArchivo(r.proyecto.nombre, r.proyecto.fechaRelevamiento);

export type Lectura =
  | { ok: true; relevamiento: Relevamiento }
  | { ok: false; motivo: "json" | "version-anterior" | "invalido"; mensaje: string };

/** Un relevamiento de la versión 1 no se convierte: la pantalla avisa y arranca uno nuevo. */
export function leerArchivo(texto: string): Lectura {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return { ok: false, motivo: "json", mensaje: "El archivo no se puede leer: no es un JSON válido." };
  }
  const cabecera = (datos ?? {}) as { formato?: unknown; version?: unknown };
  if (cabecera.formato === "ba-relevamiento" && cabecera.version === 1) {
    return { ok: false, motivo: "version-anterior", mensaje: "Este relevamiento es del formato anterior. Hay que empezar uno nuevo." };
  }
  const resultado = relevamientoSchema.safeParse(datos);
  if (!resultado.success) {
    return { ok: false, motivo: "invalido", mensaje: resultado.error.issues[0]?.message ?? "El archivo no es un relevamiento válido." };
  }
  return { ok: true, relevamiento: resultado.data };
}

const archivoJson = (r: Relevamiento) => new File([aJson(r)], nombreArchivo(r), { type: "application/json" });

/** Descarga el JSON en el navegador. */
export function descargarArchivo(r: Relevamiento): void {
  const url = URL.createObjectURL(archivoJson(r));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo(r);
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/**
 * En el iPhone, compartir el archivo (AirDrop, WhatsApp, Archivos) sirve para
 * pasarlo a la computadora sin depender de la señal. Devuelve false si el
 * sistema no lo permite o si Bruno cancela: la pantalla ofrece entonces la descarga.
 */
export async function compartirArchivo(r: Relevamiento): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) return false;
  const archivo = archivoJson(r);
  if (!navigator.canShare({ files: [archivo] })) return false;
  try {
    await navigator.share({ files: [archivo], title: nombreArchivo(r) });
    return true;
  } catch {
    return false;
  }
}
