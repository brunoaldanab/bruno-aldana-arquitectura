import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
        <p className="font-display text-6xl font-light text-neutral-300">404</p>
        <h1 className="font-display text-2xl font-light tracking-tight text-neutral-900">No encontramos esta página</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          Puede que el enlace esté roto o que el contacto/cotización ya no exista.
        </p>
        <Button href="/contactos" className="mt-3">
          Volver a contactos
        </Button>
      </main>
    </>
  );
}
