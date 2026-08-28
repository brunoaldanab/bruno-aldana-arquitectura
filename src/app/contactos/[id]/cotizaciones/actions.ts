"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const cotizacionSchema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio."),
  montoTotal: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), "El monto tiene que ser un número."),
  moneda: z.enum(["BOB", "USD"]),
  estado: z.enum(["BORRADOR", "ENVIADA", "APROBADA", "RECHAZADA"]),
  notas: z.string().trim().optional(),
});

export type CotizacionFormState = { error: string } | undefined;

function parseForm(formData: FormData) {
  return cotizacionSchema.safeParse({
    titulo: formData.get("titulo"),
    montoTotal: formData.get("montoTotal") || undefined,
    moneda: formData.get("moneda"),
    estado: formData.get("estado"),
    notas: formData.get("notas") || undefined,
  });
}

export async function createCotizacion(
  contactoId: string,
  _prevState: CotizacionFormState,
  formData: FormData
): Promise<CotizacionFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const enviadaOdecidida = parsed.data.estado !== "BORRADOR" ? new Date() : undefined;

  const cotizacion = await prisma.cotizacion.create({
    data: {
      contactoId,
      titulo: parsed.data.titulo,
      montoTotal: parsed.data.montoTotal ?? null,
      moneda: parsed.data.moneda,
      estado: parsed.data.estado,
      notas: parsed.data.notas,
      sentAt: parsed.data.estado === "ENVIADA" ? enviadaOdecidida : undefined,
      decidedAt:
        parsed.data.estado === "APROBADA" || parsed.data.estado === "RECHAZADA"
          ? enviadaOdecidida
          : undefined,
    },
  });

  revalidatePath(`/contactos/${contactoId}`);
  redirect(`/contactos/${contactoId}/cotizaciones/${cotizacion.id}`);
}

export async function updateCotizacion(
  contactoId: string,
  cotizacionId: string,
  _prevState: CotizacionFormState,
  formData: FormData
): Promise<CotizacionFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const existing = await prisma.cotizacion.findUnique({ where: { id: cotizacionId } });
  if (!existing || existing.contactoId !== contactoId) {
    return { error: "La cotización ya no existe." };
  }

  const now = new Date();
  const sentAt = parsed.data.estado === "ENVIADA" && !existing.sentAt ? now : existing.sentAt;
  const decidedAt =
    (parsed.data.estado === "APROBADA" || parsed.data.estado === "RECHAZADA") && !existing.decidedAt
      ? now
      : existing.decidedAt;

  await prisma.cotizacion.update({
    where: { id: cotizacionId },
    data: {
      titulo: parsed.data.titulo,
      montoTotal: parsed.data.montoTotal ?? null,
      moneda: parsed.data.moneda,
      estado: parsed.data.estado,
      notas: parsed.data.notas,
      sentAt,
      decidedAt,
    },
  });

  revalidatePath(`/contactos/${contactoId}`);
  revalidatePath(`/contactos/${contactoId}/cotizaciones/${cotizacionId}`);
  redirect(`/contactos/${contactoId}/cotizaciones/${cotizacionId}`);
}
