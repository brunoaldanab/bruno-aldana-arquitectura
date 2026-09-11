// src/app/visita/plano/CampoMedida.tsx
"use client";

import { useState } from "react";
import { parsearMedida } from "@/lib/relevamiento/voz";

type Reconocedor = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function crearReconocedor(): Reconocedor | null {
  const w = window as unknown as { SpeechRecognition?: new () => Reconocedor; webkitSpeechRecognition?: new () => Reconocedor };
  const Clase = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Clase ? new Clase() : null;
}

/**
 * Una medida en centímetros: se escribe, se dicta o la escribe el láser en modo
 * teclado (que termina con Enter). `valor` es la medida tomada; si todavía no se
 * midió, el valor dibujado aparece como "≈ N" y el campo queda vacío.
 */
export function CampoMedida({
  id,
  etiqueta,
  valor,
  dibujado,
  onCambio,
  autoFocus = false,
}: {
  id: string;
  etiqueta: string;
  valor: number | null;
  dibujado?: number | null;
  onCambio: (cm: number | null) => void;
  autoFocus?: boolean;
}) {
  const [texto, setTexto] = useState(valor === null ? "" : String(valor));
  const [previo, setPrevio] = useState(valor);
  const [opciones, setOpciones] = useState<number[]>([]);
  const [aviso, setAviso] = useState("");
  const [escuchando, setEscuchando] = useState(false);

  // Deshacer o cargar desde otro lado cambia el valor: el campo lo acompaña.
  if (previo !== valor) {
    setPrevio(valor);
    setTexto(valor === null ? "" : String(valor));
  }

  function elegir(cm: number | null) {
    setTexto(cm === null ? "" : String(cm));
    setOpciones([]);
    setAviso("");
    // Salir del campo sin cambiar nada no es un cambio: no suma un paso al historial.
    if (cm !== valor) onCambio(cm);
  }

  function interpretar(dicho: string) {
    if (dicho.trim() === "") return elegir(null);
    const r = parsearMedida(dicho);
    if (r.tipo === "medida") return elegir(r.cm);
    if (r.tipo === "ambiguo") {
      setOpciones(r.opciones);
      setAviso(`«${dicho}» puede ser:`);
      return;
    }
    setAviso(`No entendí «${dicho}» como una medida`);
  }

  function dictar() {
    const rec = crearReconocedor();
    if (!rec) {
      setAviso("La voz no está disponible acá: usá el micrófono del teclado del iPhone");
      return;
    }
    rec.lang = "es-419";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => interpretar(e.results[0][0].transcript);
    rec.onerror = () => setAviso("No pude escuchar: probá de nuevo o usá el micrófono del teclado");
    rec.onend = () => setEscuchando(false);
    setEscuchando(true);
    rec.start();
  }

  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="rotulo text-neutral-500">{etiqueta}</label>
      <div className="flex gap-1.5">
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            autoFocus={autoFocus}
            value={texto}
            placeholder={dibujado != null ? `≈ ${dibujado}` : ""}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => interpretar(texto)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                interpretar(texto);
              }
            }}
            className="w-full rounded-xl bg-white/[0.07] py-2.5 pr-9 pl-3 font-mono text-base text-neutral-100 tabular-nums outline-none placeholder:text-neutral-500 focus:shadow-[0_0_0_1.5px_var(--color-neutral-100)]"
          />
          <span className="rotulo pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500">cm</span>
        </div>
        <button
          type="button"
          onClick={dictar}
          aria-label={`Dictar ${etiqueta}`}
          className={`rotulo shrink-0 rounded-xl px-2.5 ${escuchando ? "bg-neutral-100 text-neutral-950" : "bg-white/[0.07] text-neutral-200"}`}
        >
          {escuchando ? "Oigo" : "Dictar"}
        </button>
      </div>
      {aviso && <p className="text-sm text-neutral-400">{aviso}</p>}
      {opciones.length > 0 && (
        <div className="flex gap-2">
          {opciones.map((cm) => (
            <button key={cm} type="button" onClick={() => elegir(cm)} className="dato rounded-full bg-white/[0.07] px-4 py-2 text-neutral-100">
              {cm} cm
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
