// src/app/visita/VisitaApp.tsx
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { crearAlmacenIndexedDB, pedirPersistencia } from "@/lib/visita/almacen";
import { crearApiFetch } from "@/lib/visita/api";
import type { ContactoLocal } from "@/lib/visita/contactos";
import { leerRuta, rutaAUrl, type Ruta } from "@/lib/visita/navegacion";
import { crearSincronizadorVisita, type EstadoSync } from "@/lib/visita/sincronizador";
import { FichaContacto } from "./FichaContacto";
import { FormularioContacto } from "./FormularioContacto";
import { IndicadorSync } from "./IndicadorSync";
import { ListaContactos } from "./ListaContactos";
import { PantallaPlano } from "./plano/PantallaPlano";

const REINTENTO_MS = 60_000;

function suscribirDireccion(avisar: () => void) {
  window.addEventListener("popstate", avisar);
  return () => window.removeEventListener("popstate", avisar);
}

function ir(ruta: Ruta) {
  window.history.pushState(null, "", rutaAUrl(ruta));
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

export function VisitaApp() {
  const search = useSyncExternalStore(suscribirDireccion, () => window.location.search, () => null);
  const ruta = search === null ? null : leerRuta(search);
  const [contactos, setContactos] = useState<ContactoLocal[] | null>(null);
  const [estado, setEstado] = useState<EstadoSync | null>(null);
  // Cuántas veces bajó del servidor una versión nueva del relevamiento de cada contacto.
  const [recargas, setRecargas] = useState<Record<string, number>>({});
  const [sinc] = useState(() =>
    crearSincronizadorVisita({
      almacen: crearAlmacenIndexedDB(),
      api: crearApiFetch(),
      alCambiarEstado: setEstado,
      alCambiarContactos: setContactos,
      alCambiarRelevamientos: (ids) =>
        setRecargas((previas) => Object.fromEntries([...Object.entries(previas), ...ids.map((id) => [id, (previas[id] ?? 0) + 1])])),
    }),
  );

  useEffect(() => {
    void pedirPersistencia();
    void sinc.iniciar();
    // En la app instalada de iOS el evento "online" no siempre llega: por eso también
    // se reintenta al volver a la app y cada minuto.
    const reintentar = () => void sinc.sincronizar();
    const alVolver = () => {
      if (document.visibilityState === "visible") reintentar();
    };
    window.addEventListener("online", reintentar);
    document.addEventListener("visibilitychange", alVolver);
    const intervalo = window.setInterval(reintentar, REINTENTO_MS);
    return () => {
      window.removeEventListener("online", reintentar);
      document.removeEventListener("visibilitychange", alVolver);
      window.clearInterval(intervalo);
    };
  }, [sinc]);

  const contacto = ruta && "id" in ruta ? contactos?.find((c) => c.id === ruta.id) : undefined;

  // El plano ocupa la pantalla entera: no lleva el encabezado de la visita.
  if (ruta?.vista === "relevamiento" && contacto) {
    return (
      <PantallaPlano
        contacto={contacto}
        sinc={sinc}
        estado={estado}
        recarga={recargas[contacto.id] ?? 0}
        onVolver={() => ir({ vista: "contacto", id: contacto.id })}
      />
    );
  }

  let contenido: React.ReactNode;
  if (ruta === null || contactos === null) {
    contenido = <p className="text-sm text-neutral-500">Abriendo…</p>;
  } else if (ruta.vista === "contactos") {
    contenido = <ListaContactos contactos={contactos} onAbrir={(id) => ir({ vista: "contacto", id })} onNuevo={() => ir({ vista: "nuevo" })} />;
  } else if (ruta.vista === "nuevo") {
    contenido = (
      <FormularioContacto
        titulo="Nuevo cliente"
        etiquetaGuardar="Crear cliente"
        onGuardar={async (c) => {
          await sinc.guardarContacto(c);
          ir({ vista: "contacto", id: c.id });
        }}
        onCancelar={() => ir({ vista: "contactos" })}
      />
    );
  } else if (!contacto) {
    contenido = (
      <section className="flex flex-col items-start gap-4">
        <h1 className="font-display text-3xl font-extralight tracking-[-0.03em] text-neutral-100">Este cliente no está en el teléfono</h1>
        <p className="text-sm text-neutral-500">Puede que todavía no haya bajado del servidor. Con señal aparece solo.</p>
        <Button size="sm" onClick={() => ir({ vista: "contactos" })}>Ver contactos</Button>
      </section>
    );
  } else if (ruta.vista === "editar") {
    contenido = (
      <FormularioContacto
        contacto={contacto}
        titulo="Editar cliente"
        etiquetaGuardar="Guardar cambios"
        onGuardar={async (c) => {
          await sinc.guardarContacto(c);
          ir({ vista: "contacto", id: c.id });
        }}
        onCancelar={() => ir({ vista: "contacto", id: contacto.id })}
      />
    );
  } else {
    contenido = (
      <FichaContacto
        contacto={contacto}
        onEditar={() => ir({ vista: "editar", id: contacto.id })}
        onRelevamiento={() => ir({ vista: "relevamiento", id: contacto.id })}
        onVolver={() => ir({ vista: "contactos" })}
      />
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-950">
      <header className="border-b border-white/8">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/firma-horizontal-blanco.svg" alt="Bruno Aldana · Arquitectura" width={126} height={26} className="h-[26px] w-auto" />
          <IndicadorSync estado={estado} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 py-8">{contenido}</main>
    </div>
  );
}
