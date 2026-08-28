"use client";

import type { EntrevistaState } from "@/lib/entrevista/types";
import { GalleryStep } from "./GalleryStep";

export function EstiloStep({
  state,
  setState,
}: {
  state: EntrevistaState;
  setState: React.Dispatch<React.SetStateAction<EntrevistaState>>;
}) {
  return <GalleryStep kind="estilo" state={state} setState={setState} />;
}
