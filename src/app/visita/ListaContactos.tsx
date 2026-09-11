// src/app/visita/ListaContactos.tsx
import { Button } from "@/components/ui/Button";
import type { ContactoLocal } from "@/lib/visita/contactos";

export function ListaContactos({ contactos, onAbrir, onNuevo }: {
  contactos: ContactoLocal[];
  onAbrir: (id: string) => void;
  onNuevo: () => void;
}) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="rotulo text-neutral-500">Visita · {String(contactos.length).padStart(2, "0")} en cartera</span>
          <h1 className="font-display text-4xl font-extralight tracking-[-0.03em] text-neutral-100">Contactos</h1>
        </div>
        <Button size="sm" onClick={onNuevo}>Nuevo cliente</Button>
      </div>

      {contactos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/12 px-6 py-10 text-center text-sm text-neutral-500">
          Todavía no hay contactos en el teléfono. Con señal bajan solos; sin señal podés crear uno y se sube después.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-white/8 bg-neutral-900">
          {contactos.map((c, i) => (
            <li key={c.id} className={i > 0 ? "border-t border-white/8" : ""}>
              <button
                type="button"
                onClick={() => onAbrir(c.id)}
                className="flex w-full items-baseline justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-white/[0.04]"
              >
                <span className="text-neutral-100">{c.nombre}</span>
                <span className="dato shrink-0 text-neutral-500">{c.pendiente ? "Sin subir" : (c.telefono ?? "")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
