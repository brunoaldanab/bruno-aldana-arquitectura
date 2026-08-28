"use client";

import { useState } from "react";
import { ambientesCasa, ambientesDepto, ambientesOficina, ambientesUnico } from "@/lib/entrevista/data";
import type { EntrevistaState } from "@/lib/entrevista/types";

export function SeleccionAmbientesStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const tipo = state.proyecto.tipoProyecto;
  const [otro, setOtro] = useState("");

  let lista: string[];
  let titulo: string;
  let desc: string;
  let single = false;

  if (tipo === "oficina") {
    lista = ambientesOficina;
    titulo = "¿Qué espacios tiene la oficina?";
    desc = "Marcá los espacios que existen y que vamos a intervenir.";
  } else if (tipo === "ambiente-unico") {
    lista = ambientesUnico;
    titulo = "¿Qué ambiente vamos a diseñar?";
    desc = "Elegí un solo espacio — toda la entrevista se enfoca 100% en él, sin pasos de más.";
    single = true;
  } else {
    lista = state.proyecto.tipo === "Casa" ? ambientesCasa : ambientesDepto;
    titulo = "¿Qué ambientes vamos a diseñar?";
    desc = "Marcá los ambientes que existen en la propiedad y que van a intervenir. El resto de la entrevista se ajusta a esta selección.";
  }

  function toggle(r: string) {
    if (single) {
      setState((s) => ({ ...s, ambientesSeleccion: [r] }));
      return;
    }
    setState((s) => {
      const has = s.ambientesSeleccion.includes(r);
      return {
        ...s,
        ambientesSeleccion: has ? s.ambientesSeleccion.filter((x) => x !== r) : [...s.ambientesSeleccion, r],
      };
    });
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">{titulo}</h2>
      <p className="mb-6 text-sm text-neutral-500">{desc}</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {lista.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => toggle(r)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm ${
              state.ambientesSeleccion.includes(r)
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {!single && (
        <label className="mt-5 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            Otro ambiente (si no está en la lista)
          </span>
          <input
            type="text"
            value={otro}
            onChange={(e) => setOtro(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && otro.trim()) {
                e.preventDefault();
                setState((s) => ({ ...s, ambientesSeleccion: [...s.ambientesSeleccion, otro.trim()] }));
                setOtro("");
              }
            }}
            placeholder="Escribir y presionar Enter"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </label>
      )}
    </div>
  );
}
