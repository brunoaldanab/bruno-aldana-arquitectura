// src/lib/destino.ts

/** Adónde volver después del login. Solo rutas de esta app: un link armado no puede mandar a otro sitio. */
export function destinoSeguro(valor: unknown): string {
  if (typeof valor !== "string") return "/";
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return "/";
  return valor;
}
