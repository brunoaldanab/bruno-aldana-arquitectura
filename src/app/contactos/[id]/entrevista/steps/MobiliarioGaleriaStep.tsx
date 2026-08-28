"use client";

import type { EntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import { GalleryStep } from "./GalleryStep";

export function MobiliarioGaleriaStep({
  state,
  setState,
  galeria,
  setGaleria,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
  galeria: GaleriaData;
  setGaleria: React.Dispatch<React.SetStateAction<GaleriaData>>;
}) {
  return <GalleryStep kind="mobiliario" state={state} setState={setState} galeria={galeria} setGaleria={setGaleria} />;
}
