import { logout } from "@/app/login/actions";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">Bruno Aldana Arquitectura</h1>
      <p className="text-sm text-neutral-500">Sesión iniciada. El panel de contactos y cotizaciones va acá.</p>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
