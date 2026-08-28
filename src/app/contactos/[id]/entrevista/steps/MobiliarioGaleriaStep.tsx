"use client";

import type { EntrevistaState } from "@/lib/entrevista/types";
import { GalleryStep } from "./GalleryStep";

export function MobiliarioGaleriaStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  return <GalleryStep kind="mobiliario" state={state} setState={setState} />;
}
