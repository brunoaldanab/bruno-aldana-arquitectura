import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { CotizacionForm } from "../CotizacionForm";
import { createCotizacion } from "../actions";

export default async function NuevaCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacto = await prisma.contacto.findUnique({ where: { id } });
  if (!contacto) notFound();

  const action = createCotizacion.bind(null, id);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <p className="mb-1 text-sm text-neutral-500">{contacto.nombre}</p>
        <h1 className="font-display mb-6 text-3xl font-light tracking-tight text-neutral-900">Nueva cotización</h1>
        <CotizacionForm action={action} submitLabel="Crear cotización" />
      </main>
    </>
  );
}
