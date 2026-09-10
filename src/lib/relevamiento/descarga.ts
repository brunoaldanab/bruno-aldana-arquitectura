// src/lib/relevamiento/descarga.ts
import type { Relevamiento } from "./formato";

export function nombreDeArchivo(nombre: string, fecha: string): string {
  const slug = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `relevamiento-${slug || "sin-nombre"}-${fecha}.json`;
}

/** Descarga el relevamiento con el formato "ba-relevamiento": es el archivo que lee el botón de pyRevit. */
export function descargarJson(r: Relevamiento): void {
  const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreDeArchivo(r.proyecto.nombre, r.proyecto.fechaRelevamiento);
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
