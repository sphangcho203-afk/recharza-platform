export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-4xl gap-4" aria-label="Loading Recharza">
        <div className="h-5 w-28 animate-pulse rounded-full bg-violet-300/15" />
        <div className="h-12 max-w-xl animate-pulse rounded-2xl bg-white/[0.07]" />
        <div className="h-5 max-w-2xl animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-[4/3] animate-pulse rounded-2xl border border-white/8 bg-white/[0.025]" />
          ))}
        </div>
      </div>
    </main>
  );
}
