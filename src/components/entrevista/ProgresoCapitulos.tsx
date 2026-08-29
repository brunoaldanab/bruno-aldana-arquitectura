"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { StepDef } from "@/lib/entrevista/steps";
import { RESORTE, SALIDA } from "@/lib/movimiento";

/**
 * Progreso de la entrevista como capítulos, no como 16 círculos numerados.
 *
 * Dos razones para el cambio: dieciséis círculos con números no dicen en qué
 * parte de la conversación estás, y a esa cantidad ya no entran sin apretarse.
 * Acá cada paso es un segmento; el actual se ensancha y muestra su nombre.
 *
 * Además la barra es un control: se puede arrastrar el dedo a lo largo para
 * recorrer los pasos, que es más rápido que apuntarle a un círculo de 32px.
 */
export function ProgresoCapitulos({
  steps,
  actual,
  onIr,
}: {
  steps: StepDef[];
  actual: number;
  onIr: (index: number) => void;
}) {
  const pista = useRef<HTMLDivElement>(null);
  const arrastrando = useRef(false);
  const reduceMotion = useReducedMotion();

  /** Traduce una posición horizontal a un índice de paso. */
  function pasoEn(clientX: number) {
    const caja = pista.current?.getBoundingClientRect();
    if (!caja) return actual;
    const proporcion = (clientX - caja.left) / caja.width;
    return Math.max(0, Math.min(steps.length - 1, Math.floor(proporcion * steps.length)));
  }

  return (
    <div className="select-none">
      <div
        ref={pista}
        // El recorrido es continuo: se sigue el dedo mientras se arrastra, no
        // solo al soltar. Sin eso el control se siente muerto a mitad de camino.
        onPointerDown={(e) => {
          arrastrando.current = true;
          // La captura mantiene el seguimiento aunque el puntero se salga de la
          // pista; si el navegador la rechaza, el arrastre igual tiene que andar.
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* seguimos sin captura */
          }
          onIr(pasoEn(e.clientX));
        }}
        onPointerMove={(e) => {
          if (!arrastrando.current) return;
          const destino = pasoEn(e.clientX);
          if (destino !== actual) onIr(destino);
        }}
        onPointerUp={(e) => {
          arrastrando.current = false;
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch {
            /* no había captura */
          }
        }}
        onPointerCancel={() => {
          arrastrando.current = false;
        }}
        className="flex cursor-grab touch-none items-end gap-[3px] py-2 active:cursor-grabbing"
        role="group"
        aria-label="Progreso de la entrevista"
      >
        {steps.map((s, i) => {
          const hecho = i < actual;
          const esActual = i === actual;
          return (
            <motion.div
              key={s.id}
              // La caja mide 10px siempre y la escala hace la diferencia. Animar
              // `height` obligaría a recalcular el layout en cada cuadro, por 16
              // segmentos y encima durante el arrastre, que es justo cuando un
              // cuadro perdido se nota.
              animate={{
                transform: `scaleY(${esActual ? 1 : 0.4})`,
                opacity: esActual ? 1 : hecho ? 0.85 : 0.28,
              }}
              transition={reduceMotion ? { duration: 0.12 } : RESORTE}
              style={{ flex: esActual ? 2.2 : 1, height: 10, transformOrigin: "bottom" }}
              className="rounded-full bg-neutral-100"
            />
          );
        })}
      </div>

      <div className="flex items-baseline gap-2 overflow-hidden">
        <span className="shrink-0 font-mono text-[11px] text-neutral-400">
          {String(actual + 1).padStart(2, "0")}/{String(steps.length).padStart(2, "0")}
        </span>
        <motion.span
          key={steps[actual]?.id}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.2, ease: SALIDA }}
          className="truncate text-[11px] font-medium tracking-wide text-neutral-400 uppercase"
        >
          {steps[actual]?.label}
        </motion.span>
      </div>
    </div>
  );
}
