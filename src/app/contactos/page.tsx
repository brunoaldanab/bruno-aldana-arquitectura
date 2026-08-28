import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";

export default async function ContactosPage() {
  const contactos = await prisma.contacto.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Contactos</h1>
          <Link
            href="/contactos/nuevo"
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Nuevo contacto
          </Link>
        </div>

        {contactos.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no cargaste ningún contacto.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {contactos.map((contacto) => (
              <li key={contacto.id}>
                <Link href={`/contactos/${contacto.id}`} className="block px-4 py-3 hover:bg-neutral-50">
                  <p className="font-medium text-neutral-900">{contacto.nombre}</p>
                  <p className="text-sm text-neutral-500">
                    {[contacto.telefono, contacto.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
