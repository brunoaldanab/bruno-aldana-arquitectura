import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconInbox } from "@/components/ui/icons";

export default async function ContactosPage() {
  const contactos = await prisma.contacto.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-14">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-[0.2em] text-neutral-500 uppercase">Estudio</span>
            <h1 className="font-display text-3xl font-light tracking-tight text-neutral-900">Contactos</h1>
          </div>
          <Button href="/contactos/nuevo" size="sm">
            Nuevo contacto
          </Button>
        </div>

        {contactos.length === 0 ? (
          <EmptyState
            icon={<IconInbox />}
            title="Todavía no cargaste ningún contacto"
            description="Los contactos que agregues van a aparecer acá, con acceso directo a su ficha de entrevista y cotizaciones."
            action={
              <Button href="/contactos/nuevo" size="sm">
                Crear el primero
              </Button>
            }
          />
        ) : (
          <ul className="animate-rise-in overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
            {contactos.map((contacto, i) => (
              <li
                key={contacto.id}
                className={`animate-rise-in ${i > 0 ? "border-t border-neutral-200" : ""}`}
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
              >
                <Link href={`/contactos/${contacto.id}`} className="block px-4 py-4 transition hover:bg-neutral-50">
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
