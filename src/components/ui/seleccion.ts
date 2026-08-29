/*
 * El anillo que dice "esto está elegido".
 *
 * Vive acá y no suelto en cada paso porque el color correcto depende del fondo,
 * y el fondo cambió: con el papel claro anterior lo elegido se marcaba con un
 * anillo oscuro, pero sobre grafito ese mismo anillo es del color de la tarjeta
 * y desaparece. Escrito una sola vez, un cambio de fondo se corrige en un lugar.
 *
 * La jerarquía es al revés de lo que parece: en reposo el borde apenas se
 * insinúa, y lo elegido se enciende con la tinta clara de la marca.
 */

/** Borde de reposo: separa la tarjeta del fondo sin pedir atención. */
export const anilloReposo =
  "shadow-[0_0_0_1px_var(--color-neutral-800)] hover:shadow-[0_0_0_1px_var(--color-neutral-600)]";

/** Elegido: tinta clara, gruesa, imposible de confundir con el reposo. */
export const anilloElegido = "shadow-[0_0_0_3px_var(--color-neutral-100)]";

export function anilloSeleccion(activo: boolean) {
  return activo ? anilloElegido : anilloReposo;
}
