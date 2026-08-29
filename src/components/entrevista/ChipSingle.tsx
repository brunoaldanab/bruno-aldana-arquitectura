"use client";

/**
 * Elegir una opción entre varias.
 *
 * Deja de ser una pastilla con borde: la opción sin elegir es una superficie
 * apenas hundida, y la elegida se rellena en negro. El contraste entre las dos
 * es mucho más fuerte que un borde de color, que es lo que hace falta cuando el
 * cliente está mirando la pantalla desde el otro lado de la mesa.
 *
 * La respuesta al toque vive en `:active` y no en el click: el botón tiene que
 * acusar recibo en el momento en que se aprieta, no cuando se suelta.
 */
export function ChipSingle({
  options,
  value,
  onChange,
  small,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  small?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`chip ${small ? "px-3.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm"} ${
            value === o ? "chip-activo" : ""
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
