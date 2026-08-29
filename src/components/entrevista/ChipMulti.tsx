"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Elegir varias opciones a la vez.
 *
 * Igual que `ChipSingle`, pero cada opción elegida gana una marca que entra con
 * un resorte corto. La marca no es decorativa: en una lista larga de ambientes
 * elegidos, el relleno solo obliga a comparar tonos, y el ✓ se cuenta de un
 * vistazo.
 */
export function ChipMulti({
  options,
  values,
  onToggle,
  small,
  labelFor,
}: {
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
  small?: boolean;
  labelFor?: (value: string) => string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const activo = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            aria-pressed={activo}
            className={`chip inline-flex items-center gap-1.5 ${
              small ? "px-3.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
            } ${activo ? "chip-activo" : ""}`}
          >
            <AnimatePresence initial={false}>
              {activo && (
                <motion.span
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, width: 0 }}
                  transition={
                    reduceMotion ? { duration: 0.12 } : { type: "spring", bounce: 0.25, duration: 0.32 }
                  }
                  className="overflow-hidden text-[0.85em]"
                >
                  ✓
                </motion.span>
              )}
            </AnimatePresence>
            {labelFor ? labelFor(o) : o}
          </button>
        );
      })}
    </div>
  );
}
