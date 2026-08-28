"use client";

import { useState } from "react";
import { mobiliarioCardsBase, styleCards, type StyleCard } from "@/lib/entrevista/data";
import type { CardPersonalizada, EntrevistaState, EstiloDetalle, FotoRef } from "@/lib/entrevista/types";
import { imageFileToDataUrl } from "@/lib/entrevista/imageToDataUrl";
import { PhotoLightbox } from "./PhotoLightbox";

type Kind = "estilo" | "mobiliario";

function emptyDetail(): EstiloDetalle {
  return { fotos: [null, null, null, null, null, null], notas: "", audios: [] };
}

export function GalleryStep({
  kind,
  state,
  setState,
}: {
  kind: Kind;
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const baseCards: StyleCard[] = kind === "mobiliario" ? mobiliarioCardsBase : styleCards;
  const customStore = kind === "mobiliario" ? state.mobiliarioTiposPersonalizados : state.estilosPersonalizados;
  const custom = customStore.proyecto || [];
  const cards: StyleCard[] = [...baseCards, ...custom];
  const idx = Math.min(tabIndex, cards.length - 1);
  const card = cards[idx];
  const key = "proyecto::" + card.k;

  const detailMap = kind === "mobiliario" ? state.mobiliarioGaleria.detalle : state.estiloDetalle;
  const detail = detailMap[key] || emptyDetail();
  const seleccion = kind === "mobiliario" ? state.mobiliarioGaleria.seleccion : state.estilo.seleccion;
  const isSelected = seleccion.includes(card.k);

  function updateDetail(patch: Partial<EstiloDetalle>) {
    setState((s) =>
      kind === "mobiliario"
        ? {
            ...s,
            mobiliarioGaleria: {
              ...s.mobiliarioGaleria,
              detalle: { ...s.mobiliarioGaleria.detalle, [key]: { ...detail, ...patch } },
            },
          }
        : { ...s, estiloDetalle: { ...s.estiloDetalle, [key]: { ...detail, ...patch } } }
    );
  }

  function toggleSelected() {
    setState((s) => {
      if (kind === "mobiliario") {
        const has = s.mobiliarioGaleria.seleccion.includes(card.k);
        return {
          ...s,
          mobiliarioGaleria: {
            ...s.mobiliarioGaleria,
            seleccion: has ? s.mobiliarioGaleria.seleccion.filter((x) => x !== card.k) : [...s.mobiliarioGaleria.seleccion, card.k],
          },
        };
      }
      const has = s.estilo.seleccion.includes(card.k);
      return { ...s, estilo: { ...s.estilo, seleccion: has ? s.estilo.seleccion.filter((x) => x !== card.k) : [...s.estilo.seleccion, card.k] } };
    });
  }

  async function handleUpload(i: number, file: File) {
    const dataUrl = await imageFileToDataUrl(file);
    const fotos = detail.fotos.slice();
    fotos[i] = { dataUrl, reaction: "", rating: 0, comment: "" };
    updateDetail({ fotos });
  }

  function removePhoto(i: number) {
    const fotos = detail.fotos.slice();
    fotos[i] = null;
    updateDetail({ fotos });
  }

  function updatePhoto(i: number, patch: Partial<FotoRef>) {
    const fotos = detail.fotos.slice();
    const current = fotos[i];
    if (!current) return;
    fotos[i] = { ...current, ...patch };
    updateDetail({ fotos });
  }

  function addCustomCard() {
    const nombre = window.prompt("Nombre del nuevo " + (kind === "mobiliario" ? "tipo de mobiliario" : "estilo") + ":");
    if (!nombre || !nombre.trim()) return;
    const nueva: CardPersonalizada = {
      k: "custom-" + Date.now(),
      t: nombre.trim(),
      mood: "Personalizado",
      d: "Agregado por el estudio",
      custom: true,
      facts: [
        { k: "De qué se trata", v: "Definilo con tus propias palabras durante la reunión." },
        { k: "Materiales típicos", v: "—" },
        { k: "Ideal para", v: "—" },
        { k: "Cuidado con", v: "—" },
      ],
    };
    setState((s) => {
      if (kind === "mobiliario") {
        const list = s.mobiliarioTiposPersonalizados.proyecto || [];
        return { ...s, mobiliarioTiposPersonalizados: { ...s.mobiliarioTiposPersonalizados, proyecto: [...list, nueva] } };
      }
      const list = s.estilosPersonalizados.proyecto || [];
      return { ...s, estilosPersonalizados: { ...s.estilosPersonalizados, proyecto: [...list, nueva] } };
    });
    setTabIndex(cards.length);
  }

  function removeCustomCard(k: string) {
    setState((s) => {
      if (kind === "mobiliario") {
        const list = (s.mobiliarioTiposPersonalizados.proyecto || []).filter((c) => c.k !== k);
        return { ...s, mobiliarioTiposPersonalizados: { ...s.mobiliarioTiposPersonalizados, proyecto: list } };
      }
      const list = (s.estilosPersonalizados.proyecto || []).filter((c) => c.k !== k);
      return { ...s, estilosPersonalizados: { ...s.estilosPersonalizados, proyecto: list } };
    });
    setTabIndex(0);
  }

  const title = kind === "mobiliario" ? "¿Qué tipo de mobiliario les gusta más?" : "¿Qué forma / estilo arquitectónico los representa?";
  const desc =
    kind === "mobiliario"
      ? "Esto es sobre las PIEZAS de mobiliario en sí — más allá del estilo general del espacio. Subí fotos de referencia y calificalas."
      : "Esto define la FORMA del espacio — líneas, volúmenes, ornamento. Es independiente del color, eso se define en el paso de paleta. Subí fotos de referencia con el cliente delante y reaccioná en vivo: descartar, me gusta o me encanta.";

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mb-5 text-sm text-neutral-500">{desc}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {cards.map((c, i) => (
          <button
            key={c.k}
            type="button"
            onClick={() => setTabIndex(i)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              i === idx ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            } ${seleccion.includes(c.k) ? "ring-2 ring-offset-1 ring-emerald-400" : ""}`}
          >
            {c.t}
            {c.custom && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomCard(c.k);
                }}
                className="ml-1.5 cursor-pointer text-neutral-400 hover:text-red-300"
              >
                ×
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={addCustomCard}
          className="rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:border-neutral-400"
        >
          + Agregar
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{card.t}</h3>
          <p className="text-xs text-neutral-500">{card.mood}</p>
        </div>
        <button
          type="button"
          onClick={toggleSelected}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            isSelected ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          {isSelected ? "✓ Elegido por el cliente" : "Marcar como elegido"}
        </button>
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Fotos de referencia (hasta 6 — clic para calificar)</p>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {detail.fotos.map((f, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
            {f ? (
              <>
                <button type="button" onClick={() => setLightboxIndex(i)} className="block h-full w-full">
                  <img src={f.dataUrl} alt={`Referencia ${i + 1}`} className="h-full w-full object-cover" />
                </button>
                {f.reaction && (
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">
                    {f.reaction === "super" ? "★" : f.reaction === "like" ? "♥" : "✕"}
                  </span>
                )}
                {(f.reaction === "like" || f.reaction === "super") && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] text-white">{f.rating}/10</span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[10px] text-neutral-700"
                >
                  ×
                </button>
              </>
            ) : (
              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-xs text-neutral-400">
                <span>+ Subir</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(i, file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      {card.facts.length > 0 && (
        <>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Lo esencial</p>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {card.facts.map((f) => (
              <div key={f.k} className="rounded-md bg-neutral-50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{f.k}</p>
                <p className="text-sm text-neutral-700">{f.v}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
          Qué le gustó / qué comentó el cliente (en general)
        </span>
        <textarea
          rows={3}
          value={detail.notas}
          onChange={(e) => updateDetail({ notas: e.target.value })}
          placeholder="Anotá en vivo lo que mencione el cliente..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </label>

      {lightboxIndex !== null && detail.fotos[lightboxIndex] && (
        <PhotoLightbox
          foto={detail.fotos[lightboxIndex] as FotoRef}
          onChange={(patch) => updatePhoto(lightboxIndex, patch)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
