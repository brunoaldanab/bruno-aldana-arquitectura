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
      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <span className="rotulo text-neutral-500">
              Estudio · {String(contactos.length).padStart(2, "0")} en cartera
            </span>
            <h1 className="font-display text-5xl font-extralight tracking-[-0.03em] text-neutral-100">
              Contactos
            </h1>
          </div>
          <Button href="/contactos/nuevo" size="sm">
            Nuevo contacto
          </Button>
        </div>

        {contactos.length === 0 ? (
          <EmptyState
            icon={<IconInbox />}
            title="Todavía no cargaste ningún contacto"
            description="Los contactos que agregues van a aparecer acá, con acceso directo a su ficha de entrevista y sus cotizaciones."
            action={
              <Button href="/contactos/nuevo" size="sm">
                Crear el primero
              </Button>
            }
          />
        ) : (
          /*
           * La lista entra con un solo fundido y sin escalonar fila por fila.
           *
           * Es la pantalla que Bruno abre decenas de veces al día, y a esa
           * frecuencia el escalonado deja de leerse como cuidado y empieza a
           * leerse como demora: hay que esperar a que termine para poder tocar.
           * El presupuesto de animación se gasta en la entrevista y en la
           * propuesta, que se ven poco y tienen que impresionar.
           */
          <ul className="animate-rise-in overflow-hidden rounded-2xl border border-white/8 bg-neutral-900 shadow-soft">
            {contactos.map((contacto, i) => (
              <li key={contacto.id} className={i > 0 ? "border-t border-white/8" : ""}>
                <Link
                  href={`/contactos/${contacto.id}`}
                  className="flex items-baseline justify-between gap-4 px-5 py-4 transition-colors duration-150 hover:bg-white/[0.04]"
                >
                  <span className="font-normal text-neutral-100">{contacto.nombre}</span>
                  <span className="dato shrink-0 text-neutral-500">
                    {[contacto.telefono, contacto.email].filter(Boolean).join(" · ") ||
                      "Sin datos de contacto"}
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
