"use client";

import { useEffect, type RefObject } from "react";

/**
 * Motor de movimiento compartido por todas las escenas del sistema.
 *
 * Escribe variables CSS en el nodo dado desde un `requestAnimationFrame`, sin
 * re-renderizar React — por eso el scroll no se traba por más capas que haya.
 * El CSS de `globals.css` es el que las consume.
 *
 * Dos reglas:
 *
 * 1. Parallax de puntero — la foto deriva unos pocos píxeles siguiendo el mouse,
 *    con un lerp de 0.12 que le da la inercia. Nunca es un seguimiento directo.
 * 2. Scrub de scroll — a medida que la escena sale del viewport la foto sube, se
 *    oscurece y se desenfoca, en vez de limitarse a desaparecer del borde.
 *
 * Con `prefers-reduced-motion` no se engancha nada y las variables quedan en sus
 * valores neutros, así que la escena se ve quieta pero conserva el grado.
 */
export function useMovimientoEscena(
  contenedor: RefObject<HTMLElement | null>,
  reduceMotion: boolean | null
) {
  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo || reduceMotion) return;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrub = 0;
    let targetScrub = 0;
    let pendiente = false;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

    /** Cuánto de la escena ya salió por arriba del viewport: 0 entera, 1 fuera. */
    function progresoDeSalida() {
      const r = nodo!.getBoundingClientRect();
      return clamp(-r.top / Math.max(r.height, 1));
    }

    function frame() {
      pendiente = false;

      targetScrub = progresoDeSalida();
      scrub = lerp(scrub, targetScrub, 0.14);
      if (Math.abs(scrub - targetScrub) < 0.001) scrub = targetScrub;

      mouseX = lerp(mouseX, targetMouseX, 0.12);
      mouseY = lerp(mouseY, targetMouseY, 0.12);

      nodo!.style.setProperty("--mx", mouseX.toFixed(4));
      nodo!.style.setProperty("--my", mouseY.toFixed(4));
      nodo!.style.setProperty("--escena-y", `${scrub * -38}px`);
      nodo!.style.setProperty("--escena-blur", `${scrub * 7}px`);
      nodo!.style.setProperty("--escena-brillo", `${1 - scrub * 0.32}`);
      nodo!.style.setProperty("--escena-velo", `${scrub * 0.45}`);

      if (
        Math.abs(scrub - targetScrub) > 0.001 ||
        Math.abs(mouseX - targetMouseX) > 0.001 ||
        Math.abs(mouseY - targetMouseY) > 0.001
      ) {
        pedirFrame();
      }
    }

    function pedirFrame() {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(frame);
    }

    function onPointerMove(e: PointerEvent) {
      targetMouseX = e.clientX / window.innerWidth - 0.5;
      targetMouseY = e.clientY / window.innerHeight - 0.5;
      pedirFrame();
    }

    window.addEventListener("scroll", pedirFrame, { passive: true });
    window.addEventListener("resize", pedirFrame);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    pedirFrame();

    return () => {
      window.removeEventListener("scroll", pedirFrame);
      window.removeEventListener("resize", pedirFrame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [contenedor, reduceMotion]);
}
