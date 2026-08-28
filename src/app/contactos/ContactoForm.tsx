"use client";

import { useActionState } from "react";
import type { ContactoFormState } from "./actions";

type ContactoDefaultValues = {
  nombre?: string;
  telefono?: string;
  email?: string;
  direccionProyecto?: string;
  notas?: string;
  origen?: string;
};

type Props = {
  action: (state: ContactoFormState, formData: FormData) => Promise<ContactoFormState>;
  defaultValues?: ContactoDefaultValues;
  submitLabel: string;
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";
const labelClass = "mb-1 block text-sm font-medium text-neutral-700";

export function ContactoForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
      <label className="block">
        <span className={labelClass}>Nombre *</span>
        <input type="text" name="nombre" required defaultValue={defaultValues?.nombre} className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Teléfono</span>
        <input type="text" name="telefono" defaultValue={defaultValues?.telefono} className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Email</span>
        <input type="email" name="email" defaultValue={defaultValues?.email} className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Dirección del proyecto</span>
        <input
          type="text"
          name="direccionProyecto"
          defaultValue={defaultValues?.direccionProyecto}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Origen</span>
        <input
          type="text"
          name="origen"
          placeholder="Instagram, referido, web..."
          defaultValue={defaultValues?.origen}
          className={inputClass}
        />
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
