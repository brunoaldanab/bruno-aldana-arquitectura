export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-neutral-50" />
      <div className="mb-2 flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-1.5 flex-1 animate-pulse rounded-full bg-neutral-50" />
        ))}
      </div>
      <div className="mt-6 h-72 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100" />
    </main>
  );
}
