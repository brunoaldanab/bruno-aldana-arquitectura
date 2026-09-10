// src/app/contactos/[id]/relevamiento/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { relevamientoSchema, type Relevamiento } from "@/lib/relevamiento/formato";

/**
 * Sube el relevamiento del teléfono. Lo del teléfono siempre se guarda: si el
 * servidor tenía una versión más nueva que la que el teléfono conocía, se guarda
 * igual y se devuelve `conflicto: true` para que la pantalla lo avise.
 */
export async function guardarRelevamiento(
  contactoId: string,
  data: Relevamiento,
  versionBase: number,
): Promise<{ version: number; conflicto: boolean }> {
  const json = relevamientoSchema.parse(data) as unknown as Prisma.InputJsonValue;
  const actual = await prisma.relevamiento.findUnique({ where: { contactoId }, select: { version: true } });

  if (!actual) {
    const creado = await prisma.relevamiento.create({ data: { contactoId, data: json } });
    return { version: creado.version, conflicto: false };
  }

  const guardado = await prisma.relevamiento.update({
    where: { contactoId },
    data: { data: json, version: { increment: 1 } },
  });
  return { version: guardado.version, conflicto: actual.version !== versionBase };
}
