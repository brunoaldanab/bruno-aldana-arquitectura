import { AppHeader } from "@/components/AppHeader";

export default function Loading() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-white/[0.05]" />
          <div className="h-6 w-52 animate-pulse rounded bg-white/[0.05]" />
        </div>
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.09]" />
              <div className="h-4 w-36 animate-pulse rounded bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
