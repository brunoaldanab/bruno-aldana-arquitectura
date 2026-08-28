import { AppHeader } from "@/components/AppHeader";
import { ContactoForm } from "../ContactoForm";
import { createContacto } from "../actions";

export default function NuevoContactoPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900">Nuevo contacto</h1>
        <ContactoForm action={createContacto} submitLabel="Crear contacto" />
      </main>
    </>
  );
}
