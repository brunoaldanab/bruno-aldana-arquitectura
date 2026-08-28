import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white px-4 py-3">
      <nav className="mx-auto flex max-w-3xl items-center gap-4 text-sm font-medium text-neutral-600">
        <Link href="/" className="text-neutral-900">
          Bruno Aldana Arquitectura
        </Link>
        <Link href="/contactos" className="hover:text-neutral-900">
          Contactos
        </Link>
      </nav>
    </header>
  );
}
