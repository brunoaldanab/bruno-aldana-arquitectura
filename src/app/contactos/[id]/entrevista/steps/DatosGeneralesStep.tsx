"use client";

import type { EntrevistaState } from "@/lib/entrevista/types";
import { inputClass } from "@/components/ui/field";

const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500";

export function DatosGeneralesStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const tipo = state.proyecto.tipoProyecto;
  const esVivienda = tipo === "vivienda";

  function set(key: keyof EntrevistaState["proyecto"], value: string) {
    setState((s) => ({ ...s, proyecto: { ...s.proyecto, [key]: value } }));
  }

  const integrantesLabel = esVivienda
    ? "¿Quiénes van a vivir ahí?"
    : tipo === "oficina"
      ? "¿Cuántas personas trabajan ahí?"
      : "¿Quién va a usar este ambiente?";
  const integrantesPlaceholder = esVivienda
    ? "Ej: pareja + 2 hijos + mascota"
    : tipo === "oficina"
      ? "Ej: 12 personas"
      : "Ej: uso personal / toda la familia";

  return (
    <div>
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-light tracking-[-0.02em] text-neutral-900">Datos generales</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">
        {esVivienda
          ? "Definí el tipo de propiedad — de eso depende qué ambientes van a aparecer después."
          : "Estos datos van a encabezar la ficha final del proyecto."}
      </p>

      {esVivienda && (
        <div className="mb-5">
          <span className={labelClass}>Tipo de propiedad</span>
          <div className="flex gap-2">
            {["Departamento", "Casa"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("tipo", opt)}
                aria-pressed={state.proyecto.tipo === opt}
                className={`chip px-4 py-2.5 text-sm ${state.proyecto.tipo === opt ? "chip-activo" : ""}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Nombre del/los cliente/s</span>
          <input
            type="text"
            value={state.proyecto.cliente}
            onChange={(e) => set("cliente", e.target.value)}
            placeholder="Ej: Familia Rodríguez / Empresa XYZ"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Dirección / referencia</span>
          <input
            type="text"
            value={state.proyecto.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            placeholder="Barrio, torre, calle..."
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Fecha de la reunión</span>
          <input type="date" value={state.proyecto.fecha} onChange={(e) => set("fecha", e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Superficie aproximada (m²)</span>
          <input
            type="text"
            value={state.proyecto.m2}
            onChange={(e) => set("m2", e.target.value)}
            placeholder="Ej: 120 m²"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            De acá sale el precio de la propuesta. Escribí solo el número.
          </p>
        </label>
        <label className="block">
          <span className={labelClass}>{integrantesLabel}</span>
          <input
            type="text"
            value={state.proyecto.integrantes}
            onChange={(e) => set("integrantes", e.target.value)}
            placeholder={integrantesPlaceholder}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Contacto / quién decide</span>
          <input
            type="text"
            value={state.proyecto.contacto}
            onChange={(e) => set("contacto", e.target.value)}
            placeholder="Nombre, teléfono"
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}
