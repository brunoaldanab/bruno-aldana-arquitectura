import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";

const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

const ESTADO_CLASS: Record<string, string> = {
  BORRADOR: "bg-neutral-100 text-neutral-600",
  ENVIADA: "bg-blue-50 text-blue-700",
  APROBADA: "bg-green-50 text-green-700",
  RECHAZADA: "bg-red-50 text-red-700",
};

function formatMonto(monto: unknown, moneda: string) {
  if (monto === null || monto === undefined) return "Sin monto";
  return `${Number(monto).toLocaleString("es-BO", { minimumFractionDigits: 2 })} ${moneda}`;
}

export default async function ContactoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacto = await prisma.contacto.findUnique({
    where: { id },
    include: { cotizaciones: { orderBy: { createdAt: "desc" } } },
  });
  if (!contacto) notFound();

  const campos: [string, string | null][] = [
    ["Teléfono", contacto.telefono],
    ["Email", contacto.email],
    ["Dirección del proyecto", contacto.direccionProyecto],
    ["Origen", contacto.origen],
  ];

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/contactos" className="text-sm text-neutral-500 hover:underline">
              ← Contactos
            </Link>
            <h1 className="mt-1 text-xl font-semibold text-neutral-900">{contacto.nombre}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/contactos/${contacto.id}/entrevista`}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Ficha de entrevista
            </Link>
            <Link
              href={`/contactos/${contacto.id}/editar`}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Editar
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2">
          {campos.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
              <dd className="mt-1 text-sm text-neutral-900">{value || "—"}</dd>
            </div>
          ))}
        </dl>

        {contacto.notas && (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Notas</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-900">{contacto.notas}</p>
          </div>
        )}

        <div className="mb-4 mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Cotizaciones</h2>
          <Link
            href={`/contactos/${contacto.id}/cotizaciones/nueva`}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Nueva cotización
          </Link>
        </div>

        {contacto.cotizaciones.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay cotizaciones para este contacto.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {contacto.cotizaciones.map((cotizacion) => (
              <li key={cotizacion.id}>
                <Link
                  href={`/contactos/${contacto.id}/cotizaciones/${cotizacion.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{cotizacion.titulo}</p>
                    <p className="text-sm text-neutral-500">
                      {formatMonto(cotizacion.montoTotal, cotizacion.moneda)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_CLASS[cotizacion.estado]}`}
                  >
                    {ESTADO_LABEL[cotizacion.estado]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
