import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { ContactoForm } from "../../ContactoForm";
import { updateContacto } from "../../actions";

export default async function EditarContactoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacto = await prisma.contacto.findUnique({ where: { id } });
  if (!contacto) notFound();

  const action = updateContacto.bind(null, id);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-display mb-6 text-3xl font-light tracking-tight text-neutral-900">Editar contacto</h1>
        <ContactoForm
          action={action}
          submitLabel="Guardar cambios"
          defaultValues={{
            nombre: contacto.nombre,
            telefono: contacto.telefono ?? undefined,
            email: contacto.email ?? undefined,
            direccionProyecto: contacto.direccionProyecto ?? undefined,
            notas: contacto.notas ?? undefined,
            origen: contacto.origen ?? undefined,
          }}
        />
      </main>
    </>
  );
}
