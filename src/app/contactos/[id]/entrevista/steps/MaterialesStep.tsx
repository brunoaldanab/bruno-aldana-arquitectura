"use client";

import { materialCards } from "@/lib/entrevista/data";
import type { EntrevistaState } from "@/lib/entrevista/types";

export function MaterialesStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  function toggle(n: string) {
    setState((s) => {
      const has = s.materiales.seleccion.includes(n);
      return {
        ...s,
        materiales: { ...s.materiales, seleccion: has ? s.materiales.seleccion.filter((x) => x !== n) : [...s.materiales.seleccion, n] },
      };
    });
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Materiales</h2>
      <p className="mb-6 text-sm text-neutral-500">Usá esta grilla como disparador visual; complementá con muestras físicas si las tenés a mano.</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {materialCards.map((m) => {
          const selected = state.materiales.seleccion.includes(m.n);
          return (
            <button
              key={m.n}
              type="button"
              onClick={() => toggle(m.n)}
              className={`overflow-hidden rounded-lg border text-left transition ${
                selected ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <div className="h-16 w-full" style={{ background: m.css }} />
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-xs font-medium text-neutral-700">{m.n}</span>
                {selected && <span className="text-neutral-900">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Notas de materiales (pisos, cocina, baños)</span>
        <textarea
          rows={3}
          value={state.materiales.notas}
          onChange={(e) => setState((s) => ({ ...s, materiales: { ...s.materiales, notas: e.target.value } }))}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </label>
    </div>
  );
}
