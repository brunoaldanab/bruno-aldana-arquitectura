"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from "@/lib/session";
import { destinoSeguro } from "@/lib/destino";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { error: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Ingresá un email y una contraseña válidos." };
  }

  const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } });
  const passwordMatches = admin
    ? await bcrypt.compare(parsed.data.password, admin.passwordHash)
    : false;

  if (!admin || !passwordMatches) {
    return { error: "Email o contraseña incorrectos." };
  }

  const token = await createSessionToken(admin.id);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  redirect(destinoSeguro(formData.get("volver")));
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
