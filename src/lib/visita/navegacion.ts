// src/lib/visita/navegacion.ts

/**
 * La visita es una sola página guardada en el teléfono: las pantallas se eligen por
 * parámetros de la dirección, nunca por rutas de Next, que piden datos al servidor.
 */
export type Ruta =
  | { vista: "contactos" }
  | { vista: "nuevo" }
  | { vista: "contacto"; id: string }
  | { vista: "editar"; id: string }
  | { vista: "relevamiento"; id: string };

export function leerRuta(search: string): Ruta {
  const p = new URLSearchParams(search);
  const id = p.get("contacto");
  const vista = p.get("vista");
  if (vista === "nuevo") return { vista: "nuevo" };
  if (id && vista === "editar") return { vista: "editar", id };
  if (id && vista === "relevamiento") return { vista: "relevamiento", id };
  if (id) return { vista: "contacto", id };
  return { vista: "contactos" };
}

export function rutaAUrl(r: Ruta): string {
  switch (r.vista) {
    case "contactos":
      return "/visita";
    case "nuevo":
      return "/visita?vista=nuevo";
    case "contacto":
      return `/visita?contacto=${encodeURIComponent(r.id)}`;
    case "editar":
      return `/visita?contacto=${encodeURIComponent(r.id)}&vista=editar`;
    case "relevamiento":
      return `/visita?contacto=${encodeURIComponent(r.id)}&vista=relevamiento`;
  }
}
