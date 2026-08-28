"use client";

import { useState } from "react";
import { mobiliarioCardsBase, styleCards, type StyleCard } from "@/lib/entrevista/data";
import type { EntrevistaState, EstiloDetalle, FotoReaccion } from "@/lib/entrevista/types";
import type { GaleriaData, GaleriaFotoDTO } from "@/lib/entrevista/galeria";
import { imageFileToDataUrl } from "@/lib/entrevista/imageToDataUrl";
import { addGaleriaCardCustom, addGaleriaFoto, removeGaleriaCardCustom, removeGaleriaFoto } from "../galeriaActions";
import { PhotoLightbox } from "./PhotoLightbox";

type Kind = "estilo" | "mobiliario";
type SetState = React.Dispatch<React.SetStateAction<EntrevistaState>>;
type SetGaleria = React.Dispatch<React.SetStateAction<GaleriaData>>;

function emptyDetail(): EstiloDetalle {
  return { reacciones: {}, notas: "" };
}

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
  const [lightboxFotoId, setLightboxFotoId] = useState<string | null>(null);

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

  function updateDetail(patch: Partial<EstiloDetalle>) {
    setState((s) =>
      kind === "mobiliario"
        ? { ...s, mobiliarioGaleria: { ...s.mobiliarioGaleria, detalle: { ...s.mobiliarioGaleria.detalle, [card.k]: { ...detail, ...patch } } } }
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
            seleccion: has ? s.mobiliarioGaleria.seleccion.filter((x) => x !== card.k) : [...s.mobiliarioGaleria.seleccion, card.k],
          },
        };
      }
      const has = s.estilo.seleccion.includes(card.k);
      return { ...s, estilo: { ...s.estilo, seleccion: has ? s.estilo.seleccion.filter((x) => x !== card.k) : [...s.estilo.seleccion, card.k] } };
    });
  }

  async function handleUpload(file: File) {
    const dataUrl = await imageFileToDataUrl(file);
    const foto = await addGaleriaFoto(tipo, card.k, dataUrl);
    setGaleria((g) =>
      kind === "mobiliario" ? { ...g, mobiliarioFotos: [...g.mobiliarioFotos, foto] } : { ...g, estiloFotos: [...g.estiloFotos, foto] }
    );
  }

  async function removePhoto(fotoId: string) {
    await removeGaleriaFoto(fotoId);
    setGaleria((g) =>
      kind === "mobiliario"
        ? { ...g, mobiliarioFotos: g.mobiliarioFotos.filter((f) => f.id !== fotoId) }
        : { ...g, estiloFotos: g.estiloFotos.filter((f) => f.id !== fotoId) }
    );
  }

  async function addCustomCard() {
    const nombre = window.prompt("Nombre del nuevo " + (kind === "mobiliario" ? "tipo de mobiliario" : "estilo") + ":");
    if (!nombre || !nombre.trim()) return;
    const nueva = await addGaleriaCardCustom(tipo, nombre.trim());
    setGaleria((g) =>
      kind === "mobiliario" ? { ...g, mobiliarioCustom: [...g.mobiliarioCustom, nueva] } : { ...g, estiloCustom: [...g.estiloCustom, nueva] }
    );
    setTabIndex(cards.length);
  }

  async function removeCustomCard(key: string) {
    await removeGaleriaCardCustom(tipo, key);
    setGaleria((g) =>
      kind === "mobiliario"
        ? { ...g, mobiliarioCustom: g.mobiliarioCustom.filter((c) => c.key !== key), mobiliarioFotos: g.mobiliarioFotos.filter((f) => f.cardKey !== key) }
        : { ...g, estiloCustom: g.estiloCustom.filter((c) => c.key !== key), estiloFotos: g.estiloFotos.filter((f) => f.cardKey !== key) }
    );
    setTabIndex(0);
  }

  const title = kind === "mobiliario" ? "¿Qué tipo de mobiliario les gusta más?" : "¿Qué forma / estilo arquitectónico los representa?";
  const desc =
    kind === "mobiliario"
      ? "Esto es sobre las PIEZAS de mobiliario en sí. Las fotos de referencia son tu biblioteca compartida — subí una vez, reutilizá con todos los clientes."
      : "Esto define la FORMA del espacio — líneas, volúmenes, ornamento. Las fotos de referencia son tu biblioteca compartida (no de este cliente en particular): subí una vez y quedan disponibles para cualquier entrevista futura. Reaccioná con este cliente delante: descartar, me gusta o me encanta.";

  const activeFoto: GaleriaFotoDTO | undefined = fotos.find((f) => f.id === lightboxFotoId);
  const activeReaccion: FotoReaccion = (lightboxFotoId && detail.reacciones[lightboxFotoId]) || { reaction: "", rating: 0, comment: "" };

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

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Fotos de referencia de la biblioteca — clic para reaccionar con este cliente
      </p>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {fotos.map((f) => {
          const r = detail.reacciones[f.id];
          return (
            <div key={f.id} className="relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
              <button type="button" onClick={() => setLightboxFotoId(f.id)} className="block h-full w-full">
                <img src={f.dataUrl} alt="Referencia" className="h-full w-full object-cover" />
              </button>
              {r?.reaction && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">
                  {r.reaction === "super" ? "★" : r.reaction === "like" ? "♥" : "✕"}
                </span>
              )}
              {r && (r.reaction === "like" || r.reaction === "super") && (
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] text-white">{r.rating}/10</span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(f.id)}
                title="Quitar de la biblioteca (afecta a todos los clientes)"
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[10px] text-neutral-700"
              >
                ×
              </button>
            </div>
          );
        })}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-neutral-300 text-xs text-neutral-400 hover:border-neutral-400">
          <span>+ Subir</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </label>
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

      {activeFoto && (
        <PhotoLightbox
          dataUrl={activeFoto.dataUrl}
          reaccion={activeReaccion}
          onChange={(patch) => updateReaccion(activeFoto.id, patch)}
          onClose={() => setLightboxFotoId(null)}
        />
      )}
    </div>
  );
}
