// src/app/visita/plano/Segmentado.tsx

/** Selector de pastillas: la opción elegida es el único bloque claro, como pide la marca. */
export function Segmentado<T extends string>({
  opciones,
  valor,
  onCambio,
  etiqueta,
}: {
  opciones: { valor: T; texto: string }[];
  valor: T | null;
  onCambio: (v: T) => void;
  etiqueta: string;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex flex-wrap gap-0.5 self-start rounded-full bg-white/[0.07] p-[3px]">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          onClick={() => onCambio(o.valor)}
          className={`rotulo rounded-full px-3 py-1.5 ${o.valor === valor ? "bg-neutral-100 text-neutral-950" : "text-neutral-400"}`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
