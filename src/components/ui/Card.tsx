import type { HTMLAttributes } from "react";

/**
 * El bloque de la marca: `#171A1C` sobre el grafito del fondo.
 *
 * Sobre grafito una sombra no separa nada —oscurecer lo oscuro no se ve—, así
 * que la tarjeta se despega con un filo de luz de un píxel arriba y un contorno
 * apenas visible. Es la misma lógica de las tarjetas del manual.
 */
export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/8 bg-neutral-900 shadow-soft ${className}`}
      {...rest}
    />
  );
}
