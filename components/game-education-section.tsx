"use client";

import { StorefrontIcon } from "@/components/storefront-icon";
import { StorefrontArtwork } from "@/components/storefront-artwork";
import type { Game } from "@/lib/games";

function Tile({
  game,
  icon,
  label,
  seed,
  children,
}: {
  game: Game;
  icon: "coin" | "id" | "cart" | "support";
  label: string;
  seed: number;
  children: React.ReactNode;
}) {
  void seed;
  const accent = game.accent ?? "#9b7cff";
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity duration-300 motion-safe:group-hover:opacity-100" style={{ background: accent }} />
      <div className="relative flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 border border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-110" style={{ color: accent }}>
          <StorefrontIcon name={icon} className="h-5 w-5" />
        </span>
        <h3 className="recharza-card-title text-slate-900 font-bold">{label}</h3>
      </div>
      <div className="relative mt-4 text-[13px] leading-[1.75] text-slate-600 font-medium">{children}</div>
    </div>
  );
}

export function GameEducationSection({
  game,
}: {
  game: Game;
}) {
  const education = game.education;
  if (!education) return null;
  const { about, currencyUses, findId, steps, regionNote } = education;
  const accent = game.accent ?? "#9b7cff";

  return (
    <section className="w-full bg-white border-t border-slate-100 pt-20 pb-32" aria-label={`About ${game.title}`}>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-16">
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <StorefrontArtwork
                  artworkKey={game.artworkKey}
                  sources={game.logoSources}
                  alt={`${game.title} logo`}
                  fallbackLabel={game.title.slice(0, 2)}
                  className="h-full w-full"
                  objectFit="contain"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>Store Guide</p>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900">{game.title}</h2>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Left Column: About & Region */}
            <div className="lg:col-span-5 space-y-10">
              <div className="prose prose-slate max-w-none">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                  About the game
                </h3>
                <p className="mt-5 text-[16px] leading-[1.8] text-slate-600 font-medium whitespace-pre-wrap">{about}</p>
              </div>

              {regionNote && (
                <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-8 shadow-sm">
                  <div className="flex gap-4">
                    <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white border border-amber-200 text-amber-600 shadow-sm">
                      <StorefrontIcon name="shield" className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Regional Policy</h4>
                      <p className="mt-2 text-[14px] leading-[1.7] text-amber-800/80 font-medium">{regionNote}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Currency & ID */}
            <div className="lg:col-span-7 grid gap-8 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-100 bg-slate-50/30 p-8 shadow-sm transition-colors hover:bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white border border-slate-100 shadow-sm" style={{ color: accent }}>
                    <StorefrontIcon name="coin" className="h-6 w-6" />
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">What it buys</h3>
                </div>
                <div className="mt-6 text-[15px] leading-[1.8] text-slate-600 font-medium whitespace-pre-wrap">{currencyUses}</div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50/30 p-8 shadow-sm transition-colors hover:bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white border border-slate-100 shadow-sm" style={{ color: accent }}>
                    <StorefrontIcon name="id" className="h-6 w-6" />
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Find your ID</h3>
                </div>
                <div className="mt-6 text-[15px] leading-[1.8] text-slate-600 font-medium whitespace-pre-wrap">{findId}</div>
              </div>

              {/* Purchase Steps: Full Width */}
              <div className="sm:col-span-2 rounded-3xl border border-slate-100 bg-slate-50/30 p-8 sm:p-10 shadow-sm transition-colors hover:bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white border border-slate-100 shadow-sm" style={{ color: accent }}>
                    <StorefrontIcon name="cart" className="h-6 w-6" />
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">How to purchase</h3>
                </div>
                <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                  {steps.map((step: string, index: number) => (
                    <div key={index} className="flex flex-col gap-4">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl text-base font-black text-white shadow-md" style={{ backgroundColor: accent }}>
                        {index + 1}
                      </span>
                      <p className="text-[15px] leading-[1.6] text-slate-700 font-semibold">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
