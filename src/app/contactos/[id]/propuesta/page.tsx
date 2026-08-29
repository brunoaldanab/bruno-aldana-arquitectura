import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createInitialEntrevistaState, type EntrevistaState } from "@/lib/entrevista/types";
import type { GaleriaData } from "@/lib/entrevista/galeria";
import { armarPropuesta } from "@/lib/propuesta/datos";
import { Propuesta } from "./Propuesta";

export default async function PropuestaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contacto = await prisma.contacto.findUnique({ where: { id } });
  if (!contacto) notFound();

  const entrevista = await prisma.entrevista.findFirst({
    where: { contactoId: id },
    orderBy: { createdAt: "desc" },
  });

  const [estiloFotos, estiloCustom] = await Promise.all([
    prisma.galeriaFoto.findMany({ where: { tipo: "ESTILO" }, orderBy: { orden: "asc" } }),
    prisma.galeriaCardCustom.findMany({ where: { tipo: "ESTILO" }, orderBy: { createdAt: "asc" } }),
  ]);

  // Solo hace falta la galería de estilo: es de donde salen la portada y los
  // nombres de los estilos elegidos.
  const galeria: GaleriaData = {
    estiloFotos: estiloFotos.map((f) => ({ id: f.id, cardKey: f.cardKey, dataUrl: f.dataUrl, orden: f.orden })),
    estiloCustom: estiloCustom.map((c) => ({
      id: c.id,
      key: c.key,
      titulo: c.titulo,
      mood: c.mood,
      descripcion: c.descripcion,
      facts: c.facts as unknown as { k: string; v: string }[],
    })),
    mobiliarioFotos: [],
    mobiliarioCustom: [],
    paletaOficinaFotos: [],
    paletaOficinaCustom: [],
  };

  const state = (entrevista?.data as unknown as EntrevistaState) ?? createInitialEntrevistaState();
  const datos = armarPropuesta({
    nombreCliente: contacto.nombre,
    state,
    galeria,
    emision: new Date(),
  });

  if ("falta" in datos) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display mb-3 text-2xl font-light text-neutral-900">
          Falta la superficie
        </h1>
        <p className="mb-6 text-neutral-500">
          Para calcular el precio hace falta cargar los metros cuadrados en el paso de
          Datos generales de la entrevista.
        </p>
        <Link
          href={`/contactos/${id}/entrevista`}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Ir a la entrevista
        </Link>
      </main>
    );
  }

  return <Propuesta datos={datos} />;
}
