"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "./actions";
import { inputClass, labelClass, errorClass } from "@/components/ui/field";
import { Button } from "@/components/ui/Button";
import { FondoCinematico } from "@/components/FondoCinematico";
import { fondos } from "@/lib/images";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <FondoCinematico
        src={fondos.login.src}
        brillo={fondos.login.brillo}
        alt="Interior de un proyecto del estudio"
        className="hidden lg:block"
        sizes="(min-width: 1024px) 50vw, 100vw"
        velo="bg-gradient-to-t from-neutral-950/85 via-neutral-950/30 to-neutral-950/15"
      >
        <div className="flex h-full flex-col justify-between p-10">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-md bg-neutral-950">
            <Image src="/logo-ab.png" alt="Bruno Aldana Arquitectura" width={44} height={44} className="h-full w-full object-cover" />
          </span>
          <p className="max-w-sm font-display text-2xl font-medium leading-snug text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]">
            Cada entrevista, cada cotización, cada proyecto — en un solo lugar.
          </p>
        </div>
      </FondoCinematico>

      <div className="flex items-center justify-center bg-neutral-50 px-4 py-16">
        <form action={formAction} className="w-full max-w-sm">
          <span className="mb-6 flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-neutral-900 lg:hidden">
            <Image src="/logo-ab.png" alt="Bruno Aldana Arquitectura" width={40} height={40} className="h-full w-full object-cover" />
          </span>
          <span className="mb-3 block text-xs font-medium tracking-[0.2em] text-neutral-500 uppercase">Estudio</span>
          <h1 className="font-display mb-1 text-3xl font-light tracking-tight text-neutral-900">Bruno Aldana</h1>
          <p className="mb-8 text-sm text-neutral-500">Ingresá con tu cuenta de administrador.</p>

          <label className="mb-4 block">
            <span className={labelClass}>Email</span>
            <input type="email" name="email" required autoComplete="username" className={inputClass} />
          </label>

          <label className="mb-6 block">
            <span className={labelClass}>Contraseña</span>
            <input type="password" name="password" required autoComplete="current-password" className={inputClass} />
          </label>

          {state?.error && <p className={`mb-4 ${errorClass}`}>{state.error}</p>}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
