// src/app/visita/plano/HojaTecho.tsx
"use client";

import {
  agregarBandeja,
  agregarMoldura,
  agregarZonaTecho,
  bandejasDe,
  borrarElemento,
  cargarMedidaElemento,
  MOLDURA_POR_DEFECTO_TECHO,
  zonaDeAmbiente,
} from "@/lib/plano/elementos";
import type { Nivel } from "@/lib/plano/modelo";
import { cargarAlturaGeneral } from "@/lib/plano/operaciones";
import type { Seleccion } from "@/lib/plano/toque";
import { CampoMedida } from "./CampoMedida";
import { Accion, Acciones, Grupo, Hoja } from "./Hoja";

/**
 * El techo de un ambiente, medido como se mide en el lugar: primero la altura
 * libre hasta la losa, después a qué altura está el cielo falso, y encima de eso
 * las bandejas, cada una con su margen desde la pared y su propia altura. Antes
 * había que adivinar qué herramienta hacía cada cosa; acá está todo junto.
 */
export function HojaTecho({
  nivel,
  ambienteId,
  onNivel,
  onSeleccion,
  onCerrar,
}: {
  nivel: Nivel;
  ambienteId: string;
  onNivel: (cambio: (n: Nivel) => Nivel) => void;
  onSeleccion: (s: Seleccion | null) => void;
  onCerrar: () => void;
}) {
  const ambiente = nivel.ambientes.find((a) => a.id === ambienteId)!;
  const zona = zonaDeAmbiente(nivel, ambienteId);
  const bandejas = zona ? bandejasDe(nivel, zona.id) : [];
  const moldura = nivel.molduras.find((m) => m.ambienteId === ambienteId);

  /** Cargar la altura del cielo falso lo crea si todavía no estaba. */
  function cieloFalso(cm: number | null) {
    if (cm === null) return;
    onNivel((n) => {
      const ya = zonaDeAmbiente(n, ambienteId);
      if (ya) return cargarMedidaElemento(n, "techo", ya.id, "altura", cm);
      return agregarZonaTecho(n, { ambienteId, tipo: "cielo-falso", altura: cm }).nivel;
    });
  }

  return (
    <Hoja titulo={`Techo · ${ambiente.nombre}`} estado={zona ? `${bandejas.length + 1} nivel${bandejas.length ? "es" : ""}` : "Sin cielo falso"} onCerrar={onCerrar}>
      <CampoMedida
        id="techo-general"
        etiqueta="Altura libre · del piso a la losa"
        valor={nivel.alturaGeneral.tomada ? nivel.alturaGeneral.valor : null}
        dibujado={nivel.alturaGeneral.valor}
        onCambio={(cm) => cm !== null && cm > 0 && onNivel((n) => cargarAlturaGeneral(n, cm))}
      />
      <CampoMedida
        id="techo-cielo"
        etiqueta="Cielo falso · altura desde el piso"
        valor={zona?.altura.tomada ? zona.altura.valor : null}
        dibujado={zona?.altura.valor ?? nivel.alturaGeneral.valor}
        onCambio={cieloFalso}
      />

      {zona && (
        <Grupo etiqueta={bandejas.length === 0 ? "Bandejas · los escalones de adentro" : "Bandejas"}>
          <div className="grid gap-1">
            {bandejas.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSeleccion({ tipo: "techo", id: b.id })}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-3 py-2.5 text-left"
              >
                <span className="text-[15px] font-light text-neutral-100">
                  {`Bandeja ${i + 1} · margen ${b.margen?.valor ?? "—"} · altura ${b.altura.valor}`}
                </span>
                <span className="rotulo shrink-0 text-neutral-500">Ir</span>
              </button>
            ))}
          </div>
        </Grupo>
      )}

      <Acciones>
        {zona && (
          <Accion
            onClick={() => {
              const ultima = bandejas[bandejas.length - 1] ?? zona;
              onNivel((n) => agregarBandeja(n, ultima.id)?.nivel ?? n);
            }}
          >
            {bandejas.length === 0 ? "Agregar bandeja" : "Otra bandeja adentro"}
          </Accion>
        )}
        {moldura ? (
          <Accion
            peligro
            onClick={() => onNivel((n) => borrarElemento(n, "moldura", moldura.id))}
          >
            Sacar la moldura
          </Accion>
        ) : (
          <Accion onClick={() => onNivel((n) => agregarMoldura(n, { ambienteId, ...MOLDURA_POR_DEFECTO_TECHO }).nivel)}>
            Moldura en todo el borde
          </Accion>
        )}
        {zona && (
          <Accion
            peligro
            onClick={() => {
              onNivel((n) => [zona.id, ...bandejasDe(n, zona.id).map((b) => b.id)].reduce((x, id) => borrarElemento(x, "techo", id), n));
              onSeleccion(null);
            }}
          >
            Sacar el cielo falso
          </Accion>
        )}
      </Acciones>
    </Hoja>
  );
}
