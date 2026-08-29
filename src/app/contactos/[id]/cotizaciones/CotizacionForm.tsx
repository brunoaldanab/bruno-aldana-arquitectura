"use client";

import { useActionState } from "react";
import type { CotizacionFormState } from "./actions";
import { inputClass, labelClass, errorClass } from "@/components/ui/field";
import { Button } from "@/components/ui/Button";

type CotizacionDefaultValues = {
  titulo?: string;
  montoTotal?: string;
  moneda?: "BOB" | "USD";
  estado?: "BORRADOR" | "ENVIADA" | "APROBADA" | "RECHAZADA";
  notas?: string;
};

type Props = {
  action: (state: CotizacionFormState, formData: FormData) => Promise<CotizacionFormState>;
  defaultValues?: CotizacionDefaultValues;
  submitLabel: string;
};

export function CotizacionForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="animate-rise-in space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
      <label className="block">
        <span className={labelClass}>Título *</span>
        <input type="text" name="titulo" required defaultValue={defaultValues?.titulo} className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className={labelClass}>Monto total</span>
          <input
            type="text"
            name="montoTotal"
            inputMode="decimal"
            placeholder="Opcional"
            defaultValue={defaultValues?.montoTotal}
            className={`${inputClass} tabular-nums`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Moneda</span>
          <select name="moneda" defaultValue={defaultValues?.moneda ?? "BOB"} className={inputClass}>
            <option value="BOB">BOB</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Estado</span>
        <select name="estado" defaultValue={defaultValues?.estado ?? "BORRADOR"} className={inputClass}>
          <option value="BORRADOR">Borrador</option>
          <option value="ENVIADA">Enviada</option>
          <option value="APROBADA">Aprobada</option>
          <option value="RECHAZADA">Rechazada</option>
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>Notas</span>
        <textarea name="notas" rows={4} defaultValue={defaultValues?.notas} className={inputClass} />
      </label>

      {state?.error && <p className={errorClass}>{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
