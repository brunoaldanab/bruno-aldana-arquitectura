"use client";

import type { EntrevistaState } from "@/lib/entrevista/types";
import { ChipSingle } from "@/components/entrevista/ChipSingle";
import { inputClass } from "@/components/ui/field";

const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500";

export function PresupuestoStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const p = state.presupuesto;

  function set(key: keyof EntrevistaState["presupuesto"], value: string) {
    setState((s) => ({ ...s, presupuesto: { ...s.presupuesto, [key]: value } }));
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-extralight tracking-[-0.03em] text-neutral-100">Presupuesto</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">Preguntalo con naturalidad, después de haber generado confianza con los pasos anteriores.</p>

      <label className="mb-5 block">
        <span className={labelClass}>Presupuesto total aproximado</span>
        <input
          type="text"
          value={p.monto}
          onChange={(e) => set("monto", e.target.value)}
          placeholder="Ej: USD 25.000 — 30.000"
          className={`${inputClass} tabular-nums`}
        />
      </label>

      <div className="mb-5">
        <span className={labelClass}>¿Dónde priorizan la inversión?</span>
        <ChipSingle
          options={["Cocina", "Living", "Dormitorios", "Baños", "Equilibrado en todo"]}
          value={p.distribucion}
          onChange={(v) => set("distribucion", v)}
        />
      </div>

      <div className="mb-5">
        <span className={labelClass}>¿Incluye obra (tabiques, instalaciones, pisos)?</span>
        <ChipSingle
          options={["Sí, todo incluido", "Solo mobiliario/decoración", "A definir"]}
          value={p.incluyeObra}
          onChange={(v) => set("incluyeObra", v)}
        />
      </div>

      <div>
        <span className={labelClass}>Flexibilidad si una propuesta superior cuesta más</span>
        <ChipSingle
          options={["Número fijo", "Algo de flexibilidad", "Bastante flexible"]}
          value={p.flexible}
          onChange={(v) => set("flexible", v)}
        />
      </div>
    </div>
  );
}
