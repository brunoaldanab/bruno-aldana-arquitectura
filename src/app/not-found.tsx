import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <p className="rotulo text-neutral-600">Error 404</p>
        <h1 className="font-display text-4xl font-extralight tracking-[-0.03em] text-neutral-100">
          No encontramos esta página
        </h1>
        <p className="max-w-sm text-sm text-neutral-500">
          Puede que el enlace esté roto o que el contacto o la cotización ya no existan.
        </p>
        <Button href="/contactos" className="mt-4">
          Volver a contactos
        </Button>
      </main>
    </>
  );
}
