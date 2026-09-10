// src/app/contactos/[id]/relevamiento/PanelParedes.tsx
"use client";

import { useState } from "react";
import { labelClass } from "@/components/ui/field";
import type { Ambiente, Giro, Pared } from "@/lib/relevamiento/formato";
import { CAMPOS_FORMA, errorDeCierre, formaAParedes, type TipoForma } from "@/lib/relevamiento/geometria";
import { CampoMedida } from "./CampoMedida";

const NOMBRE_FORMA: Record<TipoForma, string> = { rectangulo: "Rectángulo", L: "L", U: "U" };
const NOMBRE_ALTURA = { puerta: "Altura junto a la puerta", centro: "Altura al centro", opuesta: "Altura en la esquina opuesta" };

/** Las dos diagonales entre esquinas opuestas que pide el protocolo. Vértices numerados desde 0. */
export function diagonalesDelProtocolo(cantidadParedes: number): { desdeVertice: number; hastaVertice: number }[] {
  if (cantidadParedes < 4) return [];
  const mitad = Math.floor(cantidadParedes / 2);
  return [
    { desdeVertice: 0, hastaVertice: mitad },
    { desdeVertice: 1, hastaVertice: 1 + mitad },
  ];
}

function conDiagonales(a: Ambiente, paredes: Pared[]): Ambiente {
  const diagonales = diagonalesDelProtocolo(paredes.length).map((d) => ({
    ...d,
    medida: a.diagonales.find((x) => x.desdeVertice === d.desdeVertice && x.hastaVertice === d.hastaVertice)?.medida ?? null,
  }));
  return { ...a, paredes, diagonales };
}

const opcion = (activo: boolean) =>
  `rounded-full px-4 py-2 text-sm transition-[background-color,color] duration-150 ${activo ? "bg-neutral-100 text-neutral-950" : "bg-white/[0.07] text-neutral-300 hover:bg-white/[0.12]"}`;

export function PanelParedes({ ambiente: a, onCambio }: { ambiente: Ambiente; onCambio: (a: Ambiente) => void }) {
  const [confirmarForma, setConfirmarForma] = useState(false);
  const tipo: TipoForma = a.forma?.tipo ?? "rectangulo";
  const medidas = a.forma?.medidas ?? {};
  const cierre = errorDeCierre(a.paredes);

  function aplicarForma(nuevoTipo: TipoForma, nuevasMedidas: Record<string, number | null>) {
    const paredes = formaAParedes(nuevoTipo, nuevasMedidas);
    onCambio(conDiagonales({ ...a, metodo: "forma", forma: { tipo: nuevoTipo, medidas: nuevasMedidas } }, paredes));
  }

  function aRecorrido() {
    const paredes = a.paredes.length > 0 ? a.paredes : [{ id: "pared-1", largo: null, giro: "D" as Giro }];
    onCambio(conDiagonales({ ...a, metodo: "recorrido", forma: undefined }, paredes));
  }

  function aForma() {
    if (a.metodo === "recorrido" && a.paredes.some((p) => p.largo !== null) && !confirmarForma) {
      setConfirmarForma(true);
      return;
    }
    setConfirmarForma(false);
    aplicarForma("rectangulo", {});
  }

  function cambiarPared(i: number, patch: Partial<Pared>) {
    const paredes = a.paredes.map((p, j) => (j === i ? { ...p, ...patch } : p));
    onCambio(conDiagonales(a, paredes));
  }

  function agregarPared() {
    const paredes = [...a.paredes, { id: `pared-${a.paredes.length + 1}`, largo: null, giro: "D" as Giro }];
    onCambio(conDiagonales(a, paredes));
  }

  function quitarUltima() {
    const id = a.paredes[a.paredes.length - 1]?.id;
    const paredes = a.paredes.slice(0, -1);
    onCambio(conDiagonales({ ...a, elementos: a.elementos.filter((e) => e.pared !== id) }, paredes));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={opcion(a.metodo === "forma")} onClick={aForma}>Forma rápida</button>
        <button type="button" className={opcion(a.metodo === "recorrido")} onClick={aRecorrido}>Recorrido</button>
      </div>
      {confirmarForma && (
        <p className="text-sm text-neutral-300">
          Pasar a forma rápida borra el recorrido cargado.{" "}
          <button type="button" className="underline" onClick={aForma}>Tocá acá para confirmar</button>
        </p>
      )}

      {a.metodo === "forma" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(Object.keys(CAMPOS_FORMA) as TipoForma[]).map((t) => (
              <button key={t} type="button" className={opcion(t === tipo)} onClick={() => aplicarForma(t, {})}>
                {NOMBRE_FORMA[t]}
              </button>
            ))}
          </div>
          {CAMPOS_FORMA[tipo].map((c) => (
            <CampoMedida
              key={`${a.id}-${tipo}-${c.clave}`}
              id={`${a.id}-${c.clave}`}
              etiqueta={c.etiqueta}
              valor={medidas[c.clave] ?? null}
              onCambio={(cm) => aplicarForma(tipo, { ...medidas, [c.clave]: cm })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="dato text-neutral-400">
            {cierre === null ? "Faltan paredes por medir" : cierre === 0 ? "El recorrido cierra" : `Faltan ${cierre} cm para cerrar`}
          </p>
          {a.paredes.map((p, i) => (
            <div key={`${a.id}-${p.id}`} className="flex items-end gap-3">
              <div className="flex-1">
                <CampoMedida id={`${a.id}-${p.id}`} etiqueta={`Pared ${i + 1}`} valor={p.largo} onCambio={(cm) => cambiarPared(i, { largo: cm })} />
              </div>
              <div>
                <span className={labelClass}>Giro</span>
                <div className="flex gap-1">
                  <button type="button" className={opcion(p.giro === "I")} onClick={() => cambiarPared(i, { giro: "I" })}>Izq.</button>
                  <button type="button" className={opcion(p.giro === "D")} onClick={() => cambiarPared(i, { giro: "D" })}>Der.</button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className={opcion(false)} onClick={agregarPared}>Agregar pared</button>
            {a.paredes.length > 1 && <button type="button" className={opcion(false)} onClick={quitarUltima}>Quitar la última</button>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {a.alturas.map((h, i) => (
          <CampoMedida
            key={`${a.id}-altura-${h.punto}`}
            id={`${a.id}-altura-${h.punto}`}
            etiqueta={NOMBRE_ALTURA[h.punto]}
            valor={h.medida}
            onCambio={(cm) => onCambio({ ...a, alturas: a.alturas.map((x, j) => (j === i ? { ...x, medida: cm } : x)) })}
          />
        ))}
      </div>

      {a.diagonales.length > 0 && (
        <div className="space-y-4">
          {a.diagonales.map((d, i) => (
            <CampoMedida
              key={`${a.id}-diag-${d.desdeVertice}-${d.hastaVertice}`}
              id={`${a.id}-diag-${i}`}
              etiqueta={`Diagonal de la esquina ${d.desdeVertice + 1} a la ${d.hastaVertice + 1}`}
              valor={d.medida}
              onCambio={(cm) => onCambio({ ...a, diagonales: a.diagonales.map((x, j) => (j === i ? { ...x, medida: cm } : x)) })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
