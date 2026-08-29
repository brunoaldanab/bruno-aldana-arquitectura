"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [{ href: "/contactos", label: "Contactos" }];

/**
 * La barra que se ve en cada pantalla del día.
 *
 * Dos decisiones del manual, las dos deliberadas:
 *
 * 1. **La firma no se re-tipea.** Antes acá se escribía "Bruno Aldana
 *    Arquitectura" con la fuente de la interfaz. Ahora entra el vector de la
 *    firma, que ya tiene el texto convertido a curvas: se ve igual en cualquier
 *    máquina y no depende de que Archivo haya cargado.
 * 2. **Nada de esto se anima.** Es el elemento que Bruno ve cien veces al día, y
 *    el presupuesto de animación se gasta en lo que se ve poco. El único cambio
 *    con movimiento es el color del enlace al pasar el mouse, que es respuesta y
 *    no decoración.
 *
 * El grafito del fondo es el mismo del `body`; lo que separa la barra del resto
 * es un filo de luz de un píxel, no una sombra: sobre grafito una sombra no se ve.
 */
export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/8 bg-neutral-950">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="flex items-center" aria-label="Inicio">
          {/* La firma es un vector plano: next/image no le aporta nada y le
              agregaría una capa de optimización que con SVG no hace falta. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/firma-horizontal-blanco.svg"
            alt="Bruno Aldana · Arquitectura"
            width={106}
            height={22}
            className="h-[22px] w-auto"
          />
        </Link>

        <div className="rotulo flex items-center gap-5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`transition-colors duration-150 ${
                  active ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-200"
                }`}
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
