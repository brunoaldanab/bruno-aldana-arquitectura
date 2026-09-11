// src/app/visita/page.tsx
import type { Metadata } from "next";
import { VisitaApp } from "./VisitaApp";

export const metadata: Metadata = { title: "Visita · Bruno Aldana · Arquitectura" };

/** Estática y sin datos: se guarda entera en el teléfono. Los datos viven en IndexedDB. */
export default function VisitaPage() {
  return <VisitaApp />;
}
