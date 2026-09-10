// src/app/contactos/[id]/relevamiento/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import type { EntrevistaState } from "@/lib/entrevista/types";
import { relevamientoSchema } from "@/lib/relevamiento/formato";
import { RelevamientoApp } from "./RelevamientoApp";

export default async function RelevamientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacto = await prisma.contacto.findUnique({ where: { id } });
  if (!contacto) notFound();

  const [guardado, entrevista] = await Promise.all([
    prisma.relevamiento.findUnique({ where: { contactoId: id } }),
    prisma.entrevista.findFirst({ where: { contactoId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  // Los ambientes que ya se eligieron en la entrevista arrancan cargados.
  const ambientes = (entrevista?.data as unknown as EntrevistaState | undefined)?.ambientesSeleccion ?? [];

  // Solo lo que valida entra a la pantalla: un JSON roto no debe romper la visita.
  const valido = guardado ? relevamientoSchema.safeParse(guardado.data) : null;
  const remoto = guardado && valido?.success ? { data: valido.data, version: guardado.version } : null;

  return (
    <>
      <div className="print:hidden">
        <AppHeader />
      </div>
      <RelevamientoApp
        contactoId={id}
        nombre={contacto.nombre}
        direccion={contacto.direccionProyecto ?? ""}
        ambientesEntrevista={ambientes}
        remoto={remoto}
      />
    </>
  );
}
