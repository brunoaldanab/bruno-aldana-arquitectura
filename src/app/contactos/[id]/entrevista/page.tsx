import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { createInitialEntrevistaState, type EntrevistaState } from "@/lib/entrevista/types";
import { EntrevistaWizard } from "./EntrevistaWizard";

export default async function EntrevistaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacto = await prisma.contacto.findUnique({ where: { id } });
  if (!contacto) notFound();

  let entrevista = await prisma.entrevista.findFirst({
    where: { contactoId: id },
    orderBy: { createdAt: "desc" },
  });

  if (!entrevista) {
    entrevista = await prisma.entrevista.create({
      data: { contactoId: id, data: createInitialEntrevistaState() as unknown as object },
    });
  }

  return (
    <>
      <AppHeader />
      <EntrevistaWizard
        entrevistaId={entrevista.id}
        contactoId={id}
        contactoNombre={contacto.nombre}
        initialData={entrevista.data as unknown as EntrevistaState}
      />
    </>
  );
}
