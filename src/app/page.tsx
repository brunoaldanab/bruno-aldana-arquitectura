import Link from "next/link";
import { logout } from "@/app/login/actions";
import { AppHeader } from "@/components/AppHeader";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Bruno Aldana Arquitectura</h1>
        <p className="text-sm text-neutral-500">Sesión iniciada.</p>
        <Link
          href="/contactos"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Ver contactos
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Cerrar sesión
          </button>
        </form>
      </main>
    </>
  );
}
