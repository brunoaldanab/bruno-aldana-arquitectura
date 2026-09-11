// src/lib/relevamiento/descarga.ts

/** El nombre del archivo para Revit: lo usa `src/lib/plano/archivo.ts`, que es quien descarga. */
export function nombreDeArchivo(nombre: string, fecha: string): string {
  const slug = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `relevamiento-${slug || "sin-nombre"}-${fecha}.json`;
}
