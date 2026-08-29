"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useMovimientoEscena } from "./useMovimientoEscena";
import { SALIDA } from "@/lib/movimiento";

/**
 * Franja de escena con movimiento cinematográfico.
 *
 * El movimiento sigue tres reglas, todas resueltas escribiendo variables CSS en
 * un rAF en vez de re-renderizar React (así el scroll no se traba):
 *
 * 1. Parallax de puntero — la foto deriva unos pocos píxeles siguiendo el mouse,
 *    con un lerp de 0.12 que le da la inercia. Nunca es un seguimiento directo.
 * 2. Scrub de scroll — a medida que la franja sale del viewport la foto sube,
 *    se oscurece y se desenfoca, en vez de limitarse a desaparecer del borde.
 * 3. Corte entre escenas — al cambiar de paso la foto nueva entra desde una
 *    escala mayor y desenfocada, y la vieja sale hacia atrás. Es el corte que
 *    hace que cambiar de tema se sienta como un cambio de plano.
 *
 * Con `prefers-reduced-motion` se apagan 1 y 2, y 3 queda en un fundido simple.
 */
export function EscenaCinematica({
  src,
  brillo = 1,
  kicker,
  titulo,
  claveEscena,
  barra,
  className = "",
  sizes = "(max-width: 768px) 100vw, 768px",
}: {
  /** Foto de fondo — normalmente sale de `escenaDePaso()`. */
  src: string;
  /** Corrección de exposición de esta foto, para emparejarla con el resto del set. */
  brillo?: number;
  /** Línea corta arriba del título. */
  kicker: ReactNode;
  /** Título grande de la escena. */
  titulo: string;
  /** Cambia cuando cambia la escena; dispara el corte de plano. */
  claveEscena: string;
  /** Contenido de la fila superior (volver, estado de guardado). */
  barra?: ReactNode;
  className?: string;
  /** Ancho real de la franja, para que Next pida la foto al tamaño justo. */
  sizes?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useMovimientoEscena(contenedor, reduceMotion);

  // El contenido del paso entra en 240ms (ver EntrevistaWizard). La foto es
  // mucho más grande y puede permitirse algo más de recorrido, pero no el triple:
  // pasado ese punto deja de leerse como el mismo gesto y se lee como dos.
  const corte = { duration: 0.36, ease: SALIDA };

  return (
    <div
      ref={contenedor}
      className={`escena-cinematica relative overflow-hidden isolate bg-neutral-950 ${className}`}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={claveEscena}
          className="escena-capa absolute inset-0"
          style={{ "--escena-exposicion": brillo } as React.CSSProperties}
          // La cadena `transform` completa va a la placa de video; el atajo
          // `scale` de motion corre en el hilo principal. Y el desenfoque se
          // mantiene bajo a propósito: es el efecto más caro que existe y acá
          // va sobre el elemento más grande de la pantalla.
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, transform: "scale(1.14)", filter: "blur(8px) brightness(0.6)" }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, transform: "scale(1)", filter: "blur(0px) brightness(1)" }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, transform: "scale(1.06)", filter: "blur(6px) brightness(0.5)" }
          }
          transition={corte}
        >
          <Image src={src} alt="" fill priority sizes={sizes} className="object-cover" />
        </motion.div>
      </AnimatePresence>

      {/* Velo base: garantiza el contraste del texto sobre cualquier foto. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/55 to-neutral-950/20" />
      {/* Velo de scrub: oscurece la escena a medida que sale de pantalla. */}
      <div className="escena-velo pointer-events-none absolute inset-0 bg-neutral-950" />

      <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
        {/* La sombra sostiene la lectura cuando arriba de la foto toca una zona clara. */}
        {barra ? (
          <div className="flex items-center justify-between [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">
            {barra}
          </div>
        ) : (
          <div />
        )}
        <div>
          <span className="text-xs font-medium tracking-[0.2em] text-neutral-300 uppercase">
            {kicker}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={claveEscena}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.34, ease: [0.23, 1, 0.32, 1] }}
              className="font-display text-3xl font-extralight tracking-[-0.03em] text-white sm:text-4xl"
            >
              {titulo}
            </motion.h1>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
