"use client";

import type { EntrevistaState } from "@/lib/entrevista/types";
import { ChipSingle } from "@/components/entrevista/ChipSingle";
import { inputClass } from "@/components/ui/field";

const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500";

export function PlazosStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const pl = state.plazos;

  function set(key: keyof EntrevistaState["plazos"], value: string) {
    setState((s) => ({ ...s, plazos: { ...s.plazos, [key]: value } }));
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-light tracking-[-0.02em] text-neutral-900">Plazos</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">Fechas reales, no aspiracionales — preguntá si hay algo que las condicione.</p>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Fecha en que necesitan el espacio habitable</span>
          <input type="date" value={pl.fecha} onChange={(e) => set("fecha", e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Motivo de esa fecha (si aplica)</span>
          <input
            type="text"
            value={pl.motivo}
            onChange={(e) => set("motivo", e.target.value)}
            placeholder="Mudanza, evento, nacimiento..."
            className={inputClass}
          />
        </label>
      </div>

      <div>
        <span className={labelClass}>¿Proyecto por etapas o todo en simultáneo?</span>
        <ChipSingle
          options={["Todo en simultáneo", "Por etapas (sociales primero)", "Por etapas (a definir)"]}
          value={pl.etapas}
          onChange={(v) => set("etapas", v)}
        />
      </div>
    </div>
  );
}
