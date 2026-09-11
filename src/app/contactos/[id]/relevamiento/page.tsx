// src/app/contactos/[id]/relevamiento/page.tsx
import { redirect } from "next/navigation";
import { rutaAUrl } from "@/lib/visita/navegacion";

/**
 * El relevamiento vive en el modo visita, que funciona sin señal. Esta dirección
 * queda para los enlaces viejos y lleva directo al plano del contacto.
 */
export default async function RelevamientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(rutaAUrl({ vista: "relevamiento", id }));
}
