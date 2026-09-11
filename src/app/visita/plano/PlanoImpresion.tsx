// src/app/visita/plano/PlanoImpresion.tsx
"use client";

import { useState, type CSSProperties } from "react";
import { compartirArchivo, descargarArchivo } from "@/lib/plano/archivo";
import { revisarNivel } from "@/lib/plano/controles";
import { textoSuperficie } from "@/lib/plano/dibujo";
import { hastaEsquina } from "@/lib/plano/elementos";
import type { Medida, Nivel, Relevamiento } from "@/lib/plano/modelo";
import { resolverNivel } from "@/lib/plano/resolver";
import { perimetro } from "@/lib/plano/superficie";
import { ambienteDeCara } from "@/lib/plano/toque";
import { cajaDeNivel } from "@/lib/plano/vista";
import { DibujoPlanta } from "./DibujoPlanta";
import { NOMBRE_TECHO } from "./DibujoTecho";
import { NOMBRE_ABERTURA, NOMBRE_APERTURA } from "./HojaAbertura";

/** Papel claro de la marca con tinta grafito: lo que se imprime o se guarda en PDF. */
const PAPEL = { "--plano-tinta": "#0F1113", "--plano-fondo": "#F2F1EE", "--plano-gris": "#7C8286" } as CSSProperties;

const m = (x: Medida | null) => (x ? `${x.tomada ? "" : "≈ "}${x.valor}` : "—");
const fecha = (iso: string) => iso.split("-").reverse().join("/");

function Tabla({ titulo, columnas, filas }: { titulo: string; columnas: string[]; filas: string[][] }) {
  if (filas.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="rotulo mb-2 text-[#0F1113]/60">{titulo}</h3>
      <div className="overflow-x-auto">
        <table className="dato w-full text-left">
          <thead>
            <tr className="border-b border-[#0F1113]/25">
              {columnas.map((c) => (
                <th key={c} className="py-1.5 pr-3 font-medium whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i} className="border-b border-[#0F1113]/10">
                {f.map((celda, j) => (
                  <td key={j} className="py-1.5 pr-3 whitespace-nowrap">{celda}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NivelImpreso({ nivel }: { nivel: Nivel }) {
  const caja = cajaDeNivel(nivel);
  const margen = 70;
  const ancho = caja.maxX - caja.minX + 2 * margen;
  const alto = caja.maxY - caja.minY + 2 * margen;
  const nombreAmbiente = (id: string | null) => nivel.ambientes.find((a) => a.id === id)?.nombre ?? "—";
  const controles = revisarNivel(nivel).filter((c) => c.tipo !== "pendiente");

  return (
    <section className="mb-12 break-inside-avoid">
      <h2 className="font-display text-2xl font-light">{nivel.nombre}</h2>
      <p className="dato mt-1 text-[#0F1113]/60">
        Cota de piso {nivel.cotaPiso} · altura general {m(nivel.alturaGeneral)}
      </p>
      {nivel.muros.length > 0 && (
        <svg viewBox={`${caja.minX - margen} ${caja.minY - margen} ${ancho} ${alto}`} className="my-5 max-h-[70vh] w-full" role="img" aria-label={`Planta de ${nivel.nombre}`}>
          <DibujoPlanta nivel={nivel} escala={620 / ancho} seleccion={null} cierres={resolverNivel(nivel).cierres} trazo={null} impresion />
        </svg>
      )}
      <Tabla
        titulo="Ambientes"
        columnas={["Ambiente", "Superficie", "Perímetro", "Desnivel"]}
        filas={nivel.ambientes.map((a) => [a.nombre, textoSuperficie(nivel, a.id), `${Math.round(perimetro(nivel, a.id))} cm`, String(a.desnivelPiso)])}
      />
      <Tabla
        titulo="Cuadro de aberturas"
        columnas={["Código", "Tipo", "Ambiente", "Ancho", "Alto", "Antepecho", "Desde", "Hasta", "Apertura"]}
        filas={nivel.aberturas.map((a) => [
          a.codigo,
          NOMBRE_ABERTURA[a.tipo],
          nombreAmbiente(ambienteDeCara(nivel, a.muroId, a.cara)),
          m(a.ancho),
          m(a.alto),
          m(a.antepecho),
          m(a.desde),
          String(hastaEsquina(nivel, a)).replace(".", ","),
          a.apertura ? NOMBRE_APERTURA[a.apertura] : "—",
        ])}
      />
      <Tabla
        titulo="Cuadro de techos"
        columnas={["Ambiente", "Elemento", "Medidas"]}
        filas={[
          ...nivel.techos.map((t) => [nombreAmbiente(t.ambienteId), NOMBRE_TECHO[t.tipo], `altura ${m(t.altura)}`]),
          ...nivel.molduras.map((x) => [nombreAmbiente(x.ambienteId), "Moldura", `${m(x.ancho)} × ${m(x.caida)}`]),
          ...nivel.vigas.map((v) => ["—", "Viga", `${m(v.ancho)} × ${m(v.peralte)}`]),
        ]}
      />
      {controles.length > 0 && (
        <ul className="mt-6 grid gap-1 text-sm">
          {controles.map((c, i) => (
            <li key={i} className={c.tipo === "error" ? "text-danger-700" : "text-[#0F1113]/70"}>
              {c.tipo === "error" ? "Error · " : "Revisar · "}
              {c.mensaje}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PlanoImpresion({ relevamiento: r, onVolver }: { relevamiento: Relevamiento; onVolver: () => void }) {
  const [aviso, setAviso] = useState("");
  const boton = "rotulo rounded-full border border-[#0F1113]/25 px-4 py-2.5";
  return (
    <div className="min-h-dvh bg-[#F2F1EE] text-[#0F1113]" style={PAPEL}>
      <div className="sticky top-0 z-10 flex flex-wrap gap-2 bg-[#F2F1EE] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 print:hidden">
        <button type="button" onClick={onVolver} className={boton}>← Volver</button>
        <button type="button" onClick={() => window.print()} className="rotulo rounded-full bg-[#0F1113] px-4 py-2.5 text-[#F2F1EE]">Imprimir</button>
        <button type="button" onClick={() => descargarArchivo(r)} className={boton}>Descargar archivo para Revit</button>
        <button
          type="button"
          onClick={async () => setAviso((await compartirArchivo(r)) ? "" : "Compartir no está disponible acá: usá Descargar.")}
          className={boton}
        >
          Compartir
        </button>
        {aviso && <p className="w-full text-sm text-[#0F1113]/70">{aviso}</p>}
      </div>
      <article className="mx-auto max-w-3xl px-4 pt-4 pb-12">
        <header className="mb-8 border-b border-[#0F1113]/20 pb-4">
          <p className="rotulo">Bruno Aldana · Arquitectura</p>
          <h1 className="font-display mt-2 text-3xl font-extralight tracking-[-0.03em]">Relevamiento · {r.proyecto.nombre}</h1>
          <p className="dato mt-1 text-[#0F1113]/60">
            {[r.proyecto.direccion, fecha(r.proyecto.fechaRelevamiento)].filter(Boolean).join(" · ")} · centímetros · ≈ dibujado, sin medir
          </p>
        </header>
        {r.niveles.map((n) => (
          <NivelImpreso key={n.id} nivel={n} />
        ))}
      </article>
    </div>
  );
}
