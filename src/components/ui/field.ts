/**
 * Campos de formulario del sistema.
 *
 * La entrevista se completa con el cliente sentado al lado, muchas veces en una
 * notebook apoyada en una mesa. Por eso los campos no son la cajita de 14px con
 * borde gris de siempre: el texto es de 16px (además evita que el navegador
 * haga zoom al enfocar en móvil) y la superficie es un hundido suave en vez de
 * un contorno, que a la distancia se lee mejor y ensucia menos la pantalla.
 *
 * Las transiciones nombran sus propiedades: `transition: all` anima cosas que
 * uno no pidió y termina costando cuadros.
 */
export const inputClass =
  "w-full rounded-xl bg-neutral-900/[0.045] px-4 py-3 text-base text-neutral-900 outline-none transition-[background-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] placeholder:text-neutral-400 hover:bg-neutral-900/[0.07] focus:bg-white focus:shadow-[0_0_0_2px_var(--color-neutral-900)]";

/** Etiqueta corta y en versalitas: ordena sin competir con el valor. */
export const labelClass =
  "mb-2 block text-[11px] font-medium tracking-[0.08em] text-neutral-500 uppercase";

export const errorClass = "rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700";
