import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconDocument } from "@/components/ui/icons";

const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

const ESTADO_TONE: Record<string, "neutral" | "info" | "success" | "danger"> = {
  BORRADOR: "neutral",
  ENVIADA: "info",
  APROBADA: "success",
  RECHAZADA: "danger",
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
            <Link href="/contactos" className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline">
              ← Contactos
            </Link>
            <h1 className="font-display mt-1 text-3xl font-light tracking-tight text-neutral-900">{contacto.nombre}</h1>
          </div>
          <div className="flex gap-2">
            <Button href={`/contactos/${contacto.id}/entrevista`} variant="secondary" size="sm">
              Ficha de entrevista
            </Button>
            <Button href={`/contactos/${contacto.id}/editar`} variant="secondary" size="sm">
              Editar
            </Button>
          </div>
        </div>

        <Card className="animate-rise-in grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          {campos.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
              <dd className="mt-1 text-sm text-neutral-900">{value || "—"}</dd>
            </div>
          ))}
        </Card>

        {contacto.notas && (
          <Card className="animate-rise-in mt-4 p-6" style={{ animationDelay: "60ms" }}>
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">Notas</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-900">{contacto.notas}</p>
          </Card>
        )}

        <div className="mb-4 mt-8 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-neutral-900">Cotizaciones</h2>
          <Button href={`/contactos/${contacto.id}/cotizaciones/nueva`} size="sm">
            Nueva cotización
          </Button>
        </div>

        {contacto.cotizaciones.length === 0 ? (
          <EmptyState icon={<IconDocument />} title="Todavía no hay cotizaciones para este contacto" />
        ) : (
          <ul className="animate-rise-in overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
            {contacto.cotizaciones.map((cotizacion, i) => (
              <li
                key={cotizacion.id}
                className={`animate-rise-in ${i > 0 ? "border-t border-neutral-200" : ""}`}
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
              >
                <Link
                  href={`/contactos/${contacto.id}/cotizaciones/${cotizacion.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{cotizacion.titulo}</p>
                    <p className="text-sm tabular-nums text-neutral-500">
                      {formatMonto(cotizacion.montoTotal, cotizacion.moneda)}
                    </p>
                  </div>
                  <Badge tone={ESTADO_TONE[cotizacion.estado]}>{ESTADO_LABEL[cotizacion.estado]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
