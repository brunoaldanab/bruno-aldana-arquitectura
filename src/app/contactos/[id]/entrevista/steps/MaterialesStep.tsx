"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { materialCards } from "@/lib/entrevista/data";
import type { EntrevistaState } from "@/lib/entrevista/types";
import { images } from "@/lib/images";
import { inputClass } from "@/components/ui/field";

const materialPhotos: Record<string, string> = {
  "Madera clara": images.materials.maderaClara,
  "Madera oscura": images.materials.maderaOscura,
  "Mármol / cuarzo claro": images.materials.marmol,
  "Piedra oscura": images.materials.piedraOscura,
  "Metal negro mate": images.materials.metalNegro,
  "Latón / dorado": images.materials.laton,
  "Cemento alisado": images.materials.cemento,
  "Textil / lino natural": images.materials.lino,
};

export function MaterialesStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const reduceMotion = useReducedMotion();

  function toggle(n: string) {
    setState((s) => {
      const has = s.materiales.seleccion.includes(n);
      return {
        ...s,
        materiales: {
          ...s.materiales,
          seleccion: has ? s.materiales.seleccion.filter((x) => x !== n) : [...s.materiales.seleccion, n],
        },
      };
    });
  }

  const elegidos = state.materiales.seleccion.length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-display mb-2 text-4xl leading-[1.05] font-extralight tracking-[-0.03em] text-neutral-100">Materiales</h2>
          <p className="text-sm text-neutral-500">
            Tocá los que le gusten al cliente. La textura es la que decide — mostrala grande.
          </p>
        </div>
        {elegidos > 0 && (
          <span className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white">
            {elegidos} elegido{elegidos > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Las texturas ocupan el espacio: son la pregunta, no una miniatura al lado del texto. */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {materialCards.map((m, i) => {
          const selected = state.materiales.seleccion.includes(m.n);
          const photo = materialPhotos[m.n];
          return (
            <motion.button
              key={m.n}
              type="button"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(12px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ duration: 0.24, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => toggle(m.n)}
              className={`group relative aspect-[4/5] overflow-hidden rounded-2xl text-left transition-[box-shadow] duration-200 ${
                selected ? "shadow-[0_0_0_3px_var(--color-neutral-900)]" : "shadow-[0_0_0_1px_var(--color-neutral-200)]"
              }`}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt={m.n}
                  className={`h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    selected ? "scale-105" : "scale-100"
                  }`}
                />
              ) : (
                <div className="h-full w-full" style={{ background: m.css }} />
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

              <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-medium text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
                {m.n}
              </span>

              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.35, bounce: 0.25 }}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-medium text-neutral-100 shadow-lg"
                  >
                    ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium tracking-wide text-neutral-500 uppercase">
          Notas de materiales (pisos, cocina, baños)
        </span>
        <textarea
          rows={3}
          value={state.materiales.notas}
          onChange={(e) => setState((s) => ({ ...s, materiales: { ...s.materiales, notas: e.target.value } }))}
          className={inputClass}
        />
      </label>
    </div>
  );
}
