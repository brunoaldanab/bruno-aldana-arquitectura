"use client";

import type { EntrevistaState } from "@/lib/entrevista/types";
import { inputClass } from "@/components/ui/field";

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
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-light tracking-[-0.02em] text-neutral-900">Cierre del relevamiento</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">Las tres últimas preguntas suelen sacar la información más honesta de toda la entrevista.</p>

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
