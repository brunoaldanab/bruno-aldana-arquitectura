"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const contactoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  telefono: z.string().trim().optional(),
  email: z.string().trim().email("Email inválido.").optional().or(z.literal("")),
  direccionProyecto: z.string().trim().optional(),
  notas: z.string().trim().optional(),
  origen: z.string().trim().optional(),
});

export type ContactoFormState = { error: string } | undefined;

function parseForm(formData: FormData) {
  return contactoSchema.safeParse({
    nombre: formData.get("nombre"),
    telefono: formData.get("telefono") || undefined,
    email: formData.get("email") || undefined,
    direccionProyecto: formData.get("direccionProyecto") || undefined,
    notas: formData.get("notas") || undefined,
    origen: formData.get("origen") || undefined,
  });
}

export async function createContacto(
  _prevState: ContactoFormState,
  formData: FormData
): Promise<ContactoFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const contacto = await prisma.contacto.create({
    data: { ...parsed.data, email: parsed.data.email || null },
  });

  revalidatePath("/contactos");
  redirect(`/contactos/${contacto.id}`);
}

export async function updateContacto(
  id: string,
  _prevState: ContactoFormState,
  formData: FormData
): Promise<ContactoFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  await prisma.contacto.update({
    where: { id },
    data: { ...parsed.data, email: parsed.data.email || null },
  });

  revalidatePath("/contactos");
  revalidatePath(`/contactos/${id}`);
  redirect(`/contactos/${id}`);
}
