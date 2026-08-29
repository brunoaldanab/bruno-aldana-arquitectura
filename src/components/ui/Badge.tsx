import type { ReactNode } from "react";

type Tone = "neutral" | "info" | "success" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-600",
  info: "bg-info-50 text-info-700",
  success: "bg-success-50 text-success-700",
  danger: "bg-danger-50 text-danger-700",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}
