"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { GaleriaTipo } from "@/lib/entrevista/galeria";

export async function addGaleriaFoto(tipo: GaleriaTipo, cardKey: string, dataUrl: string) {
  const count = await prisma.galeriaFoto.count({ where: { tipo, cardKey } });
  const foto = await prisma.galeriaFoto.create({
    data: { tipo, cardKey, dataUrl, orden: count },
  });
  return { id: foto.id, cardKey: foto.cardKey, dataUrl: foto.dataUrl, orden: foto.orden };
}

export async function removeGaleriaFoto(fotoId: string) {
  await prisma.galeriaFoto.delete({ where: { id: fotoId } });
}

export async function addGaleriaCardCustom(tipo: GaleriaTipo, titulo: string) {
  const key = "custom-" + Date.now();
  const facts = [
    { k: "De qué se trata", v: "Definilo con tus propias palabras durante la reunión." },
    { k: "Materiales típicos", v: "—" },
    { k: "Ideal para", v: "—" },
    { k: "Cuidado con", v: "—" },
  ];
  const card = await prisma.galeriaCardCustom.create({
    data: { tipo, key, titulo, mood: "Personalizado", descripcion: "Agregado por el estudio", facts: facts as unknown as Prisma.InputJsonValue },
  });
  return {
    id: card.id,
    key: card.key,
    titulo: card.titulo,
    mood: card.mood,
    descripcion: card.descripcion,
    facts: card.facts as unknown as { k: string; v: string }[],
  };
}

export async function removeGaleriaCardCustom(tipo: GaleriaTipo, key: string) {
  await prisma.$transaction([
    prisma.galeriaFoto.deleteMany({ where: { tipo, cardKey: key } }),
    prisma.galeriaCardCustom.delete({ where: { key } }),
  ]);
}

export async function addPaletaOficinaFoto(comboKey: string, dataUrl: string) {
  const count = await prisma.paletaOficinaFoto.count({ where: { comboKey } });
  const foto = await prisma.paletaOficinaFoto.create({ data: { comboKey, dataUrl, orden: count } });
  return { id: foto.id, comboKey: foto.comboKey, dataUrl: foto.dataUrl, orden: foto.orden };
}

export async function removePaletaOficinaFoto(fotoId: string) {
  await prisma.paletaOficinaFoto.delete({ where: { id: fotoId } });
}

export async function addPaletaOficinaCustom(nombre: string) {
  const key = "custom-palette-" + Date.now();
  const combo = await prisma.paletaOficinaCustom.create({
    data: { key, nombre, colores: [] as unknown as Prisma.InputJsonValue, uso: "" },
  });
  return { id: combo.id, key: combo.key, nombre: combo.nombre, colores: [] as { n: string; h: string }[], uso: combo.uso };
}

export async function removePaletaOficinaCustom(key: string) {
  await prisma.$transaction([
    prisma.paletaOficinaFoto.deleteMany({ where: { comboKey: key } }),
    prisma.paletaOficinaCustom.delete({ where: { key } }),
  ]);
}

export async function setPaletaOficinaCustomColor(key: string, index: number, nombre: string, hex: string) {
  const combo = await prisma.paletaOficinaCustom.findUnique({ where: { key } });
  if (!combo) return null;
  const colores = (combo.colores as unknown as { n: string; h: string }[]).slice();
  colores[index] = { n: nombre, h: hex };
  const updated = await prisma.paletaOficinaCustom.update({
    where: { key },
    data: { colores: colores as unknown as Prisma.InputJsonValue },
  });
  return { id: updated.id, key: updated.key, nombre: updated.nombre, colores, uso: updated.uso };
}
