"use client";

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
        velo="bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-neutral-950/20"
      >
        {/* La firma se apoya arriba a la izquierda, que es la zona tranquila de
            la foto. El manual pide justamente eso: la marca va sobre la parte
            sin detalle de la imagen, nunca encerrada en un recuadro. */}
        <div className="flex h-full flex-col justify-between p-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/firma-horizontal-blanco.svg"
            alt="Bruno Aldana · Arquitectura"
            width={184}
            height={38}
            className="h-[38px] w-auto"
          />
          <p className="max-w-sm font-display text-3xl font-extralight tracking-[-0.03em] text-neutral-100 [text-shadow:0_2px_18px_rgba(0,0,0,0.5)]">
            Cada entrevista, cada cotización, cada proyecto — en un solo lugar.
          </p>
        </div>
      </FondoCinematico>

      <div className="flex items-center justify-center bg-neutral-950 px-4 py-16">
        <form action={formAction} className="w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/firma-horizontal-blanco.svg"
            alt="Bruno Aldana · Arquitectura"
            width={135}
            height={28}
            className="mb-10 h-[28px] w-auto lg:hidden"
          />
          <span className="rotulo mb-4 block text-neutral-500">Acceso al estudio</span>
          <h1 className="font-display mb-2 text-4xl font-extralight tracking-[-0.03em] text-neutral-100">
            Ingresar
          </h1>
          <p className="mb-10 text-sm text-neutral-500">Con su cuenta de administrador.</p>

          <label className="mb-4 block">
            <span className={labelClass}>Email</span>
            <input type="email" name="email" required autoComplete="username" className={inputClass} />
          </label>

          <label className="mb-8 block">
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
