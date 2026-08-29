"use client";

import { officeFuncionalGroups } from "@/lib/entrevista/data";
import type { EntrevistaState } from "@/lib/entrevista/types";
import { ChipSingle } from "@/components/entrevista/ChipSingle";
import { ChipMulti } from "@/components/entrevista/ChipMulti";
import { inputClass } from "@/components/ui/field";

const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500";

export function OficinaStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const o = state.oficina;

  function setField<K extends keyof EntrevistaState["oficina"]>(key: K, value: EntrevistaState["oficina"][K]) {
    setState((s) => ({ ...s, oficina: { ...s.oficina, [key]: value } }));
  }

  function toggleFuncional(item: string) {
    setState((s) => {
      const has = s.oficina.funcional.includes(item);
      return {
        ...s,
        oficina: {
          ...s.oficina,
          funcional: has ? s.oficina.funcional.filter((x) => x !== item) : [...s.oficina.funcional, item],
        },
      };
    });
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-extralight tracking-[-0.03em] text-neutral-100">Sobre la oficina</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">
        Estas preguntas son específicas de espacios de trabajo — no aparecen en proyectos de vivienda.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Cantidad de personas / puestos</span>
          <input
            type="text"
            value={o.personas}
            onChange={(e) => setField("personas", e.target.value)}
            placeholder="Ej: 15 puestos"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Horario de uso</span>
          <input
            type="text"
            value={o.horario}
            onChange={(e) => setField("horario", e.target.value)}
            placeholder="Ej: L-V 9 a 18h"
            className={inputClass}
          />
        </label>
      </div>

      <div className="mb-5">
        <span className={labelClass}>Modalidad de trabajo</span>
        <ChipSingle options={["Open space", "Oficinas privadas", "Mixto"]} value={o.modalidad} onChange={(v) => setField("modalidad", v)} />
      </div>

      <div className="mb-5">
        <span className={labelClass}>¿Necesitan sala de reuniones?</span>
        <ChipSingle
          options={["Sí, chica (2-4)", "Sí, grande (6+)", "No"]}
          value={o.salaReuniones}
          onChange={(v) => setField("salaReuniones", v)}
        />
      </div>

      <div className="mb-5">
        <span className={labelClass}>¿Reciben clientes o visitas en la oficina?</span>
        <ChipSingle options={["Sí, frecuente", "A veces", "No"]} value={o.visitas} onChange={(v) => setField("visitas", v)} />
      </div>

      <div className="mb-5">
        <span className={labelClass}>Prioridad acústica (llamadas, concentración)</span>
        <ChipSingle options={["Alta", "Media", "Baja"]} value={o.acustica} onChange={(v) => setField("acustica", v)} />
      </div>

      <label className="mb-4 block">
        <span className={labelClass}>Identidad de marca a reflejar (colores corporativos, logo, valores)</span>
        <textarea
          rows={3}
          value={o.identidadMarca}
          onChange={(e) => setField("identidadMarca", e.target.value)}
          placeholder="Ej: usar el azul y blanco del logo, transmitir innovación..."
          className={inputClass}
        />
      </label>
      <label className="mb-6 block">
        <span className={labelClass}>Necesidades de tecnología</span>
        <textarea
          rows={3}
          value={o.tecnologia}
          onChange={(e) => setField("tecnologia", e.target.value)}
          placeholder="Ej: pantallas para videollamadas, cableado estructurado..."
          className={inputClass}
        />
      </label>

      <h3 className="mb-1 text-base font-medium text-neutral-100">Auditoría funcional y ergonómica</h3>
      <p className="mb-4 text-sm text-neutral-500">
        Esto va más allá del gusto — son los puntos técnicos que definen si la oficina realmente funciona bien día a día. Marcá los que
        apliquen a este proyecto.
      </p>
      <div className="space-y-4">
        {officeFuncionalGroups.map((g) => (
          <div key={g.categoria}>
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-neutral-500">{g.categoria}</p>
            <ChipMulti options={g.items} values={o.funcional} onToggle={toggleFuncional} small />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-500">{o.funcional.length} ítems marcados como relevantes para este proyecto</p>
    </div>
  );
}
