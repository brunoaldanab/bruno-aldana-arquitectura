// src/app/visita/FormularioContacto.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { errorClass, inputClass, labelClass } from "@/components/ui/field";
import { leerFormularioContacto, type CamposContacto, type ContactoVisita } from "@/lib/visita/contactos";

export function FormularioContacto({ contacto, titulo, etiquetaGuardar, onGuardar, onCancelar }: {
  contacto?: ContactoVisita;
  titulo: string;
  etiquetaGuardar: string;
  onGuardar: (c: ContactoVisita) => Promise<void>;
  onCancelar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // El id nace en el teléfono: un cliente creado sin señal ya tiene su identidad definitiva.
  const [base] = useState(() =>
    contacto ? { id: contacto.id, createdAt: contacto.createdAt } : { id: crypto.randomUUID(), createdAt: new Date().toISOString() },
  );

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const leer = (campo: keyof CamposContacto) => String(datos.get(campo) ?? "");
    const r = leerFormularioContacto(
      { nombre: leer("nombre"), telefono: leer("telefono"), email: leer("email"), direccionProyecto: leer("direccionProyecto"), notas: leer("notas"), origen: leer("origen") },
      base,
      new Date().toISOString(),
    );
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await onGuardar(r.contacto);
    } catch {
      setError("No se pudo guardar en el teléfono. Probá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <section className="flex flex-col gap-8">
      <h1 className="font-display text-4xl font-extralight tracking-[-0.03em] text-neutral-100">{titulo}</h1>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <div>
          <label htmlFor="visita-nombre" className={labelClass}>Nombre *</label>
          <input id="visita-nombre" name="nombre" type="text" autoComplete="off" defaultValue={contacto?.nombre ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-telefono" className={labelClass}>Teléfono</label>
          <input id="visita-telefono" name="telefono" type="tel" inputMode="tel" defaultValue={contacto?.telefono ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-email" className={labelClass}>Email</label>
          <input id="visita-email" name="email" type="email" inputMode="email" defaultValue={contacto?.email ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-direccion" className={labelClass}>Dirección del proyecto</label>
          <input id="visita-direccion" name="direccionProyecto" type="text" defaultValue={contacto?.direccionProyecto ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-origen" className={labelClass}>Origen</label>
          <input id="visita-origen" name="origen" type="text" placeholder="Instagram, referido, web…" defaultValue={contacto?.origen ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="visita-notas" className={labelClass}>Notas</label>
          <textarea id="visita-notas" name="notas" rows={4} defaultValue={contacto?.notas ?? ""} className={inputClass} />
        </div>
        {error && <p className={errorClass}>{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : etiquetaGuardar}</Button>
          <Button type="button" variant="ghost" onClick={onCancelar}>Cancelar</Button>
        </div>
      </form>
    </section>
  );
}
