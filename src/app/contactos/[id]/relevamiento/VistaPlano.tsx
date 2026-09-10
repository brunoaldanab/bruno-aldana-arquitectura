// src/app/contactos/[id]/relevamiento/VistaPlano.tsx
"use client";

import type { Relevamiento } from "@/lib/relevamiento/formato";
import { perimetroCm, superficieM2 } from "@/lib/relevamiento/geometria";
import { PlanoSvg } from "./PlanoSvg";

const APERTURA = { corrediza: "Corrediza", batiente: "Batiente", pivotante: "Pivotante", fija: "Fija" } as const;
const COLUMNAS = ["Código", "Pared", "Empieza", "Termina", "Alto", "Antepecho", "Muro", "Apertura"];

export function VistaPlano({ relevamiento: r, onVolver }: { relevamiento: Relevamiento; onVolver: () => void }) {
  const ambientes = r.niveles.flatMap((n) => n.ambientes);
  return (
    <div className="min-h-screen bg-[#F2F1EE] text-[#0F1113] print:bg-white">
      <div className="flex gap-2 p-4 print:hidden">
        <button type="button" onClick={() => window.print()} className="rounded-full bg-[#0F1113] px-5 py-2.5 text-sm text-[#F2F1EE]">
          Imprimir o guardar PDF
        </button>
        <button type="button" onClick={onVolver} className="rounded-full px-5 py-2.5 text-sm underline">
          Volver
        </button>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-8">
        <header className="mb-8 border-b border-[#0F1113]/20 pb-4">
          <p className="rotulo">Bruno Aldana · Arquitectura</p>
          <h1 className="font-display mt-2 text-3xl font-extralight">Relevamiento · {r.proyecto.nombre}</h1>
          <p className="dato mt-1 text-[#0F1113]/60">
            {[r.proyecto.direccion, r.proyecto.fechaRelevamiento].filter(Boolean).join(" · ")} · medidas en centímetros
          </p>
        </header>

        {ambientes.map((a) => {
          const superficie = superficieM2(a.paredes);
          const perimetro = perimetroCm(a.paredes);
          const alturas = a.alturas.filter((h) => h.medida !== null).map((h) => h.medida);
          const aberturas = a.elementos.filter((e) => e.tipo === "puerta" || e.tipo === "ventana");
          return (
            <section key={a.id} className="mb-12 break-inside-avoid">
              <h2 className="font-display text-2xl font-light">{a.nombre}</h2>
              <p className="dato mt-1 text-[#0F1113]/60">
                {superficie !== null ? `${superficie.toLocaleString("es-BO", { maximumFractionDigits: 2 })} m²` : "Sin cerrar"}
                {perimetro !== null ? ` · perímetro ${perimetro}` : ""}
                {alturas.length > 0 ? ` · altura ${alturas.join(" / ")}` : ""}
              </p>
              <div className="my-4">
                <PlanoSvg ambiente={a} impresion />
              </div>
              {aberturas.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="dato w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#0F1113]/20">
                        {COLUMNAS.map((c) => <th key={c} className="py-1 pr-3 font-normal">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {aberturas.map((e) => (
                        <tr key={e.id} className="border-b border-[#0F1113]/10">
                          <td className="py-1 pr-3">{e.codigo}</td>
                          <td className="py-1 pr-3">{a.paredes.findIndex((p) => p.id === e.pared) + 1 || "—"}</td>
                          <td className="py-1 pr-3">{e.desde ?? "—"}</td>
                          <td className="py-1 pr-3">{e.hasta ?? "—"}</td>
                          <td className="py-1 pr-3">{e.alto ?? "—"}</td>
                          <td className="py-1 pr-3">{e.antepecho ?? "—"}</td>
                          <td className="py-1 pr-3">{e.espesorMuro ?? "—"}</td>
                          <td className="py-1 pr-3">{e.apertura ? APERTURA[e.apertura] : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </article>
    </div>
  );
}
