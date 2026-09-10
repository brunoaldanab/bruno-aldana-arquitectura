// src/app/contactos/[id]/relevamiento/RelevamientoApp.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/field";
import { crearAmbiente, crearRelevamientoVacio, type Ambiente, type Relevamiento } from "@/lib/relevamiento/formato";
import { controlarAmbiente, controlarRelevamiento } from "@/lib/relevamiento/controles";
import { perimetroCm, superficieM2 } from "@/lib/relevamiento/geometria";
import { decidirAlAbrir, type CopiaRemota } from "@/lib/relevamiento/sincronizacion";
import { leerLocal, pedirPersistencia } from "@/lib/relevamiento/almacen";
import { crearSincronizador, type EstadoSync } from "./sincronizador";
import { PlanoSvg } from "./PlanoSvg";
import { PanelParedes } from "./PanelParedes";
import { PanelAberturas } from "./PanelAberturas";
import { ControlCierre } from "./ControlCierre";
import { descargarJson } from "@/lib/relevamiento/descarga";
import { VistaPlano } from "./VistaPlano";

const TEXTO_SYNC: Record<EstadoSync, string> = {
  cargando: "Abriendo…",
  local: "Guardado en el teléfono · falta subir",
  subiendo: "Subiendo…",
  subido: "Todo subido",
  "sin-senal": "Sin señal · guardado en el teléfono",
  conflicto: "Subido · reemplazó una versión más nueva del servidor",
};

type Pestana = "paredes" | "aberturas" | "control";

const opcion = (activo: boolean) =>
  `rounded-full px-4 py-2 text-sm transition-[background-color,color] duration-150 ${activo ? "bg-neutral-100 text-neutral-950" : "bg-white/[0.07] text-neutral-300 hover:bg-white/[0.12]"}`;

export function RelevamientoApp({ contactoId, nombre, direccion, ambientesEntrevista, remoto }: {
  contactoId: string;
  nombre: string;
  direccion: string;
  ambientesEntrevista: string[];
  remoto: CopiaRemota | null;
}) {
  const [rel, setRel] = useState<Relevamiento | null>(null);
  const [sync, setSync] = useState<EstadoSync>("cargando");
  const [sinc] = useState(() => crearSincronizador(contactoId, setRel, setSync));
  const [elegido, setElegido] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>("paredes");
  const [nuevoAmbiente, setNuevoAmbiente] = useState("");
  const [vista, setVista] = useState<"editar" | "plano">("editar");

  useEffect(() => {
    let vigente = true;
    void pedirPersistencia();
    leerLocal(contactoId)
      .catch(() => null)
      .then((local) => {
        if (!vigente) return;
        const d = decidirAlAbrir(local, remoto);
        if (d.accion === "crear") {
          const fecha = new Date().toISOString().slice(0, 10);
          sinc.iniciar(crearRelevamientoVacio({ contactoId, nombre, direccion, ambientes: ambientesEntrevista, fecha }), 0, true);
        } else if (d.accion === "usar-remoto" && remoto) {
          sinc.iniciar(remoto.data, remoto.version, false);
        } else if (local) {
          sinc.iniciar(local.data, local.versionBase, local.pendiente);
        }
      });
    const alVolverLaSenal = () => sinc.reintentar();
    window.addEventListener("online", alVolverLaSenal);
    return () => {
      vigente = false;
      window.removeEventListener("online", alVolverLaSenal);
    };
  }, [contactoId, nombre, direccion, ambientesEntrevista, remoto, sinc]);

  if (!rel) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-sm text-neutral-500">Abriendo el relevamiento…</p>
      </main>
    );
  }

  const actual = rel;
  if (vista === "plano") return <VistaPlano relevamiento={actual} onVolver={() => setVista("editar")} />;
  const nivel = actual.niveles[0];
  const ambiente = nivel.ambientes.find((a) => a.id === elegido) ?? nivel.ambientes[0];
  const nombres = Object.fromEntries(nivel.ambientes.map((a) => [a.id, a.nombre]));
  const todos = controlarRelevamiento(actual);
  const errores = todos.filter((h) => h.nivel === "error").length;
  const superficie = superficieM2(ambiente.paredes);
  const perimetro = perimetroCm(ambiente.paredes);

  function cambiarAmbiente(a: Ambiente) {
    sinc.cambiar({
      ...actual,
      niveles: actual.niveles.map((n, i) => (i === 0 ? { ...n, ambientes: n.ambientes.map((x) => (x.id === a.id ? a : x)) } : n)),
    });
  }

  function agregarAmbiente() {
    const n = nuevoAmbiente.trim();
    if (!n) return;
    const id = `amb-${crypto.randomUUID().slice(0, 8)}`;
    sinc.cambiar({
      ...actual,
      niveles: actual.niveles.map((nv, i) => (i === 0 ? { ...nv, ambientes: [...nv.ambientes, crearAmbiente(id, n)] } : nv)),
    });
    setElegido(id);
    setNuevoAmbiente("");
  }

  /** P1, P2… y V1, V2… numerados en todo el relevamiento, para que en Revit no haya dos P1. */
  function codigoSiguiente(tipo: "puerta" | "ventana") {
    const letra = tipo === "puerta" ? "P" : "V";
    const patron = new RegExp(`^${letra}(\\d+)$`);
    const usados = actual.niveles
      .flatMap((nv) => nv.ambientes.flatMap((a) => a.elementos))
      .map((e) => Number(patron.exec(e.codigo)?.[1] ?? 0));
    return `${letra}${Math.max(0, ...usados) + 1}`;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href={`/contactos/${contactoId}`} className="rotulo text-neutral-500 transition-colors duration-150 hover:text-neutral-200">
        ← {nombre}
      </Link>

      <div className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-extralight tracking-[-0.03em] text-neutral-100">Relevamiento</h1>
        <p className="dato text-neutral-400" aria-live="polite">{TEXTO_SYNC[sync]}</p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {nivel.ambientes.map((a) => (
          <button key={a.id} type="button" className={opcion(a.id === ambiente.id)} onClick={() => setElegido(a.id)}>
            {a.nombre}
          </button>
        ))}
      </div>
      <div className="mb-8 flex gap-2">
        <input
          value={nuevoAmbiente}
          onChange={(e) => setNuevoAmbiente(e.target.value)}
          placeholder="Nombre de otro ambiente"
          aria-label="Nombre del ambiente nuevo"
          className={inputClass}
        />
        <button type="button" className={opcion(false)} onClick={agregarAmbiente}>Agregar</button>
      </div>

      <Card className="p-4">
        <PlanoSvg ambiente={ambiente} />
      </Card>
      <p className="dato mt-3 text-neutral-400">
        {superficie !== null ? `${superficie.toLocaleString("es-BO", { maximumFractionDigits: 2 })} m²` : "La superficie aparece cuando el ambiente cierra"}
        {perimetro !== null ? ` · perímetro ${perimetro} cm` : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={opcion(false)} onClick={() => setVista("plano")}>Ver plano para imprimir</button>
        <button type="button" className={opcion(false)} onClick={() => descargarJson(actual)}>Descargar archivo para Revit</button>
      </div>

      <div className="mt-8 mb-6 flex flex-wrap gap-2">
        <button type="button" className={opcion(pestana === "paredes")} onClick={() => setPestana("paredes")}>Paredes</button>
        <button type="button" className={opcion(pestana === "aberturas")} onClick={() => setPestana("aberturas")}>Puertas y ventanas</button>
        <button type="button" className={opcion(pestana === "control")} onClick={() => setPestana("control")}>
          Terminar visita{errores > 0 ? ` · ${errores} ${errores === 1 ? "error" : "errores"}` : ""}
        </button>
      </div>

      {pestana === "paredes" && <PanelParedes key={ambiente.id} ambiente={ambiente} onCambio={cambiarAmbiente} />}
      {pestana === "aberturas" && (
        <PanelAberturas key={ambiente.id} ambiente={ambiente} onCambio={cambiarAmbiente} codigoSiguiente={codigoSiguiente} />
      )}
      {pestana === "control" && <ControlCierre hallazgos={todos} nombres={nombres} />}
      {pestana !== "control" && (
        <div className="mt-10">
          <ControlCierre hallazgos={controlarAmbiente(ambiente)} nombres={nombres} />
        </div>
      )}
    </main>
  );
}
