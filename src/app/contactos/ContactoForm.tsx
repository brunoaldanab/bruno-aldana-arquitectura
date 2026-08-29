"use client";

import { useActionState } from "react";
import type { ContactoFormState } from "./actions";
import { inputClass, labelClass, errorClass } from "@/components/ui/field";
import { Button } from "@/components/ui/Button";

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

export function ContactoForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className="animate-rise-in space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft"
    >
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

        {state?.error && <p className={errorClass}>{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
    </form>
  );
}
