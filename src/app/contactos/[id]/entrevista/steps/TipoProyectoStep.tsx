"use client";

import { tiposProyecto } from "@/lib/entrevista/data";
import type { EntrevistaState } from "@/lib/entrevista/types";

export function TipoProyectoStep({
  state,
  setState,
  onAdvance,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
  onAdvance?: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">¿Qué vamos a diseñar hoy?</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Esto define todo el resto de la entrevista — solo vas a ver preguntas relevantes para este tipo de proyecto, sin pasos de más.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tiposProyecto.map((t) => (
          <button
            key={t.k}
            type="button"
            disabled={t.disabled}
            onClick={() => {
              setState((s) => ({ ...s, proyecto: { ...s.proyecto, tipoProyecto: t.k } }));
              onAdvance?.();
            }}
            className={`relative rounded-2xl border p-5 text-left transition ${
              state.proyecto.tipoProyecto === t.k
                ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                : "border-neutral-200 hover:border-neutral-400"
            } ${t.disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {t.disabled && (
              <span className="absolute right-3 top-3 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                Próximamente
              </span>
            )}
            <div className="mb-2 text-2xl">{t.icon}</div>
            <div className="font-medium text-neutral-900">{t.t}</div>
            <div className="text-sm text-neutral-500">{t.d}</div>
          </button>
        ))}
      </div>
      {!state.proyecto.tipoProyecto && <p className="mt-5 text-sm text-neutral-500">Elegí una opción para continuar.</p>}
    </div>
  );
}
