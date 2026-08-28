"use client";

import { useActionState } from "react";
import type { CotizacionFormState } from "./actions";

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

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";
const labelClass = "mb-1 block text-sm font-medium text-neutral-700";

export function CotizacionForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
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
            className={inputClass}
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

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
