import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { createInitialEntrevistaState, type EntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import { EntrevistaWizard } from "./EntrevistaWizard";

export default async function EntrevistaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacto = await prisma.contacto.findUnique({ where: { id } });
  if (!contacto) notFound();

  let entrevista = await prisma.entrevista.findFirst({
    where: { contactoId: id },
    orderBy: { createdAt: "desc" },
  });

  if (!entrevista) {
    entrevista = await prisma.entrevista.create({
      data: { contactoId: id, data: createInitialEntrevistaState() as unknown as object },
    });
  }

  const [estiloFotos, mobiliarioFotos, estiloCustom, mobiliarioCustom, paletaOficinaFotos, paletaOficinaCustom] = await Promise.all([
    prisma.galeriaFoto.findMany({ where: { tipo: "ESTILO" }, orderBy: { orden: "asc" } }),
    prisma.galeriaFoto.findMany({ where: { tipo: "MOBILIARIO" }, orderBy: { orden: "asc" } }),
    prisma.galeriaCardCustom.findMany({ where: { tipo: "ESTILO" }, orderBy: { createdAt: "asc" } }),
    prisma.galeriaCardCustom.findMany({ where: { tipo: "MOBILIARIO" }, orderBy: { createdAt: "asc" } }),
    prisma.paletaOficinaFoto.findMany({ orderBy: { orden: "asc" } }),
    prisma.paletaOficinaCustom.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const initialGaleria: GaleriaData = {
    estiloFotos: estiloFotos.map((f) => ({ id: f.id, cardKey: f.cardKey, dataUrl: f.dataUrl, orden: f.orden })),
    mobiliarioFotos: mobiliarioFotos.map((f) => ({ id: f.id, cardKey: f.cardKey, dataUrl: f.dataUrl, orden: f.orden })),
    estiloCustom: estiloCustom.map((c) => ({
      id: c.id,
      key: c.key,
      titulo: c.titulo,
      mood: c.mood,
      descripcion: c.descripcion,
      facts: c.facts as unknown as { k: string; v: string }[],
    })),
    mobiliarioCustom: mobiliarioCustom.map((c) => ({
      id: c.id,
      key: c.key,
      titulo: c.titulo,
      mood: c.mood,
      descripcion: c.descripcion,
      facts: c.facts as unknown as { k: string; v: string }[],
    })),
    paletaOficinaFotos: paletaOficinaFotos.map((f) => ({ id: f.id, comboKey: f.comboKey, dataUrl: f.dataUrl, orden: f.orden })),
    paletaOficinaCustom: paletaOficinaCustom.map((c) => ({
      id: c.id,
      key: c.key,
      nombre: c.nombre,
      colores: c.colores as unknown as { n: string; h: string }[],
      uso: c.uso,
    })),
  };

  return (
    <>
      <AppHeader />
      <EntrevistaWizard
        entrevistaId={entrevista.id}
        contactoId={id}
        contactoNombre={contacto.nombre}
        initialData={entrevista.data as unknown as EntrevistaState}
        initialGaleria={initialGaleria}
      />
    </>
  );
}
