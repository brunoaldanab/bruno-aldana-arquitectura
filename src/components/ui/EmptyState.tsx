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
    <div className="animate-rise-in flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 px-6 py-12 text-center">
      {icon && <div className="text-neutral-500">{icon}</div>}
      <p className="font-display text-base font-medium text-neutral-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
