"use client";

export function ChipMulti({
  options,
  values,
  onToggle,
  small,
  labelFor,
}: {
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
  small?: boolean;
  labelFor?: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onToggle(o)}
          className={`rounded-full border font-medium transition ${small ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"} ${
            values.includes(o)
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          {labelFor ? labelFor(o) : o}
        </button>
      ))}
    </div>
  );
}
