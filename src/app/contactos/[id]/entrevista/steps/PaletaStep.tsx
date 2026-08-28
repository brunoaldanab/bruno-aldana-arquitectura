"use client";

import { useRef, useState } from "react";
import { colorSwatches, officePaletteCombos, paletteDefs } from "@/lib/entrevista/data";
import type { EntrevistaState, OfficePaletteCustom } from "@/lib/entrevista/types";
import { imageFileToDataUrl } from "@/lib/entrevista/imageToDataUrl";

type SetState = React.Dispatch<React.SetStateAction<EntrevistaState>>;

export function PaletaStep({ state, setState }: { state: EntrevistaState; setState: SetState }) {
  if (state.proyecto.tipoProyecto === "oficina") {
    return <PaletaOficina state={state} setState={setState} />;
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
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
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
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {swatches.map((c) => (
        <button
          key={c.n}
          type="button"
          onClick={() => onToggle(c.n)}
          className={`rounded-md border p-1 text-center ${selected.includes(c.n) ? "border-neutral-900 ring-1 ring-neutral-900" : "border-transparent"}`}
        >
          <div className="h-12 w-full rounded" style={{ background: c.h, border: "1px solid rgba(0,0,0,0.1)" }} />
          <div className="mt-1 text-[10px] text-neutral-500">{c.n}</div>
        </button>
      ))}
    </div>
  );
}

function PaletaGeneral({ state, setState }: { state: EntrevistaState; setState: SetState }) {
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
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Paleta de color — y qué transmite</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Esta es la decisión que más define cómo se va a sentir el espacio, más allá del estilo. Mostrale al cliente estas 8
        direcciones —cada una con su lectura psicológica— y dejalo reaccionar en vivo. Pueden elegir una o combinar dos.
      </p>

      <div className="mb-6 space-y-3">
        {paletteDefs.map((pd) => {
          const selected = p.seleccion.includes(pd.key);
          return (
            <button
              key={pd.key}
              type="button"
              onClick={() => toggleSeleccion(pd.key)}
              className={`block w-full rounded-lg border p-4 text-left transition ${
                selected ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-neutral-900">{pd.nombre}</span>
                {selected && <span className="text-neutral-900">✓</span>}
              </div>
              <div className="mb-2 flex gap-1.5">
                {pd.colores.map((c) => (
                  <div key={c.n} title={c.n} className="h-6 w-6 rounded" style={{ background: c.h, border: "1px solid rgba(0,0,0,0.1)" }} />
                ))}
              </div>
              <p className="text-xs text-neutral-500" dangerouslySetInnerHTML={{ __html: pd.psicologia }} />
            </button>
          );
        })}
      </div>

      <label className="mb-6 block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Tono general</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">Frío</span>
          <input
            type="range"
            min={1}
            max={10}
            value={p.calidoFrio}
            onChange={(e) => setState((s) => ({ ...s, paleta: { ...s.paleta, calidoFrio: Number(e.target.value) } }))}
            className="flex-1 accent-neutral-900"
          />
          <span className="text-xs text-neutral-400">Cálido</span>
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
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </label>
    </div>
  );
}

type AnyOfficePalette = (typeof officePaletteCombos)[number] | OfficePaletteCustom;

function PaletaOficina({ state, setState }: { state: EntrevistaState; setState: SetState }) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef<{ key: string; index: number } | null>(null);

  const palettes: AnyOfficePalette[] = [...officePaletteCombos, ...state.paletaOficina.personalizadas];

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

  function addPalette() {
    const nombre = window.prompt("Nombre de la nueva paleta:");
    if (!nombre || !nombre.trim()) return;
    const key = "custom-palette-" + Date.now();
    setState((s) => ({
      ...s,
      paletaOficina: {
        ...s.paletaOficina,
        personalizadas: [...s.paletaOficina.personalizadas, { key, nombre: nombre.trim(), colores: [], uso: "", custom: true }],
      },
    }));
  }

  function removePalette(key: string) {
    setState((s) => ({
      ...s,
      paletaOficina: { ...s.paletaOficina, personalizadas: s.paletaOficina.personalizadas.filter((p) => p.key !== key) },
    }));
  }

  function openColorPicker(key: string, index: number) {
    pendingSlot.current = { key, index };
    colorInputRef.current?.click();
  }

  function handleColorPicked(hex: string) {
    const target = pendingSlot.current;
    if (!target) return;
    setState((s) => ({
      ...s,
      paletaOficina: {
        ...s.paletaOficina,
        personalizadas: s.paletaOficina.personalizadas.map((p) => {
          if (p.key !== target.key) return p;
          const colores = p.colores.slice();
          colores[target.index] = { n: hex.toUpperCase(), h: hex };
          return { ...p, colores };
        }),
      },
    }));
  }

  function moodFotos(key: string): (string | null)[] {
    return state.paletaOficina.detalle[key]?.fotos || new Array(10).fill(null);
  }

  async function handleMoodUpload(key: string, index: number, file: File) {
    const dataUrl = await imageFileToDataUrl(file);
    setState((s) => {
      const fotos = (s.paletaOficina.detalle[key]?.fotos || new Array(10).fill(null)).slice();
      fotos[index] = dataUrl;
      return { ...s, paletaOficina: { ...s.paletaOficina, detalle: { ...s.paletaOficina.detalle, [key]: { fotos } } } };
    });
  }

  function removeMoodPhoto(key: string, index: number) {
    setState((s) => {
      const fotos = (s.paletaOficina.detalle[key]?.fotos || new Array(10).fill(null)).slice();
      fotos[index] = null;
      return { ...s, paletaOficina: { ...s.paletaOficina, detalle: { ...s.paletaOficina.detalle, [key]: { fotos } } } };
    });
  }

  return (
    <div>
      <input ref={colorInputRef} type="color" className="sr-only" onChange={(e) => handleColorPicked(e.target.value)} />
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Paleta de color de oficina</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Estas son las 10 combinaciones de color más usadas en espacios corporativos — subí fotos de referencia (hasta 10 por paleta)
        para armar un moodboard con el cliente en vivo.
      </p>

      <div className="mb-4 space-y-4">
        {palettes.map((pl) => {
          const isCustom = "custom" in pl && pl.custom;
          const isSelected = state.paletaOficina.seleccion.includes(pl.key);
          const fotos = moodFotos(pl.key);
          const slotCount = isCustom ? 4 : pl.colores.length;
          return (
            <div
              key={pl.key}
              className={`rounded-lg border p-4 ${isSelected ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200"}`}
            >
              <button type="button" onClick={() => toggleSeleccion(pl.key)} className="mb-2 flex w-full items-center justify-between text-left">
                <span className="font-semibold text-neutral-900">
                  {pl.nombre}
                  {isCustom && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removePalette(pl.key);
                      }}
                      className="ml-2 cursor-pointer text-xs text-neutral-400 hover:text-red-500"
                    >
                      × quitar
                    </span>
                  )}
                </span>
                {isSelected && <span className="text-neutral-900">✓</span>}
              </button>
              <div className="mb-2 flex gap-1.5">
                {Array.from({ length: slotCount }).map((_, i) => {
                  const c = pl.colores[i];
                  return c ? (
                    <div key={i} title={c.n} className="h-6 w-6 rounded" style={{ background: c.h, border: "1px solid rgba(0,0,0,0.1)" }} />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => openColorPicker(pl.key, i)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-neutral-300 text-xs text-neutral-400"
                    >
                      +
                    </button>
                  );
                })}
              </div>
              <p className="mb-3 text-xs text-neutral-500">
                {"uso" in pl && pl.uso ? pl.uso : "Definí vos la combinación — agregá los colores con el ícono +."}
              </p>

              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">Moodboard — fotos de referencia (hasta 10)</p>
              <div className="grid grid-cols-5 gap-1.5">
                {fotos.map((f, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded border border-neutral-200 bg-neutral-50">
                    {f ? (
                      <>
                        <img src={f} alt={`ref ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeMoodPhoto(pl.key, i)}
                          className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/90 text-[9px]"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <label className="flex h-full w-full cursor-pointer items-center justify-center text-[10px] text-neutral-400">
                        {i + 1}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleMoodUpload(pl.key, i, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addPalette}
        className="mb-6 rounded-md border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:border-neutral-400"
      >
        + Agregar paleta personalizada
      </button>

      <label className="mb-6 block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Tono general</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">Frío</span>
          <input
            type="range"
            min={1}
            max={10}
            value={state.paleta.calidoFrio}
            onChange={(e) => setState((s) => ({ ...s, paleta: { ...s.paleta, calidoFrio: Number(e.target.value) } }))}
            className="flex-1 accent-neutral-900"
          />
          <span className="text-xs text-neutral-400">Cálido</span>
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
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </label>
    </div>
  );
}
