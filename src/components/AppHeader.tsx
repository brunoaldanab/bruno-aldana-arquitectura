"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [{ href: "/contactos", label: "Contactos" }];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-neutral-900">
      <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-950">
            <Image src="/logo-ab.png" alt="Bruno Aldana Arquitectura" width={32} height={32} className="h-full w-full object-cover" priority />
          </span>
          <span className="font-display text-sm font-semibold tracking-tight text-white">
            Bruno Aldana <span className="text-neutral-400">Arquitectura</span>
          </span>
        </Link>

        <div className="flex items-center gap-5 text-xs font-medium tracking-[0.12em] uppercase">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition ${active ? "text-accent-400" : "text-neutral-400 hover:text-white"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
