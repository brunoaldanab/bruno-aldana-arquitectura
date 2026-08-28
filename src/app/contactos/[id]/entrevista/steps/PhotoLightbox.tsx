"use client";

import type { FotoReaccion } from "@/lib/entrevista/types";

const REACTIONS: { value: string; label: string }[] = [
  { value: "dislike", label: "✕ No" },
  { value: "like", label: "♥ Le gustó" },
  { value: "super", label: "★ Le encantó" },
];

export function PhotoLightbox({
  dataUrl,
  reaccion,
  onChange,
  onClose,
}: {
  dataUrl: string;
  reaccion: FotoReaccion;
  onChange: (patch: Partial<FotoReaccion>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-lg bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <img src={dataUrl} alt="Referencia" className="mb-4 max-h-80 w-full rounded-md object-contain" />

        <div className="mb-4 flex gap-2">
          {REACTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange({ reaction: r.value, rating: r.value === "dislike" ? 0 : reaccion.rating || 7 })}
              className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium ${
                reaccion.reaction === r.value ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {(reaccion.reaction === "like" || reaccion.reaction === "super") && (
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Calificación: {reaccion.rating}/10</span>
            <input
              type="range"
              min={1}
              max={10}
              value={reaccion.rating || 7}
              onChange={(e) => onChange({ rating: Number(e.target.value) })}
              className="w-full accent-neutral-900"
            />
          </label>
        )}

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Comentario</span>
          <textarea
            rows={2}
            value={reaccion.comment}
            onChange={(e) => onChange({ comment: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <button type="button" onClick={onClose} className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Cerrar
        </button>
      </div>
    </div>
  );
}
