import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-rise-in flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-14 text-center">
      {icon && <div className="text-neutral-600">{icon}</div>}
      <p className="font-display text-xl font-extralight text-neutral-100">{title}</p>
      {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
