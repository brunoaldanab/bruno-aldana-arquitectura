import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { CotizacionForm } from "../CotizacionForm";
import { updateCotizacion } from "../actions";

export default async function CotizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string; cotizacionId: string }>;
}) {
  const { id, cotizacionId } = await params;
  const cotizacion = await prisma.cotizacion.findUnique({ where: { id: cotizacionId } });
  if (!cotizacion || cotizacion.contactoId !== id) notFound();

  const action = updateCotizacion.bind(null, id, cotizacionId);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <Link href={`/contactos/${id}`} className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline">
          ← Volver al contacto
        </Link>
        <h1 className="font-display mb-6 mt-1 text-3xl font-light tracking-tight text-neutral-900">{cotizacion.titulo}</h1>
        <CotizacionForm
          action={action}
          submitLabel="Guardar cambios"
          defaultValues={{
            titulo: cotizacion.titulo,
            montoTotal: cotizacion.montoTotal?.toString(),
            moneda: cotizacion.moneda,
            estado: cotizacion.estado,
            notas: cotizacion.notas ?? undefined,
          }}
        />
      </main>
    </>
  );
}
