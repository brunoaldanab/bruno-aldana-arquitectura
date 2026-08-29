import type { ReactNode } from "react";

type Tone = "neutral" | "info" | "success" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-white/[0.07] text-neutral-300",
  info: "bg-info-50 text-info-700",
  success: "bg-success-50 text-success-700",
  danger: "bg-danger-50 text-danger-700",
};

/**
 * El estado de una cotización es un dato, no una frase: va en JetBrains Mono,
 * chiquito y en mayúsculas, como todas las etiquetas del sistema.
 */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`rotulo inline-flex items-center rounded-full px-2.5 py-1.5 ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}
