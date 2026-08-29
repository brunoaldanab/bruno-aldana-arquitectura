"use client";

import { motion, useReducedMotion } from "motion/react";
import { SALIDA } from "@/lib/movimiento";
import { tiposProyecto } from "@/lib/entrevista/data";
import type { EntrevistaState, TipoProyecto } from "@/lib/entrevista/types";
import {
  IconAmbiente,
  IconConstruccion,
  IconOficina,
  IconVivienda,
} from "@/components/ui/icons";

/** Cada tipo de proyecto tiene su dibujo; el trazo lo anima quien lo usa. */
function IconoTipo({ tipo, className }: { tipo: TipoProyecto; className?: string }) {
  if (tipo === "oficina") return <IconOficina className={className} />;
  if (tipo === "ambiente-unico") return <IconAmbiente className={className} />;
  if (tipo === "construccion") return <IconConstruccion className={className} />;
  return <IconVivienda className={className} />;
}

export function TipoProyectoStep({
  state,
  setState,
  onAdvance,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
  onAdvance?: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-extralight tracking-[-0.03em] text-neutral-100">
        ¿Qué vamos a diseñar hoy?
      </h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">
        Esto define todo el resto de la entrevista — solo vas a ver preguntas relevantes para este tipo de
        proyecto, sin pasos de más.
      </p>

      {/* La primera decisión de la entrevista merece piezas grandes, no cuatro
          cajitas: se elige una vez, con el cliente mirando. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tiposProyecto.map((t, i) => {
          const elegido = state.proyecto.tipoProyecto === t.k;
          return (
            <motion.button
              key={t.k}
              type="button"
              disabled={t.disabled}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(10px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ duration: 0.24, delay: i * 0.05, ease: SALIDA }}
              onClick={() => {
                setState((s) => ({ ...s, proyecto: { ...s.proyecto, tipoProyecto: t.k } }));
                onAdvance?.();
              }}
              className={`opcion-grande relative overflow-hidden rounded-2xl p-6 text-left ${
                elegido ? "opcion-grande-activa" : ""
              } ${t.disabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              {t.disabled && (
                <span className="absolute top-4 right-4 rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-medium text-neutral-500">
                  Próximamente
                </span>
              )}
              {/* El ícono se dibuja solo al aparecer: es el trazo de un plano
                  tomando forma, no un glifo tipográfico plantado ahí. Va en CSS
                  porque una animación predeterminada corre fuera del hilo
                  principal y no pierde cuadros mientras la página carga. */}
              <div
                className={`icono-trazo mb-6 transition-colors duration-200 ${
                  elegido ? "text-white" : "text-neutral-500"
                }`}
                style={{ animationDelay: `${150 + i * 80}ms` }}
              >
                <IconoTipo tipo={t.k} className="h-8 w-8" />
              </div>
              <div className={`text-lg font-medium ${elegido ? "text-white" : "text-neutral-100"}`}>{t.t}</div>
              <div className={`mt-1 text-sm ${elegido ? "text-white/70" : "text-neutral-500"}`}>{t.d}</div>
            </motion.button>
          );
        })}
      </div>

      {!state.proyecto.tipoProyecto && (
        <p className="mt-6 text-sm text-neutral-500">Elegí una opción para continuar.</p>
      )}
    </div>
  );
}
