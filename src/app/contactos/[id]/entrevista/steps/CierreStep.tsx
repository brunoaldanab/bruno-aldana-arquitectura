"use client";

import type { EntrevistaState } from "@/lib/entrevista/types";

const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";
const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500";

export function CierreStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const c = state.cierre;

  function set(key: keyof EntrevistaState["cierre"], value: string) {
    setState((s) => ({ ...s, cierre: { ...s.cierre, [key]: value } }));
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Cierre del relevamiento</h2>
      <p className="mb-6 text-sm text-neutral-500">Las tres últimas preguntas suelen sacar la información más honesta de toda la entrevista.</p>

      <label className="mb-5 block">
        <span className={labelClass}>Algo que NO quieran en el espacio</span>
        <textarea rows={3} value={c.evitar} onChange={(e) => set("evitar", e.target.value)} className={inputClass} />
      </label>

      <label className="mb-5 block">
        <span className={labelClass}>Una palabra para cómo quieren sentirse ahí</span>
        <input
          type="text"
          value={c.palabra}
          onChange={(e) => set("palabra", e.target.value)}
          placeholder="Ej: calma, orgullo, luz..."
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Temas o preocupaciones pendientes</span>
        <textarea rows={3} value={c.pendientes} onChange={(e) => set("pendientes", e.target.value)} className={inputClass} />
      </label>
    </div>
  );
}
