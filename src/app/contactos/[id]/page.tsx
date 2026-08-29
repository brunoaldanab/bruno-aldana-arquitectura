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
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/contactos"
          className="rotulo text-neutral-500 transition-colors duration-150 hover:text-neutral-200"
        >
          ← Contactos
        </Link>

        <div className="mt-4 mb-10 flex flex-wrap items-end justify-between gap-5">
          <h1 className="font-display text-5xl font-extralight tracking-[-0.03em] text-neutral-100">
            {contacto.nombre}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button href={`/contactos/${contacto.id}/entrevista`} variant="secondary" size="sm">
              Ficha de entrevista
            </Button>
            <Button href={`/contactos/${contacto.id}/editar`} variant="secondary" size="sm">
              Editar
            </Button>
            <Button href={`/contactos/${contacto.id}/propuesta`} size="sm">
              Generar propuesta
            </Button>
          </div>
        </div>

        <Card className="animate-rise-in grid grid-cols-1 gap-5 p-7 sm:grid-cols-2">
          {campos.map(([label, value]) => (
            <div key={label}>
              <dt className="rotulo text-neutral-500">{label}</dt>
              <dd className="dato mt-1.5 text-neutral-100">{value || "—"}</dd>
            </div>
          ))}
        </Card>

        {contacto.notas && (
          <Card className="animate-rise-in mt-4 p-7">
            <h2 className="rotulo text-neutral-500">Notas</h2>
            <p className="mt-1.5 text-sm whitespace-pre-wrap text-neutral-200">{contacto.notas}</p>
          </Card>
        )}

        <div className="mt-14 mb-4 flex items-center justify-between">
          <h2 className="rotulo text-neutral-500">Cotizaciones</h2>
          <Button href={`/contactos/${contacto.id}/cotizaciones/nueva`} variant="secondary" size="sm">
            Nueva cotización
          </Button>
        </div>

        {contacto.cotizaciones.length === 0 ? (
          <EmptyState icon={<IconDocument />} title="Todavía no hay cotizaciones para este contacto" />
        ) : (
          <ul className="animate-rise-in overflow-hidden rounded-2xl border border-white/8 bg-neutral-900 shadow-soft">
            {contacto.cotizaciones.map((cotizacion, i) => (
              <li key={cotizacion.id} className={i > 0 ? "border-t border-white/8" : ""}>
                <Link
                  href={`/contactos/${contacto.id}/cotizaciones/${cotizacion.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 hover:bg-white/[0.04]"
                >
                  <div>
                    <p className="text-neutral-100">{cotizacion.titulo}</p>
                    <p className="dato mt-1 text-neutral-500">
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
