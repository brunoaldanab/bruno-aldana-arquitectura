import { AppHeader } from "@/components/AppHeader";

export default function Loading() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-6 w-28 animate-pulse rounded bg-neutral-50" />
          <div className="h-9 w-36 animate-pulse rounded-full bg-neutral-50" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 last:border-0">
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-neutral-50" />
                <div className="h-3 w-28 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
