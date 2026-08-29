"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { StepDef } from "@/lib/entrevista/steps";
import { HOJA, SALIDA } from "@/lib/movimiento";

/**
 * Salto rápido entre pasos.
 *
 * Reemplaza a la fila de círculos numerados: con dieciséis pasos, buscar el que
 * uno quiere apuntándole a un círculo de 32px es peor que escribir tres letras.
 * Se abre con ⌘K (o Ctrl+K) y se cierra con Escape.
 *
 * El panel se monta recién cuando se abre — así su estado (búsqueda vacía,
 * resaltado en el paso actual) nace correcto y no hace falta un efecto que lo
 * reinicie después de renderizar.
 */
export function NavegadorPasos({
  abierto,
  steps,
  actual,
  onIr,
  onCerrar,
}: {
  abierto: boolean;
  steps: StepDef[];
  actual: number;
  onIr: (index: number) => void;
  onCerrar: () => void;
}) {
  return (
    <AnimatePresence>
      {abierto && (
        <PanelPasos steps={steps} actual={actual} onIr={onIr} onCerrar={onCerrar} />
      )}
    </AnimatePresence>
  );
}

function PanelPasos({
  steps,
  actual,
  onIr,
  onCerrar,
}: {
  steps: StepDef[];
  actual: number;
  onIr: (index: number) => void;
  onCerrar: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [resaltado, setResaltado] = useState(actual);
  const campo = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  const filtrados = steps
    .map((s, i) => ({ ...s, indice: i }))
    .filter((s) => s.label.toLowerCase().includes(busqueda.trim().toLowerCase()));

  // Enfocar el campo es sincronizar con el DOM, que es justamente para lo que
  // sirve un efecto — acá no se toca estado de React.
  useEffect(() => {
    const t = setTimeout(() => campo.current?.focus(), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCerrar();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setResaltado((r) => {
          const posicion = filtrados.findIndex((f) => f.indice === r);
          const siguiente = e.key === "ArrowDown" ? posicion + 1 : posicion - 1;
          const acotado = Math.max(0, Math.min(filtrados.length - 1, siguiente));
          return filtrados[acotado]?.indice ?? r;
        });
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const elegido = filtrados.find((f) => f.indice === resaltado) ?? filtrados[0];
        if (elegido) {
          onIr(elegido.indice);
          onCerrar();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtrados, resaltado, onIr, onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      {/* Atenúa el fondo: esto es una tarea modal, corta el flujo a propósito */}
      <motion.button
        type="button"
        aria-label="Cerrar navegador de pasos"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: SALIDA }}
        onClick={onCerrar}
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
      />

      {/* Baja un poco y se abre desde 0.98, nunca desde cero: nada en el mundo
          real aparece de la nada, y una ventana que crece desde un punto se lee
          como un truco. El desenfoque que tenía se sacó por la regla del manual
          —solo opacidad y transform—; el material translúcido del fondo
          (`backdrop-blur`) se queda, porque ese es fijo y no se anima. */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Ir a un paso"
        initial={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, transform: "translateY(-8px) scale(0.98)" }
        }
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
        exit={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, transform: "translateY(-6px) scale(0.99)" }
        }
        transition={reduceMotion ? { duration: 0.15 } : HOJA}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-neutral-900/90 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10 backdrop-blur-2xl backdrop-saturate-150"
      >
        <div className="flex items-center gap-2 border-b border-neutral-100/8 px-4">
          <span className="text-neutral-600">↳</span>
          <input
            ref={campo}
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              const primero = steps.findIndex((s) =>
                s.label.toLowerCase().includes(e.target.value.trim().toLowerCase())
              );
              if (primero >= 0) setResaltado(primero);
            }}
            placeholder="Ir a un paso…"
            className="w-full bg-transparent py-3.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
          />
          <kbd className="shrink-0 rounded border border-neutral-100/10 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">
            esc
          </kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-1.5">
          {filtrados.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">Ningún paso con ese nombre.</p>
          )}
          {filtrados.map((s) => {
            const esActual = s.indice === actual;
            const estaResaltado = s.indice === resaltado;
            return (
              <button
                key={s.id}
                type="button"
                onPointerEnter={() => setResaltado(s.indice)}
                onClick={() => {
                  onIr(s.indice);
                  onCerrar();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100 ${
                  estaResaltado ? "bg-white/6" : ""
                }`}
              >
                <span className="w-6 shrink-0 font-mono text-[11px] text-neutral-600">
                  {String(s.indice + 1).padStart(2, "0")}
                </span>
                <span
                  className={`flex-1 truncate text-sm ${
                    esActual ? "font-medium text-neutral-100" : "text-neutral-300"
                  }`}
                >
                  {s.label}
                </span>
                {esActual && <span className="shrink-0 text-[10px] text-neutral-600">acá estás</span>}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
