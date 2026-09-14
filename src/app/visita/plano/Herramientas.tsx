// src/app/visita/plano/Herramientas.tsx
import { HERRAMIENTAS, type Herramienta, type Modo } from "@/lib/plano/herramientas";

const NOMBRE: Record<Herramienta, string> = {
  tocar: "Tocar",
  muro: "Muro",
  puerta: "Puerta",
  ventana: "Ventana",
  vano: "Vano",
  columna: "Columna",
  electrico: "Enchufe",
  zona: "Zona",
  bandeja: "Bandeja",
  dibujar: "A dedo",
  moldura: "Moldura",
  viga: "Viga",
};

const pastilla = (activa: boolean) =>
  `rotulo rounded-full px-2.5 py-2.5 disabled:opacity-35 ${activa ? "bg-neutral-100 text-neutral-950" : "bg-white/[0.07] text-neutral-100"}`;

export function Herramientas({
  modo,
  herramienta,
  onHerramienta,
  trazoActivo,
  onTerminar,
  puedeDeshacer,
  puedeRehacer,
  onDeshacer,
  onRehacer,
  onCentrar,
  cotas,
  onCotas,
  recto,
  onRecto,
  onEnderezar,
}: {
  modo: Modo;
  herramienta: Herramienta;
  onHerramienta: (h: Herramienta) => void;
  trazoActivo: boolean;
  onTerminar: () => void;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  onDeshacer: () => void;
  onRehacer: () => void;
  onCentrar: () => void;
  cotas: boolean;
  onCotas: () => void;
  recto: boolean;
  onRecto: () => void;
  onEnderezar: () => void;
}) {
  return (
    <nav aria-label="Herramientas" className="flex flex-wrap justify-center gap-1.5 border-t border-white/10 px-3 pt-3 pb-[max(1.1rem,env(safe-area-inset-bottom))]">
      {HERRAMIENTAS[modo].map((h) => (
        <button key={h} type="button" aria-pressed={h === herramienta} onClick={() => onHerramienta(h)} className={pastilla(h === herramienta)}>
          {NOMBRE[h]}
        </button>
      ))}
      {trazoActivo && (
        <button type="button" onClick={onTerminar} className={pastilla(false)}>
          Terminar
        </button>
      )}
      <button type="button" aria-label="Deshacer" disabled={!puedeDeshacer} onClick={onDeshacer} className={pastilla(false)}>↶</button>
      <button type="button" aria-label="Rehacer" disabled={!puedeRehacer} onClick={onRehacer} className={pastilla(false)}>↷</button>
      <button type="button" aria-label="Centrar el plano" onClick={onCentrar} className={pastilla(false)}>Centrar</button>
      <button type="button" aria-pressed={recto} onClick={onRecto} className={pastilla(recto)}>
        Recto
      </button>
      {modo === "planta" && (
        <button type="button" onClick={onEnderezar} className={pastilla(false)}>
          Enderezar
        </button>
      )}
      <button type="button" aria-pressed={cotas} onClick={onCotas} className={pastilla(cotas)}>
        Cotas
      </button>
    </nav>
  );
}
