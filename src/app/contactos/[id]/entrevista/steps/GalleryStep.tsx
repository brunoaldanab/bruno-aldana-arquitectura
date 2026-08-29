"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { mobiliarioCardsBase, styleCards, type StyleCard } from "@/lib/entrevista/data";
import type { EntrevistaState, EstiloDetalle, FotoReaccion } from "@/lib/entrevista/types";
import type { GaleriaData, GaleriaFotoDTO } from "@/lib/entrevista/galeria";
import { imageFileToDataUrl } from "@/lib/entrevista/imageToDataUrl";
import {
  addGaleriaCardCustom,
  addGaleriaFoto,
  removeGaleriaCardCustom,
  removeGaleriaFoto,
} from "../galeriaActions";
import { inputClass } from "@/components/ui/field";

type Kind = "estilo" | "mobiliario";
type SetState = React.Dispatch<React.SetStateAction<EntrevistaState>>;
type SetGaleria = React.Dispatch<React.SetStateAction<GaleriaData>>;

function emptyDetail(): EstiloDetalle {
  return { reacciones: {}, notas: "" };
}

/** Movimiento en pantalla: la foto que sale y la que entra recorren el mismo eje. */
const PASE = { duration: 0.25, ease: [0.77, 0, 0.175, 1] as const };
/** Vuelta elástica cuando se arrastra y no alcanza para pasar de foto. */
const VUELTA = { bounceStiffness: 320, bounceDamping: 34 };

export function GalleryStep({
  kind,
  state,
  setState,
  galeria,
  setGaleria,
}: {
  kind: Kind;
  state: EntrevistaState;
  setState: SetState;
  galeria: GaleriaData;
  setGaleria: SetGaleria;
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [fotoIndex, setFotoIndex] = useState(0);
  const [direccion, setDireccion] = useState(1);
  const [subiendo, setSubiendo] = useState(false);
  const visor = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const tipo = kind === "mobiliario" ? "MOBILIARIO" : "ESTILO";
  const baseCards: StyleCard[] = kind === "mobiliario" ? mobiliarioCardsBase : styleCards;
  const customCards = kind === "mobiliario" ? galeria.mobiliarioCustom : galeria.estiloCustom;
  const galeriaFotos = kind === "mobiliario" ? galeria.mobiliarioFotos : galeria.estiloFotos;

  const cards: { k: string; t: string; mood: string; facts: { k: string; v: string }[]; custom?: boolean }[] = [
    ...baseCards.map((c) => ({ k: c.k, t: c.t, mood: c.mood, facts: c.facts })),
    ...customCards.map((c) => ({ k: c.key, t: c.titulo, mood: c.mood, facts: c.facts, custom: true })),
  ];
  const idx = Math.min(tabIndex, cards.length - 1);
  const card = cards[idx];
  const fotos = galeriaFotos.filter((f) => f.cardKey === card.k).sort((a, b) => a.orden - b.orden);

  const detailMap = kind === "mobiliario" ? state.mobiliarioGaleria.detalle : state.estiloDetalle;
  const detail = detailMap[card.k] || emptyDetail();
  const seleccion = kind === "mobiliario" ? state.mobiliarioGaleria.seleccion : state.estilo.seleccion;
  const isSelected = seleccion.includes(card.k);

  const total = fotos.length;
  const posicion = total > 0 ? Math.min(fotoIndex, total - 1) : 0;
  const fotoActual: GaleriaFotoDTO | undefined = fotos[posicion];
  const reaccion: FotoReaccion =
    (fotoActual && detail.reacciones[fotoActual.id]) || { reaction: "", rating: 0, comment: "" };

  /** Cambiar de estilo/tipo devuelve el visor a la primera foto de esa tarjeta. */
  function elegirCard(i: number) {
    setTabIndex(i);
    setFotoIndex(0);
    setDireccion(1);
  }

  const pasar = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setDireccion(delta);
      setFotoIndex((i) => (i + delta + total) % total);
    },
    [total]
  );

  const irA = useCallback(
    (destino: number) => {
      setDireccion(destino > posicion ? 1 : -1);
      setFotoIndex(destino);
    },
    [posicion]
  );

  // Las flechas manejan el visor mientras no se esté escribiendo en un campo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") pasar(1);
      if (e.key === "ArrowLeft") pasar(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pasar]);

  function updateDetail(patch: Partial<EstiloDetalle>) {
    setState((s) =>
      kind === "mobiliario"
        ? {
            ...s,
            mobiliarioGaleria: {
              ...s.mobiliarioGaleria,
              detalle: { ...s.mobiliarioGaleria.detalle, [card.k]: { ...detail, ...patch } },
            },
          }
        : { ...s, estiloDetalle: { ...s.estiloDetalle, [card.k]: { ...detail, ...patch } } }
    );
  }

  function updateReaccion(fotoId: string, patch: Partial<FotoReaccion>) {
    const current: FotoReaccion = detail.reacciones[fotoId] || { reaction: "", rating: 0, comment: "" };
    updateDetail({ reacciones: { ...detail.reacciones, [fotoId]: { ...current, ...patch } } });
  }

  function toggleSelected() {
    setState((s) => {
      if (kind === "mobiliario") {
        const has = s.mobiliarioGaleria.seleccion.includes(card.k);
        return {
          ...s,
          mobiliarioGaleria: {
            ...s.mobiliarioGaleria,
            seleccion: has
              ? s.mobiliarioGaleria.seleccion.filter((x) => x !== card.k)
              : [...s.mobiliarioGaleria.seleccion, card.k],
          },
        };
      }
      const has = s.estilo.seleccion.includes(card.k);
      return {
        ...s,
        estilo: {
          ...s.estilo,
          seleccion: has ? s.estilo.seleccion.filter((x) => x !== card.k) : [...s.estilo.seleccion, card.k],
        },
      };
    });
  }

  async function handleUpload(files: FileList) {
    setSubiendo(true);
    // La foto nueva se agrega al final de esta tarjeta, así que su posición es
    // la cantidad que había antes. Se calcula acá y no en un efecto para que el
    // visor salte a ella sin un render intermedio.
    const base = fotos.length;
    let agregadas = 0;
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await imageFileToDataUrl(file);
        const foto = await addGaleriaFoto(tipo, card.k, dataUrl);
        setGaleria((g) =>
          kind === "mobiliario"
            ? { ...g, mobiliarioFotos: [...g.mobiliarioFotos, foto] }
            : { ...g, estiloFotos: [...g.estiloFotos, foto] }
        );
        agregadas += 1;
      }
    } finally {
      setSubiendo(false);
      if (agregadas > 0) {
        // El visor salta a la última subida: es la que se quiere mirar.
        setDireccion(1);
        setFotoIndex(base + agregadas - 1);
      }
    }
  }

  async function removePhoto(fotoId: string) {
    await removeGaleriaFoto(fotoId);
    setGaleria((g) =>
      kind === "mobiliario"
        ? { ...g, mobiliarioFotos: g.mobiliarioFotos.filter((f) => f.id !== fotoId) }
        : { ...g, estiloFotos: g.estiloFotos.filter((f) => f.id !== fotoId) }
    );
    setFotoIndex((i) => Math.max(0, i - 1));
  }

  async function addCustomCard() {
    const nombre = window.prompt("Nombre del nuevo " + (kind === "mobiliario" ? "tipo de mobiliario" : "estilo") + ":");
    if (!nombre || !nombre.trim()) return;
    const nueva = await addGaleriaCardCustom(tipo, nombre.trim());
    setGaleria((g) =>
      kind === "mobiliario"
        ? { ...g, mobiliarioCustom: [...g.mobiliarioCustom, nueva] }
        : { ...g, estiloCustom: [...g.estiloCustom, nueva] }
    );
    elegirCard(cards.length);
  }

  async function removeCustomCard(key: string) {
    await removeGaleriaCardCustom(tipo, key);
    setGaleria((g) =>
      kind === "mobiliario"
        ? {
            ...g,
            mobiliarioCustom: g.mobiliarioCustom.filter((c) => c.key !== key),
            mobiliarioFotos: g.mobiliarioFotos.filter((f) => f.cardKey !== key),
          }
        : {
            ...g,
            estiloCustom: g.estiloCustom.filter((c) => c.key !== key),
            estiloFotos: g.estiloFotos.filter((f) => f.cardKey !== key),
          }
    );
    elegirCard(0);
  }

  const title =
    kind === "mobiliario"
      ? "¿Qué tipo de mobiliario les gusta más?"
      : "¿Qué forma / estilo arquitectónico los representa?";
  const desc =
    kind === "mobiliario"
      ? "Mostrale las fotos una por una. Reaccioná con el cliente delante — la biblioteca es compartida entre todos los clientes."
      : "Mostrale las fotos una por una y reaccioná con el cliente delante: descartar, me gusta o me encanta. La biblioteca es compartida entre todas las entrevistas.";

  /** La foto entra por donde va el pase y sale por el lado opuesto. */
  const variantes = {
    entra: (dir: number) => ({
      opacity: 0,
      transform: reduceMotion ? "none" : `translateX(${dir * 8}%) scale(1.02)`,
    }),
    centro: { opacity: 1, transform: "translateX(0%) scale(1)" },
    sale: (dir: number) => ({
      opacity: 0,
      transform: reduceMotion ? "none" : `translateX(${dir * -8}%) scale(0.98)`,
    }),
  };

  return (
    <div>
      <div className="mb-5 px-1">
        <h2 className="font-display mb-2 text-4xl leading-[1.05] font-extralight tracking-[-0.03em] text-neutral-100">{title}</h2>
        <p className="text-sm text-neutral-500">{desc}</p>
      </div>

      {/* Estilos / tipos — la navegación de primer nivel */}
      <div className="mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((c, i) => (
          <button
            key={c.k}
            type="button"
            onClick={() => elegirCard(i)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors duration-150 ${
              i === idx
                ? "border-neutral-100 bg-neutral-100 text-neutral-950"
                : "border-white/15 text-neutral-300 hover:border-white/25 hover:bg-white/[0.05]"
            } ${seleccion.includes(c.k) ? "ring-2 ring-success-600 ring-offset-1" : ""}`}
          >
            {c.t}
            {c.custom && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomCard(c.k);
                }}
                className="ml-1.5 cursor-pointer opacity-60 hover:opacity-100"
              >
                ×
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={addCustomCard}
          className="shrink-0 rounded-full border border-dashed border-white/15 px-4 py-2 text-xs font-medium text-neutral-500 transition-colors duration-150 hover:border-neutral-500 hover:text-neutral-200"
        >
          + Agregar
        </button>
      </div>

      {/* EL VISOR — la foto es lo más grande de la pantalla */}
      <div
        ref={visor}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-950 select-none"
      >
        {fotoActual ? (
          <AnimatePresence initial={false} custom={direccion} mode="popLayout">
            <motion.div
              key={fotoActual.id}
              custom={direccion}
              variants={variantes}
              initial="entra"
              animate="centro"
              exit="sale"
              transition={PASE}
              drag={total > 1 && !reduceMotion ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                const fuerza = info.offset.x + info.velocity.x * 0.2;
                if (fuerza < -80) pasar(1);
                else if (fuerza > 80) pasar(-1);
              }}
              dragTransition={VUELTA}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoActual.dataUrl}
                alt="Referencia"
                draggable={false}
                className="h-full w-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 text-neutral-600">
            <span className="text-4xl font-extralight">+</span>
            <span className="text-sm">Subí la primera foto de {card.t}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}

        {/* Degradados: sostienen la lectura de los controles sobre cualquier foto */}
        {fotoActual && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />
          </>
        )}

        {/* Pasar de a una */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => pasar(-1)}
              aria-label="Foto anterior"
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-100 shadow-lg boton-visor transition-[transform,background-color] duration-150 hover:bg-neutral-900"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => pasar(1)}
              aria-label="Foto siguiente"
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-100 shadow-lg boton-visor transition-[transform,background-color] duration-150 hover:bg-neutral-900"
            >
              →
            </button>
          </>
        )}

        {/* Encabezado sobre la foto */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
          <div>
            <p className="text-sm font-medium text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">{card.t}</p>
            <p className="text-xs text-white/70 [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">{card.mood}</p>
          </div>
          <div className="flex items-center gap-2">
            {total > 0 && (
              <span className="rounded-full bg-black/45 px-2.5 py-1 font-mono text-[11px] text-white/90">
                {posicion + 1} / {total}
              </span>
            )}
            {fotoActual && (
              <button
                type="button"
                onClick={() => removePhoto(fotoActual.id)}
                title="Quitar de la biblioteca (afecta a todos los clientes)"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-sm text-white/90 transition-colors duration-150 hover:bg-danger-600 hover:text-neutral-950"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Reaccionar sobre la foto misma, sin abrir nada */}
        {fotoActual && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              {(
                [
                  { k: "descartar", icono: "✕", texto: "Descartar" },
                  { k: "like", icono: "♥", texto: "Me gusta" },
                  { k: "super", icono: "★", texto: "Me encanta" },
                ] as const
              ).map((op) => {
                const activa = reaccion.reaction === op.k;
                return (
                  <button
                    key={op.k}
                    type="button"
                    onClick={() =>
                      updateReaccion(fotoActual.id, { reaction: activa ? "" : op.k })
                    }
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-[transform,background-color,color] duration-150 active:scale-95 ${
                      activa
                        ? "bg-neutral-900 text-neutral-100"
                        : "bg-black/45 text-white/90 hover:bg-black/65"
                    }`}
                  >
                    <span>{op.icono}</span>
                    {op.texto}
                  </button>
                );
              })}
            </div>

            {(reaccion.reaction === "like" || reaccion.reaction === "super") && (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(8px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5"
              >
                <span className="text-[11px] text-white/70">Puntaje</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={reaccion.rating}
                  onChange={(e) => updateReaccion(fotoActual.id, { rating: Number(e.target.value) })}
                  className="h-1 w-28 accent-white"
                />
                <span className="w-8 font-mono text-xs text-white">{reaccion.rating}/10</span>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Tira de miniaturas: dónde estoy y salto directo */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence initial={false}>
          {fotos.map((f, i) => {
            const r = detail.reacciones[f.id];
            return (
              <motion.button
                key={f.id}
                type="button"
                layout={!reduceMotion}
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, transform: "translateY(10px) scale(0.95)" }
                }
                animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => irA(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors duration-150 ${
                  i === posicion ? "border-neutral-100" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.dataUrl} alt="" className="h-full w-full object-cover" />
                {r?.reaction && (
                  <span className="absolute left-1 top-1 rounded bg-black/65 px-1 text-[10px] text-white">
                    {r.reaction === "super" ? "★" : r.reaction === "like" ? "♥" : "✕"}
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        <label
          className={`flex h-16 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-xs transition-colors duration-150 ${
            subiendo
              ? "border-white/25 text-neutral-600"
              : "border-white/15 text-neutral-500 hover:border-neutral-500 hover:text-neutral-200"
          }`}
        >
          <span>{subiendo ? "Subiendo…" : "+ Subir"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggleSelected}
          className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors duration-150 ${
            isSelected
              ? "border-success-600 bg-success-50 text-success-700"
              : "border-white/15 text-neutral-300 hover:border-white/25 hover:bg-white/[0.05]"
          }`}
        >
          {isSelected ? "✓ Elegido por el cliente" : "Marcar como elegido"}
        </button>
        {card.facts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {card.facts.map((f) => (
              <span
                key={f.k}
                className="rounded-full bg-white/[0.09] px-3 py-1.5 text-[11px] text-neutral-400"
                title={f.v}
              >
                <span className="font-medium text-neutral-200">{f.k}:</span> {f.v}
              </span>
            ))}
          </div>
        )}
      </div>

      <label className="mt-5 block">
        <span className="mb-1 block text-xs font-medium tracking-wide text-neutral-500 uppercase">
          Qué le gustó / qué comentó el cliente (en general)
        </span>
        <textarea
          rows={3}
          value={detail.notas}
          onChange={(e) => updateDetail({ notas: e.target.value })}
          placeholder="Anotá en vivo lo que mencione el cliente..."
          className={inputClass}
        />
      </label>
    </div>
  );
}
