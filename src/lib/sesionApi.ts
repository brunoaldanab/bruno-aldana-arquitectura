// src/lib/sesionApi.ts
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

/**
 * Las rutas de /api/visita quedan fuera del proxy: si el proxy las redirigiera al
 * login, el teléfono recibiría una página HTML en lugar de una respuesta que
 * entienda. Por eso cada ruta verifica la sesión por su cuenta.
 */
export async function sesionDePedido(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

export const respuestaSinSesion = () => Response.json({ error: "sin-sesion" }, { status: 401 });
