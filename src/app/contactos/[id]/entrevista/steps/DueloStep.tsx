"use client";

import { useMemo, useState } from "react";
import { styleCards } from "@/lib/entrevista/data";
import type { EntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";

interface DuelItem {
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
  const cards = [...styleCards.map((c) => ({ k: c.k, t: c.t })), ...galeria.estiloCustom.map((c) => ({ k: c.key, t: c.titulo }))];
  cards.forEach((c) => {
    const det = state.estiloDetalle[c.k];
    if (!det) return;
    const fotos = galeria.estiloFotos.filter((f) => f.cardKey === c.k);
    fotos.forEach((f) => {
      const r = det.reacciones[f.id];
      if (r && (r.reaction === "like" || r.reaction === "super") && r.rating >= 6) {
        pool.push({ styleKey: c.k, styleName: c.t, dataUrl: f.dataUrl, rating: r.rating, reaction: r.reaction });
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
  const cards = [...styleCards.map((c) => ({ k: c.k, t: c.t })), ...galeria.estiloCustom.map((c) => ({ k: c.key, t: c.titulo }))];
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
  galeria,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
  galeria: GaleriaData;
  setGaleria: React.Dispatch<React.SetStateAction<GaleriaData>>;
}) {
  const [duel, setDuel] = useState<DuelState | null>(null);
  const ranking = useMemo(() => computeRanking(state, galeria), [state, galeria]);
  const maxAvg = Math.max(...ranking.map((r) => r.avg), 1);
  const pool = useMemo(() => buildPool(state, galeria), [state, galeria]);

  function start() {
    if (pool.length < 2) return;
    const sorted = pool.slice().sort((a, b) => b.rating - a.rating);
    const { pairs, bye } = makePairs(sorted);
    setDuel({ pairs, pairIndex: 0, winners: bye ? [bye] : [], champion: null, roundNum: 1 });
  }

  function pick(winner: DuelItem) {
    setDuel((d) => {
      if (!d) return d;
      const winners = [...d.winners, winner];
      const pairIndex = d.pairIndex + 1;
      if (pairIndex >= d.pairs.length) {
        if (winners.length === 1) {
          return { ...d, winners, pairIndex, champion: winners[0] };
        }
        const { pairs, bye } = makePairs(winners);
        return { pairs, pairIndex: 0, winners: bye ? [bye] : [], champion: null, roundNum: d.roundNum + 1 };
      }
      return { ...d, winners, pairIndex };
    });
  }

  const currentPair = duel && !duel.champion ? duel.pairs[duel.pairIndex] : null;

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">Ranking automático & duelo de favoritos</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Con lo que calificaron en el paso anterior armamos dos cosas: un ranking automático de estilos según puntaje promedio, y un
        duelo cara a cara entre las fotos mejor calificadas (6+/10) de todas las categorías — para definir, en vivo, cuál es LA
        favorita absoluta.
      </p>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Ranking automático de estilos</p>
      {ranking.length === 0 ? (
        <p className="mb-6 text-sm text-neutral-500">
          Todavía no hay fotos calificadas con ♥ o ★ en el paso anterior — volvé a &quot;Estilo&quot; y calificá algunas para ver el
          ranking acá.
        </p>
      ) : (
        <div className="mb-6 space-y-2">
          {ranking.map((r, i) => (
            <div key={r.key} className="flex items-center gap-3">
              <span className={`w-5 text-sm font-semibold ${i === 0 ? "text-neutral-900" : "text-neutral-400"}`}>{i + 1}</span>
              <span className="w-40 shrink-0 truncate text-sm text-neutral-700">{r.name}</span>
              <div className="h-2 flex-1 rounded-full bg-neutral-100">
                <div className="h-2 rounded-full bg-neutral-900" style={{ width: `${(r.avg / maxAvg) * 100}%` }} />
              </div>
              <span className="w-12 text-right text-xs text-neutral-500">{r.avg.toFixed(1)}/10</span>
            </div>
          ))}
        </div>
      )}

      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">Duelo de favoritos</p>

      {!duel && (
        <div>
          <p className="mb-3 text-sm text-neutral-500">{pool.length} foto(s) calificadas con 6+ puntos, listas para el duelo.</p>
          <button
            type="button"
            disabled={pool.length < 2}
            onClick={start}
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-white disabled:opacity-25"
          >
            Iniciar duelo →
          </button>
          {pool.length < 2 && (
            <p className="mt-3 text-sm text-neutral-500">
              Se necesitan al menos 2 fotos con 6+ puntos en distintas fotos para poder enfrentarlas.
            </p>
          )}
        </div>
      )}

      {duel?.champion && (
        <div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">★ Favorita absoluta de la reunión</p>
            <img src={duel.champion.dataUrl} alt="Foto ganadora" className="mx-auto mb-3 max-h-64 rounded-md object-cover" />
            <h3 className="text-base font-semibold text-neutral-900">{duel.champion.styleName}</h3>
            <p className="text-sm text-neutral-500">
              Calificada {duel.champion.rating}/10 · {duel.champion.reaction === "super" ? "Le encantó" : "Le gustó"}
            </p>
          </div>
          <button type="button" onClick={() => setDuel(null)} className="mt-4 text-sm font-medium text-neutral-700 hover:underline">
            Repetir duelo
          </button>
        </div>
      )}

      {currentPair && (
        <div>
          <p className="mb-3 text-xs text-neutral-400">
            Ronda {duel!.roundNum} · enfrentamiento {duel!.pairIndex + 1} de {duel!.pairs.length}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => pick(currentPair[0])}
              className="flex-1 overflow-hidden rounded-lg border border-neutral-200 text-left transition hover:border-neutral-900"
            >
              <img src={currentPair[0].dataUrl} alt={currentPair[0].styleName} className="h-40 w-full object-cover" />
              <div className="p-2">
                <p className="text-sm font-medium text-neutral-900">{currentPair[0].styleName}</p>
                <p className="text-xs text-neutral-500">
                  {currentPair[0].rating}/10 {currentPair[0].reaction === "super" ? "★" : "♥"}
                </p>
              </div>
            </button>
            <span className="text-sm font-semibold text-neutral-400">VS</span>
            <button
              type="button"
              onClick={() => pick(currentPair[1])}
              className="flex-1 overflow-hidden rounded-lg border border-neutral-200 text-left transition hover:border-neutral-900"
            >
              <img src={currentPair[1].dataUrl} alt={currentPair[1].styleName} className="h-40 w-full object-cover" />
              <div className="p-2">
                <p className="text-sm font-medium text-neutral-900">{currentPair[1].styleName}</p>
                <p className="text-xs text-neutral-500">
                  {currentPair[1].rating}/10 {currentPair[1].reaction === "super" ? "★" : "♥"}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
