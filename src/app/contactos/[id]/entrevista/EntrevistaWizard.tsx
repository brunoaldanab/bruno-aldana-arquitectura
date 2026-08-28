"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { getSteps, type StepId } from "@/lib/entrevista/steps";
import type { EntrevistaState } from "@/lib/entrevista/types";
import { saveEntrevista } from "./actions";

import { TipoProyectoStep } from "./steps/TipoProyectoStep";
import { DatosGeneralesStep } from "./steps/DatosGeneralesStep";
import { SeleccionAmbientesStep } from "./steps/SeleccionAmbientesStep";
import { OficinaStep } from "./steps/OficinaStep";
import { RolesStep } from "./steps/RolesStep";
import { MobiliarioExistenteStep } from "./steps/MobiliarioExistenteStep";
import { PresupuestoStep } from "./steps/PresupuestoStep";
import { PlazosStep } from "./steps/PlazosStep";
import { CierreStep } from "./steps/CierreStep";
import { ResumenStep } from "./steps/ResumenStep";
import { PlaceholderStep } from "./steps/PlaceholderStep";

type StepComponentProps = {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
  onAdvance?: () => void;
};

const STEP_COMPONENTS: Record<StepId, React.ComponentType<StepComponentProps>> = {
  "tipo-proyecto": TipoProyectoStep,
  "datos-generales": DatosGeneralesStep,
  ambientes: SeleccionAmbientesStep,
  oficina: OficinaStep,
  roles: RolesStep,
  estilo: PlaceholderStep,
  duelo: PlaceholderStep,
  "mobiliario-galeria": PlaceholderStep,
  paleta: PlaceholderStep,
  materiales: PlaceholderStep,
  "detalle-ambientes": PlaceholderStep,
  "mobiliario-existente": MobiliarioExistenteStep,
  presupuesto: PresupuestoStep,
  plazos: PlazosStep,
  cierre: CierreStep,
  resumen: ResumenStep,
};

type SaveStatus = "idle" | "saving" | "saved";

export function EntrevistaWizard({
  entrevistaId,
  contactoId,
  contactoNombre,
  initialData,
}: {
  entrevistaId: string;
  contactoId: string;
  contactoNombre: string;
  initialData: EntrevistaState;
}) {
  const [state, setState] = useState<EntrevistaState>(initialData);
  const [current, setCurrent] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [, startTransition] = useTransition();

  const isFirstRender = useRef(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = getSteps(state.proyecto.tipoProyecto);

  useEffect(() => {
    if (current > steps.length - 1) setCurrent(steps.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      startTransition(() => {
        saveEntrevista(entrevistaId, state).then(() => setSaveStatus("saved"));
      });
    }, 1200);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const safeCurrent = Math.min(current, steps.length - 1);
  const step = steps[safeCurrent];
  const StepComponent = STEP_COMPONENTS[step.id];
  const isFirstStep = safeCurrent === 0;
  const isLastStep = safeCurrent === steps.length - 1;
  const nextDisabled = step.id === "tipo-proyecto" && !state.proyecto.tipoProyecto;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-1">
        <Link href={`/contactos/${contactoId}`} className="text-sm text-neutral-500 hover:underline">
          ← {contactoNombre}
        </Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Ficha de entrevista</h1>
        <span className="text-xs text-neutral-400">
          {saveStatus === "saving" ? "Guardando…" : saveStatus === "saved" ? "Guardado ✓" : ""}
        </span>
      </div>

      <div className="mb-2 flex gap-1">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrent(i)}
            title={s.label}
            className={`h-1.5 flex-1 rounded-full transition ${i <= safeCurrent ? "bg-neutral-900" : "bg-neutral-200"}`}
          />
        ))}
      </div>
      <div className="mb-6 flex justify-between font-mono text-[10px] uppercase tracking-wide text-neutral-400">
        <span>{steps[0].label}</span>
        <span className="font-semibold text-neutral-900">{step.label}</span>
        <span>{steps[steps.length - 1].label}</span>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <StepComponent state={state} setState={setState} onAdvance={() => setCurrent((c) => Math.min(c + 1, steps.length - 1))} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          disabled={isFirstStep}
          onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
          className="rounded-full border border-neutral-900 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-900 transition hover:opacity-80 disabled:opacity-25"
        >
          ← Anterior
        </button>
        <span className="font-mono text-xs text-neutral-400">
          {safeCurrent + 1} / {steps.length}
        </span>
        <button
          type="button"
          disabled={isLastStep || nextDisabled}
          onClick={() => setCurrent((c) => Math.min(c + 1, steps.length - 1))}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition hover:opacity-80 disabled:opacity-25"
        >
          Siguiente →
        </button>
      </div>
    </main>
  );
}
