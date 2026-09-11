// src/app/visita/IndicadorSync.tsx
import { TEXTO_ESTADO, type EstadoSync } from "@/lib/visita/sincronizador";

/** Con la sesión vencida el estado es un enlace al login que vuelve a la visita. Nada se anima. */
export function IndicadorSync({ estado }: { estado: EstadoSync | null }) {
  if (estado === null) return null;
  if (estado === "sin-sesion") {
    return (
      <a href="/login?volver=/visita" className="dato text-right text-neutral-100 underline underline-offset-4">
        {TEXTO_ESTADO[estado]}
      </a>
    );
  }
  return (
    <p className="dato text-right text-neutral-400" aria-live="polite">
      {TEXTO_ESTADO[estado]}
    </p>
  );
}
