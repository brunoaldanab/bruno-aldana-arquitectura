// src/app/visita/FichaContacto.tsx
import { Button } from "@/components/ui/Button";
import { labelClass } from "@/components/ui/field";
import type { ContactoLocal } from "@/lib/visita/contactos";

export function FichaContacto({ contacto: c, onEditar, onVolver }: {
  contacto: ContactoLocal;
  onEditar: () => void;
  onVolver: () => void;
}) {
  const datos: [string, string | null][] = [
    ["Teléfono", c.telefono],
    ["Email", c.email],
    ["Dirección del proyecto", c.direccionProyecto],
    ["Origen", c.origen],
    ["Notas", c.notas],
  ];

  return (
    <section className="flex flex-col gap-8">
      <button type="button" onClick={onVolver} className="rotulo self-start text-neutral-500 transition-colors duration-150 hover:text-neutral-200">
        ← Contactos
      </button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-extralight tracking-[-0.03em] text-neutral-100">{c.nombre}</h1>
        <Button size="sm" variant="secondary" onClick={onEditar}>Editar</Button>
      </div>
      {c.pendiente && <p className="dato text-neutral-400">Con cambios sin subir</p>}
      <dl className="grid gap-5 rounded-2xl border border-white/8 bg-neutral-900 p-6">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt className={labelClass}>{etiqueta}</dt>
            <dd className={valor ? "whitespace-pre-line text-neutral-100" : "text-neutral-600"}>{valor ?? "Sin cargar"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
