"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { inputClass } from "@/components/ui/field";
import { colorSwatches, officePaletteCombos, paletteDefs } from "@/lib/entrevista/data";
import type { EntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import { imageFileToDataUrl } from "@/lib/entrevista/imageToDataUrl";
import {
  addPaletaOficinaCustom,
  addPaletaOficinaFoto,
  removePaletaOficinaCustom,
  removePaletaOficinaFoto,
  setPaletaOficinaCustomColor,
} from "../galeriaActions";

type SetState = React.Dispatch<React.SetStateAction<EntrevistaState>>;
type SetGaleria = React.Dispatch<React.SetStateAction<GaleriaData>>;

export function PaletaStep({
  state,
  setState,
  galeria,
  setGaleria,
}: {
  state: EntrevistaState;
  setState: SetState;
  galeria: GaleriaData;
  setGaleria: SetGaleria;
}) {
  if (state.proyecto.tipoProyecto === "oficina") {
    return <PaletaOficina state={state} setState={setState} galeria={galeria} setGaleria={setGaleria} />;
  }
  return <PaletaGeneral state={state} setState={setState} />;
}

function ColorPickerRow({ onAdd }: { onAdd: (hex: string) => void }) {
  const [hex, setHex] = useState("#5B4CFF");
  return (
    <div className="mb-4 flex items-center gap-3">
      <input
        type="color"
        value={hex}
        onChange={(e) => setHex(e.target.value)}
        className="h-9 w-14 cursor-pointer rounded border border-neutral-300 p-1"
      />
      <span className="font-mono text-xs text-neutral-500">{hex.toUpperCase()}</span>
      <button
        type="button"
        onClick={() => onAdd(hex.toUpperCase())}
        className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
      >
        + Agregar este color
      </button>
    </div>
  );
}

function SwatchGrid({
  swatches,
  selected,
  onToggle,
}: {
  swatches: { n: string; h: string }[];
  selected: string[];
  onToggle: (n: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {swatches.map((c) => {
        const activo = selected.includes(c.n);
        return (
          <button
            key={c.n}
            type="button"
            onClick={() => onToggle(c.n)}
            className="text-center transition-transform duration-150 active:scale-95"
          >
            <div
              className={`relative aspect-square w-full overflow-hidden rounded-xl transition-[box-shadow] duration-200 ${
                activo
                  ? "shadow-[0_0_0_3px_var(--color-neutral-900)]"
                  : "shadow-[0_0_0_1px_rgba(0,0,0,0.1)] hover:shadow-[0_0_0_2px_var(--color-neutral-400)]"
              }`}
              style={{ background: c.h }}
            >
              {activo && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-neutral-900 shadow">
                  ✓
                </span>
              )}
            </div>
            <div className="mt-1.5 truncate text-[11px] text-neutral-600">{c.n}</div>
          </button>
        );
      })}
    </div>
  );
}

function PaletaGeneral({ state, setState }: { state: EntrevistaState; setState: SetState }) {
  const reduceMotion = useReducedMotion();
  const p = state.paleta;
  const allSwatches = [...colorSwatches, ...p.customColores];

  function toggleSeleccion(key: string) {
    setState((s) => {
      const has = s.paleta.seleccion.includes(key);
      return { ...s, paleta: { ...s.paleta, seleccion: has ? s.paleta.seleccion.filter((x) => x !== key) : [...s.paleta.seleccion, key] } };
    });
  }
  function toggleBase(n: string) {
    setState((s) => {
      const has = s.paleta.base.includes(n);
      return { ...s, paleta: { ...s.paleta, base: has ? s.paleta.base.filter((x) => x !== n) : [...s.paleta.base, n] } };
    });
  }
  function toggleEvitar(n: string) {
    setState((s) => {
      const has = s.paleta.evitar.includes(n);
      return { ...s, paleta: { ...s.paleta, evitar: has ? s.paleta.evitar.filter((x) => x !== n) : [...s.paleta.evitar, n] } };
    });
  }
  function addColor(hex: string) {
    setState((s) =>
      s.paleta.customColores.some((c) => c.h.toUpperCase() === hex)
        ? s
        : { ...s, paleta: { ...s.paleta, customColores: [...s.paleta.customColores, { n: hex, h: hex }] } }
    );
  }

  return (
    <div>
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-light tracking-[-0.02em] text-neutral-900">Paleta de color — y qué transmite</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">
        Esta es la decisión que más define cómo se va a sentir el espacio, más allá del estilo. Mostrale al cliente estas 8
        direcciones —cada una con su lectura psicológica— y dejalo reaccionar en vivo. Pueden elegir una o combinar dos.
      </p>

      {/* Cada paleta es una franja de color grande: el color se juzga por su
          superficie, no por un cuadradito de 24px al lado del texto. */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {paletteDefs.map((pd, i) => {
          const selected = p.seleccion.includes(pd.key);
          return (
            <motion.button
              key={pd.key}
              type="button"
              onClick={() => toggleSeleccion(pd.key)}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(12px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ duration: 0.24, delay: i * 0.045, ease: [0.23, 1, 0.32, 1] }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              className={`overflow-hidden rounded-2xl bg-white text-left transition-[box-shadow] duration-200 ${
                selected
                  ? "shadow-[0_0_0_3px_var(--color-neutral-900)]"
                  : "shadow-[0_0_0_1px_var(--color-neutral-200)] hover:shadow-[0_0_0_2px_var(--color-neutral-400)]"
              }`}
            >
              {/* La franja: los colores a tamaño real, sin bordes que los separen */}
              <div className="relative flex h-32 w-full">
                {pd.colores.map((c) => (
                  <div key={c.n} title={c.n} className="h-full flex-1" style={{ background: c.h }} />
                ))}
                {selected && (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.35, bounce: 0.25 }}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-neutral-900 shadow-lg"
                  >
                    ✓
                  </motion.span>
                )}
              </div>

              <div className="p-4">
                <span className="mb-1 block font-medium text-neutral-900">{pd.nombre}</span>
                <p
                  className="text-xs leading-relaxed text-neutral-500"
                  dangerouslySetInnerHTML={{ __html: pd.psicologia }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <label className="mb-6 block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Tono general</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">Frío</span>
          <input
            type="range"
            min={1}
            max={10}
            value={p.calidoFrio}
            onChange={(e) => setState((s) => ({ ...s, paleta: { ...s.paleta, calidoFrio: Number(e.target.value) } }))}
            className="flex-1 accent-accent-500"
          />
          <span className="text-xs text-neutral-500">Cálido</span>
        </div>
      </label>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Ajuste fino — colores puntuales que les gustan además de la paleta elegida
      </p>
      <ColorPickerRow onAdd={addColor} />
      <SwatchGrid swatches={allSwatches} selected={p.base} onToggle={toggleBase} />

      <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-neutral-500">Colores a evitar por completo</p>
      <SwatchGrid swatches={allSwatches} selected={p.evitar} onToggle={toggleEvitar} />

      <label className="mt-6 block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Notas sobre color</span>
        <textarea
          rows={3}
          value={p.notas}
          onChange={(e) => setState((s) => ({ ...s, paleta: { ...s.paleta, notas: e.target.value } }))}
          placeholder="Ej: quieren base clásica pero con el dormitorio principal más dramático..."
          className={inputClass}
        />
      </label>
    </div>
  );
}

function PaletaOficina({
  state,
  setState,
  galeria,
  setGaleria,
}: {
  state: EntrevistaState;
  setState: SetState;
  galeria: GaleriaData;
  setGaleria: SetGaleria;
}) {
  const reduceMotion = useReducedMotion();
  const colorInputRef = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef<{ key: string; index: number } | null>(null);

  const palettes = [
    ...officePaletteCombos.map((p) => ({ key: p.key, nombre: p.nombre, colores: p.colores, uso: p.uso, custom: false })),
    ...galeria.paletaOficinaCustom.map((p) => ({ key: p.key, nombre: p.nombre, colores: p.colores, uso: p.uso, custom: true })),
  ];

  function toggleSeleccion(key: string) {
    setState((s) => {
      const has = s.paletaOficina.seleccion.includes(key);
      return {
        ...s,
        paletaOficina: {
          ...s.paletaOficina,
          seleccion: has ? s.paletaOficina.seleccion.filter((x) => x !== key) : [...s.paletaOficina.seleccion, key],
        },
      };
    });
  }

  async function addPalette() {
    const nombre = window.prompt("Nombre de la nueva paleta:");
    if (!nombre || !nombre.trim()) return;
    const combo = await addPaletaOficinaCustom(nombre.trim());
    setGaleria((g) => ({ ...g, paletaOficinaCustom: [...g.paletaOficinaCustom, combo] }));
  }

  async function removePalette(key: string) {
    await removePaletaOficinaCustom(key);
    setGaleria((g) => ({
      ...g,
      paletaOficinaCustom: g.paletaOficinaCustom.filter((p) => p.key !== key),
      paletaOficinaFotos: g.paletaOficinaFotos.filter((f) => f.comboKey !== key),
    }));
  }

  function openColorPicker(key: string, index: number) {
    pendingSlot.current = { key, index };
    colorInputRef.current?.click();
  }

  async function handleColorPicked(hex: string) {
    const target = pendingSlot.current;
    if (!target) return;
    const updated = await setPaletaOficinaCustomColor(target.key, target.index, hex, hex);
    if (!updated) return;
    setGaleria((g) => ({
      ...g,
      paletaOficinaCustom: g.paletaOficinaCustom.map((p) => (p.key === target.key ? updated : p)),
    }));
  }

  async function handleMoodUpload(key: string, file: File) {
    const dataUrl = await imageFileToDataUrl(file);
    const foto = await addPaletaOficinaFoto(key, dataUrl);
    setGaleria((g) => ({ ...g, paletaOficinaFotos: [...g.paletaOficinaFotos, foto] }));
  }

  async function removeMoodPhoto(fotoId: string) {
    await removePaletaOficinaFoto(fotoId);
    setGaleria((g) => ({ ...g, paletaOficinaFotos: g.paletaOficinaFotos.filter((f) => f.id !== fotoId) }));
  }

  return (
    <div>
      <input ref={colorInputRef} type="color" className="sr-only" onChange={(e) => handleColorPicked(e.target.value)} />
      <h2 className="font-display mb-2 text-4xl leading-[1.05] font-light tracking-[-0.02em] text-neutral-900">Paleta de color de oficina</h2>
      <p className="mb-8 max-w-xl text-base text-neutral-500">
        Estas son las 10 combinaciones de color más usadas en espacios corporativos. El moodboard de fotos es tu biblioteca
        compartida — subí una vez, reutilizá con todos los clientes.
      </p>

      <div className="mb-4 space-y-4">
        {palettes.map((pl) => {
          const isSelected = state.paletaOficina.seleccion.includes(pl.key);
          const fotos = galeria.paletaOficinaFotos.filter((f) => f.comboKey === pl.key).sort((a, b) => a.orden - b.orden);
          const slotCount = pl.custom ? 4 : pl.colores.length;
          return (
            <div
              key={pl.key}
              className={`rounded-2xl p-4 transition-[box-shadow] duration-200 ${isSelected ? "shadow-[0_0_0_3px_var(--color-neutral-900)]" : "shadow-[0_0_0_1px_var(--color-neutral-200)]"}`}
            >
              <button type="button" onClick={() => toggleSeleccion(pl.key)} className="mb-2 flex w-full items-center justify-between text-left">
                <span className="font-semibold text-neutral-900">
                  {pl.nombre}
                  {pl.custom && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removePalette(pl.key);
                      }}
                      className="ml-2 cursor-pointer text-xs text-neutral-500 hover:text-danger-600"
                    >
                      × quitar
                    </span>
                  )}
                </span>
                {isSelected && <span className="text-neutral-900">✓</span>}
              </button>
              {/* La combinación, a superficie: es lo que el cliente juzga */}
              <div className="mb-3 flex h-24 w-full overflow-hidden rounded-xl">
                {Array.from({ length: slotCount }).map((_, i) => {
                  const c = pl.colores[i];
                  return c ? (
                    <div key={i} title={c.n} className="h-full flex-1" style={{ background: c.h }} />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => openColorPicker(pl.key, i)}
                      className="flex h-full flex-1 items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 text-lg text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-700"
                    >
                      +
                    </button>
                  );
                })}
              </div>
              <p className="mb-3 text-xs text-neutral-500">{pl.uso || "Definí vos la combinación — agregá los colores con el ícono +."}</p>

              <p className="mb-2 text-[10px] font-medium tracking-wide text-neutral-500 uppercase">
                Moodboard — fotos de referencia (hasta 10)
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {fotos.map((f) => (
                  <motion.div
                    key={f.id}
                    layout={!reduceMotion}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }}
                    animate={{ opacity: 1, transform: "scale(1)" }}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100 shadow-[0_0_0_1px_var(--color-neutral-200)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.dataUrl} alt="ref" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeMoodPhoto(f.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
                {fotos.length < 10 && (
                  <label className="flex aspect-[4/3] cursor-pointer items-center justify-center rounded-xl border border-dashed border-neutral-300 text-xs text-neutral-500 transition-colors duration-150 hover:border-neutral-500 hover:text-neutral-800">
                    + Subir
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleMoodUpload(pl.key, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addPalette}
        className="mb-6 rounded-full border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-500 transition hover:border-accent-400 hover:text-accent-600"
      >
        + Agregar paleta personalizada
      </button>

      <label className="mb-6 block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Tono general</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">Frío</span>
          <input
            type="range"
            min={1}
            max={10}
            value={state.paleta.calidoFrio}
            onChange={(e) => setState((s) => ({ ...s, paleta: { ...s.paleta, calidoFrio: Number(e.target.value) } }))}
            className="flex-1 accent-accent-500"
          />
          <span className="text-xs text-neutral-500">Cálido</span>
        </div>
      </label>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Elegí un color libremente (para sumar a favoritos)</p>
      <ColorPickerRow
        onAdd={(hex) =>
          setState((s) =>
            s.paleta.customColores.some((c) => c.h.toUpperCase() === hex)
              ? s
              : { ...s, paleta: { ...s.paleta, customColores: [...s.paleta.customColores, { n: hex, h: hex }] } }
          )
        }
      />
      <div className="flex flex-wrap gap-2">
        {state.paleta.customColores.map((c) => (
          <div key={c.n} className="h-8 w-8 rounded" style={{ background: c.h, border: "1px solid rgba(0,0,0,0.1)" }} title={c.n} />
        ))}
      </div>

      <label className="mt-6 block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Notas sobre color</span>
        <textarea
          rows={3}
          value={state.paleta.notas}
          onChange={(e) => setState((s) => ({ ...s, paleta: { ...s.paleta, notas: e.target.value } }))}
          placeholder="Ej: quieren usar el color del logo como acento..."
          className={inputClass}
        />
      </label>
    </div>
  );
}
