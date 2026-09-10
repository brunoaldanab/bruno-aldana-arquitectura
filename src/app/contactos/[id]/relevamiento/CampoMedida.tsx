// src/app/contactos/[id]/relevamiento/CampoMedida.tsx
"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/components/ui/field";
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

export function CampoMedida({
  id,
  etiqueta,
  valor,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  valor: number | null;
  onCambio: (cm: number | null) => void;
}) {
  const [texto, setTexto] = useState(valor === null ? "" : String(valor));
  const [opciones, setOpciones] = useState<number[]>([]);
  const [aviso, setAviso] = useState("");
  const [escuchando, setEscuchando] = useState(false);

  function elegir(cm: number | null) {
    setTexto(cm === null ? "" : String(cm));
    setOpciones([]);
    setAviso("");
    onCambio(cm);
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
    <div>
      <label htmlFor={id} className={labelClass}>{etiqueta}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => interpretar(texto)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                interpretar(texto);
              }
            }}
            className={`${inputClass} pr-12`}
          />
          <span className="dato pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-neutral-500">cm</span>
        </div>
        <button
          type="button"
          onClick={dictar}
          aria-label={`Dictar ${etiqueta}`}
          className={`rounded-xl px-4 text-sm transition-[background-color] duration-150 ${escuchando ? "bg-neutral-100 text-neutral-950" : "bg-white/[0.07] text-neutral-200 hover:bg-white/[0.12]"}`}
        >
          {escuchando ? "Escuchando" : "Dictar"}
        </button>
      </div>
      {aviso && <p className="mt-2 text-sm text-neutral-400">{aviso}</p>}
      {opciones.length > 0 && (
        <div className="mt-2 flex gap-2">
          {opciones.map((cm) => (
            <button key={cm} type="button" onClick={() => elegir(cm)} className="dato rounded-full bg-white/[0.07] px-4 py-2 text-neutral-100 hover:bg-white/[0.12]">
              {cm} cm
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
