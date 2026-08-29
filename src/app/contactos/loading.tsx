import { AppHeader } from "@/components/AppHeader";

export default function Loading() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-6 w-28 animate-pulse rounded bg-white/[0.05]" />
          <div className="h-9 w-36 animate-pulse rounded-full bg-white/[0.05]" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between border-b border-white/10 px-4 py-4 last:border-0">
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-white/[0.05]" />
                <div className="h-3 w-28 animate-pulse rounded bg-white/[0.09]" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
