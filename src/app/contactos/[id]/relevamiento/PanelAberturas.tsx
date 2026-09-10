// src/app/contactos/[id]/relevamiento/PanelAberturas.tsx
"use client";

import { inputClass, labelClass } from "@/components/ui/field";
import type { Ambiente, Elemento } from "@/lib/relevamiento/formato";
import { datosFaltantes } from "@/lib/relevamiento/controles";
import { CampoMedida } from "./CampoMedida";

const APERTURAS: [NonNullable<Elemento["apertura"]>, string][] = [
  ["corrediza", "Corrediza"],
  ["batiente", "Batiente"],
  ["pivotante", "Pivotante"],
  ["fija", "Fija"],
];

function Selector<T extends string>({ id, etiqueta, valor, opciones, onCambio }: {
  id: string;
  etiqueta: string;
  valor: T | null | undefined;
  opciones: [T, string][];
  onCambio: (v: T | null) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{etiqueta}</label>
      <select id={id} value={valor ?? ""} onChange={(e) => onCambio((e.target.value || null) as T | null)} className={inputClass}>
        <option value="">Elegir</option>
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}

export function PanelAberturas({ ambiente: a, onCambio, codigoSiguiente }: {
  ambiente: Ambiente;
  onCambio: (a: Ambiente) => void;
  codigoSiguiente: (tipo: "puerta" | "ventana") => string;
}) {
  const aberturas = a.elementos.filter((e) => e.tipo === "puerta" || e.tipo === "ventana");
  const paredes: [string, string][] = a.paredes.map((p, i) => [p.id, `Pared ${i + 1}${p.largo !== null ? ` · ${p.largo} cm` : ""}`]);

  function agregar(tipo: "puerta" | "ventana") {
    const nuevo: Elemento = {
      id: crypto.randomUUID(),
      codigo: codigoSiguiente(tipo),
      tipo,
      pared: a.paredes[0]?.id,
      desde: null,
      hasta: null,
      alto: null,
      ...(tipo === "ventana" ? { antepecho: null } : {}),
      espesorMuro: null,
      apertura: null,
    };
    onCambio({ ...a, elementos: [...a.elementos, nuevo] });
  }

  function cambiar(id: string, patch: Partial<Elemento>) {
    onCambio({ ...a, elementos: a.elementos.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }

  function quitar(id: string) {
    onCambio({ ...a, elementos: a.elementos.filter((e) => e.id !== id) });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button type="button" onClick={() => agregar("puerta")} className="rounded-full bg-white/[0.07] px-4 py-2 text-sm text-neutral-200 hover:bg-white/[0.12]">Agregar puerta</button>
        <button type="button" onClick={() => agregar("ventana")} className="rounded-full bg-white/[0.07] px-4 py-2 text-sm text-neutral-200 hover:bg-white/[0.12]">Agregar ventana</button>
      </div>

      {aberturas.length === 0 && <p className="text-sm text-neutral-500">Todavía no hay puertas ni ventanas en este ambiente.</p>}

      {aberturas.map((e) => {
        const faltan = datosFaltantes(e);
        const k = (campo: string) => `${a.id}-${e.id}-${campo}`;
        return (
          <div key={e.id} className="space-y-4 rounded-2xl border border-white/8 bg-neutral-900 p-5">
            <div className="flex items-center justify-between">
              <p className="dato text-neutral-100">{e.codigo} · {e.tipo === "puerta" ? "Puerta" : "Ventana"}</p>
              <button type="button" onClick={() => quitar(e.id)} className="text-sm text-danger-600 hover:underline">Quitar</button>
            </div>
            <Selector id={k("pared")} etiqueta="En qué pared" valor={e.pared} opciones={paredes} onCambio={(v) => cambiar(e.id, { pared: v ?? undefined })} />
            <CampoMedida key={k("desde")} id={k("desde")} etiqueta="Empieza a (desde la esquina)" valor={e.desde ?? null} onCambio={(cm) => cambiar(e.id, { desde: cm })} />
            <CampoMedida key={k("hasta")} id={k("hasta")} etiqueta="Termina a (desde la esquina)" valor={e.hasta ?? null} onCambio={(cm) => cambiar(e.id, { hasta: cm })} />
            <CampoMedida key={k("alto")} id={k("alto")} etiqueta="Alto del vano" valor={e.alto ?? null} onCambio={(cm) => cambiar(e.id, { alto: cm })} />
            {e.tipo === "ventana" && (
              <CampoMedida key={k("antepecho")} id={k("antepecho")} etiqueta="Antepecho (del piso al borde inferior)" valor={e.antepecho ?? null} onCambio={(cm) => cambiar(e.id, { antepecho: cm })} />
            )}
            <CampoMedida key={k("muro")} id={k("muro")} etiqueta="Espesor de muro" valor={e.espesorMuro ?? null} onCambio={(cm) => cambiar(e.id, { espesorMuro: cm })} />
            <Selector id={k("apertura")} etiqueta="Tipo de apertura" valor={e.apertura} opciones={APERTURAS} onCambio={(v) => cambiar(e.id, { apertura: v })} />
            {e.tipo === "puerta" && (e.apertura === "batiente" || e.apertura === "pivotante") && (
              <>
                <Selector id={k("abre")} etiqueta="Hacia dónde abre" valor={e.abreHacia} opciones={[["adentro", "Hacia adentro"], ["afuera", "Hacia afuera"]]} onCambio={(v) => cambiar(e.id, { abreHacia: v })} />
                <Selector id={k("bisagra")} etiqueta="Bisagra" valor={e.bisagra} opciones={[["inicio", "Del lado donde empieza"], ["fin", "Del lado donde termina"]]} onCambio={(v) => cambiar(e.id, { bisagra: v })} />
              </>
            )}
            {faltan.length > 0 && <p className="text-sm text-danger-600">Falta: {faltan.join(", ")}</p>}
          </div>
        );
      })}
    </div>
  );
}
