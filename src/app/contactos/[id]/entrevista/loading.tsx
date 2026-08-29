export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-white/[0.05]" />
      <div className="mb-2 flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-1.5 flex-1 animate-pulse rounded-full bg-white/[0.05]" />
        ))}
      </div>
      <div className="mt-6 h-72 animate-pulse rounded-2xl border border-white/10 bg-white/[0.09]" />
    </main>
  );
}
