import { AppHeader } from "@/components/AppHeader";
import { ContactoForm } from "../ContactoForm";
import { createContacto } from "../actions";

export default function NuevoContactoPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-14">
        <h1 className="font-display mb-8 text-4xl leading-[1.05] font-light tracking-[-0.02em] text-neutral-900">Nuevo contacto</h1>
        <ContactoForm action={createContacto} submitLabel="Crear contacto" />
      </main>
    </>
  );
}
