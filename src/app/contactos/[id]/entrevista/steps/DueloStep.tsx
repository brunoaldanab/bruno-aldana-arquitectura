"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { styleCards } from "@/lib/entrevista/data";
import { campeonGuardado } from "@/lib/entrevista/duelo";
import type { EntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import { Button } from "@/components/ui/Button";
import { anilloReposo } from "@/components/ui/seleccion";

interface DuelItem {
  fotoId: string;
  styleKey: string;
  styleName: string;
  dataUrl: string;
  rating: number;
  reaction: string;
}

interface DuelState {
  pairs: [DuelItem, DuelItem][];
  pairIndex: number;
  winners: DuelItem[];
  champion: DuelItem | null;
  roundNum: number;
}

function buildPool(state: EntrevistaState, galeria: GaleriaData): DuelItem[] {
  const pool: DuelItem[] = [];
  const cards = [
    ...styleCards.map((c) => ({ k: c.k, t: c.t })),
    ...galeria.estiloCustom.map((c) => ({ k: c.key, t: c.titulo })),
  ];
  cards.forEach((c) => {
    const det = state.estiloDetalle[c.k];
    if (!det) return;
    const fotos = galeria.estiloFotos.filter((f) => f.cardKey === c.k);
    fotos.forEach((f) => {
      const r = det.reacciones[f.id];
      if (r && (r.reaction === "like" || r.reaction === "super") && r.rating >= 6) {
        pool.push({ fotoId: f.id, styleKey: c.k, styleName: c.t, dataUrl: f.dataUrl, rating: r.rating, reaction: r.reaction });
      }
    });
  });
  return pool;
}

function makePairs(items: DuelItem[]): { pairs: [DuelItem, DuelItem][]; bye: DuelItem | null } {
  const pairs: [DuelItem, DuelItem][] = [];
  let bye: DuelItem | null = null;
  for (let i = 0; i < items.length; i += 2) {
    if (i + 1 < items.length) pairs.push([items[i], items[i + 1]]);
    else bye = items[i];
  }
  return { pairs, bye };
}

function computeRanking(state: EntrevistaState, galeria: GaleriaData) {
  const cards = [
    ...styleCards.map((c) => ({ k: c.k, t: c.t })),
    ...galeria.estiloCustom.map((c) => ({ k: c.key, t: c.titulo })),
  ];
  return cards
    .map((c) => {
      const det = state.estiloDetalle[c.k];
      const fotos = galeria.estiloFotos.filter((f) => f.cardKey === c.k);
      const rated = fotos
        .map((f) => det?.reacciones[f.id])
        .filter((r): r is NonNullable<typeof r> => !!r && (r.reaction === "like" || r.reaction === "super"));
      const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;
      return { key: c.k, name: c.t, avg, count: rated.length };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avg - a.avg);
}

export function DueloStep({
  state,
  setState,
  galeria,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
  galeria: GaleriaData;
  setGaleria: React.Dispatch<React.SetStateAction<GaleriaData>>;
}) {
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [elegida, setElegida] = useState<0 | 1 | null>(null);
  const reduceMotion = useReducedMotion();
  const ranking = useMemo(() => computeRanking(state, galeria), [state, galeria]);
  const maxAvg = Math.max(...ranking.map((r) => r.avg), 1);
  const pool = useMemo(() => buildPool(state, galeria), [state, galeria]);

  // El campeón que quedó guardado de una sesión anterior, reconstruido desde la
  // biblioteca. Sin esto, volver al paso mostraba la pantalla de inicio y había
  // que rehacer el torneo entero.
  const guardado = useMemo(
    () => campeonGuardado(state.duelo, galeria.estiloFotos),
    [state.duelo, galeria.estiloFotos]
  );

  // Se guarda apenas se define el campeón. La guarda por fotoId evita volver a
  // escribir el mismo resultado en cada render.
  useEffect(() => {
    const c = duel?.champion;
    if (!c) return;
    setState((s) => {
      if (s.duelo?.fotoId === c.fotoId) return s;
      return {
        ...s,
        duelo: {
          fotoId: c.fotoId,
          styleKey: c.styleKey,
          styleName: c.styleName,
          rating: c.rating,
          reaction: c.reaction,
          decididoEn: new Date().toISOString(),
        },
      };
    });
  }, [duel?.champion, setState]);

  function start() {
    if (pool.length < 2) return;
    const sorted = pool.slice().sort((a, b) => b.rating - a.rating);
    const { pairs, bye } = makePairs(sorted);
    setDuel({ pairs, pairIndex: 0, winners: bye ? [bye] : [], champion: null, roundNum: 1 });
  }

  function avanzar(winner: DuelItem) {
    setDuel((d) => {
      if (!d) return d;
      const winners = [...d.winners, winner];
      const pairIndex = d.pairIndex + 1;
      if (pairIndex >= d.pairs.length) {
        if (winners.length === 1) return { ...d, winners, pairIndex, champion: winners[0] };
        const { pairs, bye } = makePairs(winners);
        return { pairs, pairIndex: 0, winners: bye ? [bye] : [], champion: null, roundNum: d.roundNum + 1 };
      }
      return { ...d, winners, pairIndex };
    });
    setElegida(null);
  }

  /** Marca la elegida, deja ver quién ganó, y recién ahí pasa al siguiente par. */
  function pick(lado: 0 | 1, winner: DuelItem) {
    if (elegida !== null) return;
    setElegida(lado);
    window.setTimeout(() => avanzar(winner), reduceMotion ? 120 : 420);
  }

  const currentPair = duel && !duel.champion ? duel.pairs[duel.pairIndex] : null;

  // Da igual si el campeón se acaba de decidir o venía guardado: se muestra igual.
  const campeon = duel?.champion
    ? { dataUrl: duel.champion.dataUrl, styleName: duel.champion.styleName, rating: duel.champion.rating, reaction: duel.champion.reaction }
    : guardado
      ? { dataUrl: guardado.dataUrl, styleName: guardado.styleName, rating: guardado.rating, reaction: guardado.reaction }
      : null;

  return (
    <div>
      <div className="mb-5 px-1">
        <h2 className="font-display mb-2 text-4xl leading-[1.05] font-extralight tracking-[-0.03em] text-neutral-100">
          Ranking automático &amp; duelo de favoritos
        </h2>
        <p className="text-sm text-neutral-500">
          Enfrentá cara a cara las fotos mejor calificadas (6+/10) y definí en vivo cuál es LA favorita.
        </p>
      </div>

      {/* EL DUELO primero: es lo que se hace con el cliente delante */}
      {currentPair && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              Ronda {duel!.roundNum} · enfrentamiento {duel!.pairIndex + 1} de {duel!.pairs.length}
            </p>
            <button
              type="button"
              onClick={() => {
                setDuel(null);
                setElegida(null);
              }}
              className="text-xs text-neutral-500 transition-colors duration-150 hover:text-neutral-100"
            >
              Cancelar duelo
            </button>
          </div>

          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            {([0, 1] as const).map((lado) => {
              const item = currentPair[lado];
              const gana = elegida === lado;
              const pierde = elegida !== null && elegida !== lado;
              return (
                <motion.button
                  key={`${duel!.roundNum}-${duel!.pairIndex}-${lado}`}
                  type="button"
                  onClick={() => pick(lado, item)}
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, transform: `translateX(${lado === 0 ? -24 : 24}px)` }
                  }
                  animate={{
                    opacity: pierde ? 0.25 : 1,
                    transform: `translateX(0px) scale(${gana ? 1.02 : pierde ? 0.97 : 1})`,
                  }}
                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-2xl transition-[box-shadow] duration-200 sm:aspect-[4/5] ${
                    gana
                      ? "shadow-[0_0_0_4px_var(--color-success-600)]"
                      : anilloReposo
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.dataUrl} alt={item.styleName} className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                    <p className="text-base font-medium text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">
                      {item.styleName}
                    </p>
                    <p className="text-xs text-white/80 [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">
                      {item.rating}/10 · {item.reaction === "super" ? "★ Le encantó" : "♥ Le gustó"}
                    </p>
                  </div>

                  <AnimatePresence>
                    {gana && (
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-success-600 text-lg text-neutral-950 shadow-lg"
                      >
                        ✓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}

            <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium tracking-wider text-neutral-950 shadow-xl">
              VS
            </span>
          </div>
        </div>
      )}

      {campeon && (
        <div className="mb-8">
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.96)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="relative aspect-[16/9] overflow-hidden rounded-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={campeon.dataUrl} alt="Foto ganadora" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-center">
              <p className="mb-1 text-xs font-medium tracking-[0.2em] text-white/80 uppercase">
                ★ Favorita absoluta de la reunión
              </p>
              <h3 className="font-display text-3xl font-extralight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.6)]">
                {campeon.styleName}
              </h3>
              <p className="text-sm text-white/80">
                Calificada {campeon.rating}/10 ·{" "}
                {campeon.reaction === "super" ? "Le encantó" : "Le gustó"}
              </p>
            </div>
          </motion.div>
          <button
            type="button"
            onClick={() => {
              setDuel(null);
              setElegida(null);
              // Sin esto el campeón viejo quedaba pegado en pantalla —"guardado" se
              // deriva de state.duelo— y si se relanzaba el torneo se veían a la vez
              // el campeón anterior y el duelo en curso.
              setState((s) => ({ ...s, duelo: null }));
            }}
            className="mt-4 text-sm font-medium text-neutral-300 transition-colors duration-150 hover:text-neutral-100 hover:underline"
          >
            Repetir duelo
          </button>
        </div>
      )}

      {!duel && (
        <div className="mb-8 rounded-2xl border border-white/10 p-6 text-center">
          <p className="mb-3 text-sm text-neutral-400">
            {pool.length} foto(s) calificadas con 6+ puntos, listas para el duelo.
          </p>
          <Button disabled={pool.length < 2} onClick={start}>
            Iniciar duelo →
          </Button>
          {pool.length < 2 && (
            <p className="mt-3 text-sm text-neutral-500">
              Se necesitan al menos 2 fotos con 6+ puntos para poder enfrentarlas — volvé a &quot;Estilo&quot; y
              calificá algunas.
            </p>
          )}
        </div>
      )}

      <p className="mb-3 px-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
        Ranking automático de estilos
      </p>
      {ranking.length === 0 ? (
        <p className="px-1 text-sm text-neutral-500">
          Todavía no hay fotos calificadas con ♥ o ★ en el paso anterior — volvé a &quot;Estilo&quot; y calificá
          algunas para ver el ranking acá.
        </p>
      ) : (
        <div className="space-y-2 px-1">
          {ranking.map((r, i) => (
            <div key={r.key} className="flex items-center gap-3">
              <span className={`w-5 text-sm font-medium ${i === 0 ? "text-neutral-100" : "text-neutral-500"}`}>
                {i + 1}
              </span>
              <span className="w-40 shrink-0 truncate text-sm text-neutral-300">{r.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.09]">
                <motion.div
                  initial={reduceMotion ? false : { transform: "scaleX(0)" }}
                  animate={{ transform: "scaleX(1)" }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                  style={{ width: `${(r.avg / maxAvg) * 100}%`, transformOrigin: "left" }}
                  className="h-2 rounded-full bg-neutral-100"
                />
              </div>
              <span className="w-12 text-right text-xs text-neutral-500">{r.avg.toFixed(1)}/10</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
