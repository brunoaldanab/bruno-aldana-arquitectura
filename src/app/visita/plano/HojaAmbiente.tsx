// src/app/visita/plano/HojaAmbiente.tsx
import { textoSuperficie } from "@/lib/plano/dibujo";
import type { Nivel } from "@/lib/plano/modelo";
import { cambiarDesnivel, cargarAlturaGeneral, renombrarAmbiente } from "@/lib/plano/operaciones";
import { perimetro } from "@/lib/plano/superficie";
import { CampoMedida } from "./CampoMedida";
import { claseTexto, Dato, Dos, Hoja } from "./Hoja";

export function HojaAmbiente({
  nivel,
  ambienteId,
  onNivel,
  onCerrar,
}: {
  nivel: Nivel;
  ambienteId: string;
  onNivel: (cambio: (n: Nivel) => Nivel) => void;
  onCerrar: () => void;
}) {
  const a = nivel.ambientes.find((x) => x.id === ambienteId)!;
  const superficie = textoSuperficie(nivel, a.id);
  return (
    <Hoja titulo={a.nombre} estado={superficie} onCerrar={onCerrar}>
      <label className="grid gap-1.5">
        <span className="rotulo text-neutral-500">Nombre</span>
        <input
          key={`${a.id}:${a.nombre}`}
          defaultValue={a.nombre}
          autoComplete="off"
          onBlur={(e) => {
            const nombre = e.target.value.trim();
            if (nombre && nombre !== a.nombre) onNivel((n) => renombrarAmbiente(n, a.id, nombre));
          }}
          className={claseTexto}
        />
      </label>
      <Dos>
        <Dato etiqueta="Superficie">{superficie}</Dato>
        <Dato etiqueta="Perímetro">{Math.round(perimetro(nivel, a.id))} cm</Dato>
      </Dos>
      <Dos>
        <CampoMedida
          id="nivel-altura"
          etiqueta="Altura general"
          valor={nivel.alturaGeneral.tomada ? nivel.alturaGeneral.valor : null}
          dibujado={nivel.alturaGeneral.valor}
          onCambio={(cm) => cm !== null && onNivel((n) => cargarAlturaGeneral(n, cm))}
        />
        <label className="grid min-w-0 gap-1.5">
          <span className="rotulo text-neutral-500">Desnivel de piso</span>
          <input
            key={`${a.id}:${a.desnivelPiso}`}
            defaultValue={a.desnivelPiso}
            inputMode="numeric"
            autoComplete="off"
            onBlur={(e) => {
              const cm = Number(e.target.value.replace(",", "."));
              if (Number.isFinite(cm) && Math.round(cm) !== a.desnivelPiso) onNivel((n) => cambiarDesnivel(n, a.id, cm));
            }}
            className={`${claseTexto} font-mono tabular-nums`}
          />
        </label>
      </Dos>
    </Hoja>
  );
}
