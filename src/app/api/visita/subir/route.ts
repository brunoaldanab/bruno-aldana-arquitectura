// src/app/api/visita/subir/route.ts
import type { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { respuestaSinSesion, sesionDePedido } from "@/lib/sesionApi";
import { operacionSchema, type ContactoVisita } from "@/lib/visita/contactos";
import type { ResultadoRelevamiento } from "@/lib/visita/relevamientos";
import { aContactoVisita, hayConflicto, ordenarOperaciones } from "@/lib/visita/servidor";

const cuerpoSchema = z.object({ operaciones: z.array(operacionSchema).max(500) });

/**
 * Cada operación es idempotente por id: si el teléfono reintenta porque se cortó la
 * señal a mitad de camino, el contacto se actualiza en lugar de duplicarse. Primero
 * van todos los contactos: un relevamiento necesita que su cliente exista.
 */
export async function POST(request: NextRequest) {
  if (!(await sesionDePedido(request))) return respuestaSinSesion();

  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: "formato-invalido" }, { status: 400 });

  const contactos: ContactoVisita[] = [];
  const relevamientos: ResultadoRelevamiento[] = [];
  for (const op of ordenarOperaciones(cuerpo.data.operaciones)) {
    if (op.tipo === "contacto") {
      const { id, createdAt, updatedAt: _descartada, ...campos } = op.contacto;
      const fila = await prisma.contacto.upsert({
        where: { id },
        create: { id, ...campos, createdAt: new Date(createdAt) },
        update: campos,
      });
      contactos.push(aContactoVisita(fila));
      continue;
    }

    const { contactoId, versionBase } = op;
    // Un cliente que ya no existe en el servidor no puede recibir relevamiento: se omite
    // y el teléfono lo conserva como pendiente, en vez de trabar toda la cola.
    if (!(await prisma.contacto.findUnique({ where: { id: contactoId }, select: { id: true } }))) continue;
    const json = op.data as unknown as Prisma.InputJsonValue;
    const actual = await prisma.relevamiento.findUnique({ where: { contactoId }, select: { version: true } });
    const fila = actual
      ? await prisma.relevamiento.update({ where: { contactoId }, data: { data: json, version: { increment: 1 } } })
      : await prisma.relevamiento.create({ data: { contactoId, data: json } });
    relevamientos.push({ contactoId, version: fila.version, conflicto: hayConflicto(actual?.version ?? null, versionBase) });
  }
  return Response.json({ contactos, relevamientos }, { headers: { "Cache-Control": "no-store" } });
}
