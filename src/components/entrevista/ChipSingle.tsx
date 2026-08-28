"use client";

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
          className={`rounded-full border font-medium transition ${small ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"} ${
            value === o
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
