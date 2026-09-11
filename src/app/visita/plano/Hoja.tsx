// src/app/visita/plano/Hoja.tsx
import type { ReactNode } from "react";
import estilos from "./Hoja.module.css";

/** La hoja de datos del elemento tocado, desde abajo y al alcance del pulgar. */
export function Hoja({ titulo, estado, onCerrar, children }: { titulo: string; estado?: string; onCerrar: () => void; children: ReactNode }) {
  return (
    <section
      aria-label={titulo}
      className={`${estilos.hoja} grid max-h-[56dvh] gap-3 overflow-y-auto rounded-t-[22px] border-t border-white/10 bg-neutral-900 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]`}
    >
      <div className="h-1 w-9 justify-self-center rounded bg-white/10" />
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="truncate text-[15px] font-light text-neutral-100">{titulo}</h2>
        <div className="flex shrink-0 items-baseline gap-4">
          {estado && <span className="rotulo text-neutral-400">{estado}</span>}
          <button type="button" onClick={onCerrar} className="rotulo text-neutral-100">Listo</button>
        </div>
      </div>
      {children}
    </section>
  );
}

export function Grupo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <span className="rotulo text-neutral-500">{etiqueta}</span>
      {children}
    </div>
  );
}

export const Dos = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 gap-2">{children}</div>;

/** Un dato calculado, que no se carga: se lee. */
export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <Grupo etiqueta={etiqueta}>
      <p className="dato rounded-xl bg-white/[0.035] px-3 py-3 text-[15px] text-neutral-300">{children}</p>
    </Grupo>
  );
}

export const Acciones = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap gap-1.5">{children}</div>;

export function Accion({ onClick, peligro = false, children }: { onClick: () => void; peligro?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rotulo rounded-full px-3 py-2.5 ${peligro ? "border border-danger-600/35 text-danger-600" : "bg-white/[0.07] text-neutral-100"}`}
    >
      {children}
    </button>
  );
}

export const claseTexto =
  "w-full rounded-xl bg-white/[0.07] px-3 py-2.5 text-base font-light text-neutral-100 outline-none placeholder:text-neutral-500 focus:shadow-[0_0_0_1.5px_var(--color-neutral-100)]";
