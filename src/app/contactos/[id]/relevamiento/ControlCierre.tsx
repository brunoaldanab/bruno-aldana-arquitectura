// src/app/contactos/[id]/relevamiento/ControlCierre.tsx
import { Badge } from "@/components/ui/Badge";
import type { Hallazgo } from "@/lib/relevamiento/controles";

const TONO = { error: "danger", aviso: "info", ok: "success" } as const;
const ETIQUETA = { error: "Error", aviso: "Aviso", ok: "Cierra" } as const;
const ORDEN = { error: 0, aviso: 1, ok: 2 } as const;

export function ControlCierre({ hallazgos, nombres }: { hallazgos: Hallazgo[]; nombres: Record<string, string> }) {
  const ordenados = [...hallazgos].sort((x, y) => ORDEN[x.nivel] - ORDEN[y.nivel]);
  return (
    <ul className="space-y-2">
      {ordenados.map((h, i) => (
        <li key={i} className="flex items-start gap-3">
          <Badge tone={TONO[h.nivel]}>{ETIQUETA[h.nivel]}</Badge>
          <p className="pt-1 text-sm text-neutral-200">
            <span className="text-neutral-500">{nombres[h.ambienteId] ?? h.ambienteId} · </span>
            {h.mensaje}
          </p>
        </li>
      ))}
    </ul>
  );
}
