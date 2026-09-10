// src/app/manifest.ts
import type { MetadataRoute } from "next";

/**
 * Lo que el iPhone lee al "Agregar a pantalla de inicio": abre a pantalla
 * completa y sobre grafito. El nombre corto es "Bruno Aldana" porque el manual
 * de marca pide el nombre completo y "BA" nunca como palabra.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bruno Aldana · Arquitectura",
    short_name: "Bruno Aldana",
    description: "Contactos, entrevistas y relevamiento del estudio.",
    start_url: "/contactos",
    display: "standalone",
    background_color: "#0F1113",
    theme_color: "#0F1113",
    icons: [{ src: "/icon.png", sizes: "4000x4000", type: "image/png" }],
  };
}
