import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";

export default async function ContactoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacto = await prisma.contacto.findUnique({ where: { id } });
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
          <Link
            href={`/contactos/${contacto.id}/editar`}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Editar
          </Link>
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
      </main>
    </>
  );
}
