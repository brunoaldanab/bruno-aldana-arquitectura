/**
 * Campos de formulario del sistema.
 *
 * La entrevista se completa con el cliente sentado al lado, muchas veces en una
 * notebook apoyada en una mesa. Por eso los campos no son la cajita de 14px con
 * borde gris de siempre: el texto es de 16px (además evita que el navegador
 * haga zoom al enfocar en móvil) y la superficie es un bloque levantado en vez
 * de un contorno, que a la distancia se lee mejor y ensucia menos la pantalla.
 *
 * Sobre grafito el hundido se invierte: lo que antes era tinta al 4% sobre
 * blanco ahora es luz al 6% sobre grafito. Al enfocar el campo sube un escalón
 * más de luz en lugar de ponerse blanco.
 *
 * Las transiciones nombran sus propiedades: `transition: all` anima cosas que
 * uno no pidió y termina costando cuadros.
 */
export const inputClass =
  "w-full rounded-xl bg-white/[0.06] px-4 py-3 text-base font-light text-neutral-100 outline-none transition-[background-color,box-shadow] duration-150 ease-[var(--ease-out)] placeholder:text-neutral-600 hover:bg-white/[0.09] focus:bg-white/[0.11] focus:shadow-[0_0_0_2px_var(--color-neutral-100)]";

/**
 * Etiqueta corta en JetBrains Mono: es un dato sobre el campo, no una frase.
 * La clase `rotulo` trae la fuente, el tamaño, las mayúsculas y el interletrado
 * del manual de una sola vez.
 */
export const labelClass = "rotulo mb-2 block text-neutral-500";

export const errorClass =
  "rounded-xl border border-danger-600/25 bg-danger-50 px-4 py-3 text-sm text-danger-700";
