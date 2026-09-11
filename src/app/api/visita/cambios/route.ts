// src/app/api/visita/cambios/route.ts
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { respuestaSinSesion, sesionDePedido } from "@/lib/sesionApi";
import { aContactoVisita, relevamientosV2 } from "@/lib/visita/servidor";

export async function GET(request: NextRequest) {
  if (!(await sesionDePedido(request))) return respuestaSinSesion();

  // La hora se toma antes de consultar: lo que cambie mientras tanto vuelve a bajar la próxima vez.
  const ahora = new Date();
  const desdeTexto = request.nextUrl.searchParams.get("desde");
  const desde = desdeTexto ? new Date(desdeTexto) : null;
  const filtro = desde && !Number.isNaN(desde.getTime()) ? { updatedAt: { gt: desde } } : {};

  const [filas, filasRelevamiento] = await Promise.all([
    prisma.contacto.findMany({ where: filtro, orderBy: { createdAt: "desc" } }),
    prisma.relevamiento.findMany({ where: filtro, select: { contactoId: true, data: true, version: true } }),
  ]);
  return Response.json(
    { contactos: filas.map(aContactoVisita), relevamientos: relevamientosV2(filasRelevamiento), ahora: ahora.toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
