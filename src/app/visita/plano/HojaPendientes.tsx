// src/app/visita/plano/HojaPendientes.tsx
"use client";

import { revisarNivel } from "@/lib/plano/controles";
import type { Control, Nivel } from "@/lib/plano/modelo";
import { seleccionDeElemento } from "@/lib/plano/herramientas";
import type { Seleccion } from "@/lib/plano/toque";
import { Hoja } from "./Hoja";

/**
 * Qué falta para que el relevamiento esté completo, en una lista que se toca.
 * Existe porque el cartel decía "20 cotas sin medir" y no había forma de saber
 * cuáles eran: cada línea de acá lleva al elemento y le abre su hoja.
 */

const TITULO: Record<Control["tipo"], string> = {
  error: "Errores · esto no llega a Revit",
  pendiente: "Falta medir",
  aviso: "Para revisar",
};

const COLOR: Record<Control["tipo"], string> = {
  error: "text-danger-600",
  pendiente: "text-neutral-100",
  aviso: "text-neutral-400",
};

export function HojaPendientes({
  nivel,
  onSeleccion,
  onCerrar,
}: {
  nivel: Nivel;
  onSeleccion: (s: Seleccion) => void;
  onCerrar: () => void;
}) {
  const controles = revisarNivel(nivel);
  const grupos = (["error", "pendiente", "aviso"] as const)
    .map((tipo) => ({ tipo, lista: controles.filter((c) => c.tipo === tipo) }))
    .filter((g) => g.lista.length > 0);

  const faltan = controles.filter((c) => c.tipo === "pendiente").length;

  return (
    <Hoja titulo="Qué falta" estado={faltan === 0 ? "Todo medido" : `${faltan} sin medir`} onCerrar={onCerrar}>
      {grupos.length === 0 && <p className="text-sm text-neutral-400">No queda nada pendiente en este nivel.</p>}
      {grupos.map((g) => (
        <div key={g.tipo} className="grid gap-1.5">
          <span className="rotulo text-neutral-500">{TITULO[g.tipo]}</span>
          <ul className="grid gap-1">
            {g.lista.map((c, i) => {
              const sel = c.elemento ? seleccionDeElemento(nivel, c.elemento) : null;
              const texto = <span className={`text-[15px] font-light ${COLOR[g.tipo]}`}>{c.mensaje}</span>;
              return (
                <li key={`${c.codigo}:${i}`}>
                  {sel ? (
                    <button
                      type="button"
                      onClick={() => onSeleccion(sel)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-3 py-2.5 text-left"
                    >
                      {texto}
                      <span className="rotulo shrink-0 text-neutral-500">Ir</span>
                    </button>
                  ) : (
                    <p className="rounded-xl bg-white/[0.035] px-3 py-2.5">{texto}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </Hoja>
  );
}
