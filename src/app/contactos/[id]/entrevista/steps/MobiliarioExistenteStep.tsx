"use client";

import type { EntrevistaState } from "@/lib/entrevista/types";
import { inputClass } from "@/components/ui/field";

const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500";

export function MobiliarioExistenteStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const m = state.mobiliario;

  function set(key: keyof EntrevistaState["mobiliario"], value: string) {
    setState((s) => ({ ...s, mobiliario: { ...s.mobiliario, [key]: value } }));
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-light tracking-[-0.02em] text-neutral-900">Mobiliario existente</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">Definir qué se muda con ellos condiciona las medidas de todo el proyecto nuevo.</p>
      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className={labelClass}>Muebles actuales que quieren reutilizar</span>
          <textarea rows={3} value={m.reutilizar} onChange={(e) => set("reutilizar", e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Piezas &quot;no negociables&quot;</span>
          <textarea rows={3} value={m.noNegociables} onChange={(e) => set("noNegociables", e.target.value)} className={inputClass} />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Electrodomésticos ya definidos</span>
            <textarea rows={3} value={m.electrodomesticos} onChange={(e) => set("electrodomesticos", e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Obras de arte / objetos especiales</span>
            <textarea rows={3} value={m.arte} onChange={(e) => set("arte", e.target.value)} className={inputClass} />
          </label>
        </div>
      </div>
    </div>
  );
}
