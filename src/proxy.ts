import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Quedan fuera del login: la página de visita y el service worker, que no tienen
  // datos y tienen que abrir sin señal; el manifiesto, para instalar la app; y la
  // API de visita, que verifica la sesión por su cuenta (src/lib/sesionApi.ts).
  matcher: ["/((?!login|visita|api/visita|sw\\.js|manifest\\.webmanifest|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)"],
};
