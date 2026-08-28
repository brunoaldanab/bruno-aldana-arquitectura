"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">Bruno Aldana Arquitectura</h1>
        <p className="mb-6 text-sm text-neutral-500">Ingresá con tu cuenta de administrador.</p>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="username"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Contraseña</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        {state?.error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
