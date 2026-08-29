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

  // Solo se traen las fotos de estilo: son las únicas que el documento usa (la
  // portada). Las de mobiliario y paleta pesan megas en base64 y el resumen las
  // nombra por texto, así que traerlas sería mandar el peso al navegador para nada.
  const [estiloFotos, estiloCustom, mobiliarioCustom, paletaOficinaCustom] = await Promise.all([
    prisma.galeriaFoto.findMany({ where: { tipo: "ESTILO" }, orderBy: { orden: "asc" } }),
    prisma.galeriaCardCustom.findMany({ where: { tipo: "ESTILO" }, orderBy: { createdAt: "asc" } }),
    prisma.galeriaCardCustom.findMany({ where: { tipo: "MOBILIARIO" }, orderBy: { createdAt: "asc" } }),
    prisma.paletaOficinaCustom.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const aCard = (c: { id: string; key: string; titulo: string; mood: string; descripcion: string; facts: unknown }) => ({
    id: c.id,
    key: c.key,
    titulo: c.titulo,
    mood: c.mood,
    descripcion: c.descripcion,
    facts: c.facts as { k: string; v: string }[],
  });

  const galeria: GaleriaData = {
    estiloFotos: estiloFotos.map((f) => ({ id: f.id, cardKey: f.cardKey, dataUrl: f.dataUrl, orden: f.orden })),
    estiloCustom: estiloCustom.map(aCard),
    mobiliarioFotos: [],
    mobiliarioCustom: mobiliarioCustom.map(aCard),
    paletaOficinaFotos: [],
    paletaOficinaCustom: paletaOficinaCustom.map((c) => ({
      id: c.id,
      key: c.key,
      nombre: c.nombre,
      colores: c.colores as { n: string; h: string }[],
      uso: c.uso,
    })),
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
        <span className="rotulo mb-4 block text-neutral-600">Propuesta incompleta</span>
        <h1 className="font-display mb-4 text-4xl font-extralight tracking-[-0.03em] text-neutral-100">
          Falta la superficie
        </h1>
        <p className="mb-8 text-sm text-neutral-500">
          Para calcular el precio hace falta cargar los metros cuadrados en el paso de
          Datos generales de la entrevista.
        </p>
        <Link
          href={`/contactos/${id}/entrevista`}
          className="inline-flex rounded-full bg-neutral-100 px-5 py-2.5 text-sm text-neutral-950 transition-colors duration-150 hover:bg-white"
        >
          Ir a la entrevista
        </Link>
      </main>
    );
  }

  return <Propuesta datos={datos} state={state} galeria={galeria} />;
}
