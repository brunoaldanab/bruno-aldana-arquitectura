// src/app/api/visita/subir/route.ts
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { respuestaSinSesion, sesionDePedido } from "@/lib/sesionApi";
import { operacionSchema, type ContactoVisita } from "@/lib/visita/contactos";
import { aContactoVisita } from "@/lib/visita/servidor";

const cuerpoSchema = z.object({ operaciones: z.array(operacionSchema).max(500) });

/**
 * Cada operación es idempotente por id: si el teléfono reintenta porque se cortó la
 * señal a mitad de camino, el contacto se actualiza en lugar de duplicarse.
 */
export async function POST(request: NextRequest) {
  if (!(await sesionDePedido(request))) return respuestaSinSesion();

  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: "formato-invalido" }, { status: 400 });

  const contactos: ContactoVisita[] = [];
  for (const { contacto } of cuerpo.data.operaciones) {
    const { id, createdAt, updatedAt: _descartada, ...campos } = contacto;
    const fila = await prisma.contacto.upsert({
      where: { id },
      create: { id, ...campos, createdAt: new Date(createdAt) },
      update: campos,
    });
    contactos.push(aContactoVisita(fila));
  }
  return Response.json({ contactos }, { headers: { "Cache-Control": "no-store" } });
}
