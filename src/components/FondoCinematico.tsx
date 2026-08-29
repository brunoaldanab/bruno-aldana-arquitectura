"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useMovimientoEscena } from "./useMovimientoEscena";

/**
 * Fondo de pantalla completa con el mismo tratamiento que las escenas de la
 * entrevista: grado negro/plomo, parallax de puntero y scrub de scroll.
 *
 * La diferencia con `EscenaCinematica` es la forma, no el sistema: acá no hay
 * corte entre planos porque la foto es fija, así que la capa entra una sola vez
 * con un fundido y una apertura de escala. El contenido va como `children`, por
 * encima del velo.
 */
export function FondoCinematico({
  src,
  brillo = 1,
  alt = "",
  children,
  className = "",
  sizes = "100vw",
  velo = "bg-gradient-to-t from-neutral-950/95 via-neutral-950/70 to-neutral-950/45",
}: {
  /** Foto de fondo — sale de `images.homeBackground` / `images.loginBackground`. */
  src: string;
  /** Corrección de exposición, para que pese igual que el resto del sistema. */
  brillo?: number;
  alt?: string;
  children?: ReactNode;
  className?: string;
  sizes?: string;
  /** Degradado sobre la foto que sostiene el contraste del texto. */
  velo?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  useMovimientoEscena(contenedor, reduceMotion);

  return (
    <div
      ref={contenedor}
      className={`escena-cinematica relative isolate overflow-hidden bg-neutral-950 ${className}`}
    >
      <motion.div
        className="escena-capa absolute inset-0"
        style={{ "--escena-exposicion": brillo } as React.CSSProperties}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image src={src} alt={alt} fill priority sizes={sizes} className="object-cover" />
      </motion.div>

      <div className={`pointer-events-none absolute inset-0 ${velo}`} />
      <div className="escena-velo pointer-events-none absolute inset-0 bg-neutral-950" />

      <div className="relative h-full">{children}</div>
    </div>
  );
}
