"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { EntrevistaState } from "@/lib/entrevista/types";

export async function saveEntrevista(entrevistaId: string, data: EntrevistaState) {
  await prisma.entrevista.update({
    where: { id: entrevistaId },
    data: { data: data as unknown as Prisma.InputJsonValue },
  });
}
