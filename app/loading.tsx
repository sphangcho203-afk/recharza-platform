import { RecharzaMark } from "@/components/recharza-mark";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-4 py-20 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-4xl gap-4" aria-label="Loading Recharza">
        <div className="flex items-center gap-3">
          <RecharzaMark compact />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 font-bold">Recharza</span>
        </div>
        <div className="h-12 max-w-xl animate-pulse rounded-lg bg-slate-100" />
        <div className="h-5 max-w-2xl animate-pulse rounded-lg bg-slate-50" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-[4/3] animate-pulse rounded-lg border border-slate-100 bg-slate-50/50" />
          ))}
        </div>
      </div>
    </main>
  );
}
