// src/app/visita/plano/BarraPlano.tsx
import type { Modo } from "@/lib/plano/herramientas";
import type { EstadoSync } from "@/lib/visita/sincronizador";
import { IndicadorSync } from "../IndicadorSync";
import { Segmentado } from "./Segmentado";

export function BarraPlano({
  nombre,
  estado,
  modo,
  onModo,
  niveles,
  nivelId,
  onNivel,
  onNuevoNivel,
  aviso,
  onVolver,
  onImprimir,
}: {
  nombre: string;
  estado: EstadoSync | null;
  modo: Modo;
  onModo: (m: Modo) => void;
  niveles: { id: string; nombre: string }[];
  nivelId: string;
  onNivel: (id: string) => void;
  onNuevoNivel: () => void;
  aviso: { texto: string; error: boolean };
  onVolver: () => void;
  onImprimir: () => void;
}) {
  return (
    <header className="grid gap-2.5 border-b border-white/10 px-4 pt-[max(0.9rem,env(safe-area-inset-top))] pb-2.5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onVolver} className="min-w-0 truncate text-[13px] text-neutral-100">
          ← {nombre}
        </button>
        <IndicadorSync estado={estado} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmentado
          etiqueta="Vista"
          opciones={[{ valor: "planta", texto: "Planta" }, { valor: "techo", texto: "Techo" }]}
          valor={modo}
          onCambio={onModo}
        />
        <select
          aria-label="Nivel"
          value={nivelId}
          onChange={(e) => (e.target.value === "+" ? onNuevoNivel() : onNivel(e.target.value))}
          className="rotulo rounded-full bg-white/[0.07] px-3 py-2 text-neutral-100 outline-none"
        >
          {niveles.map((n) => (
            <option key={n.id} value={n.id}>{n.nombre}</option>
          ))}
          <option value="+">+ Nivel</option>
        </select>
        <span
          aria-live="polite"
          className={`rotulo rounded-full border border-dashed px-2.5 py-1.5 ${aviso.error ? "border-danger-600/60 text-danger-600" : "border-neutral-500 text-neutral-100"}`}
        >
          {aviso.texto}
        </span>
        <button type="button" onClick={onImprimir} className="rotulo ml-auto rounded-full bg-white/[0.07] px-3 py-2 text-neutral-100">
          Plano
        </button>
      </div>
    </header>
  );
}
