"use client";

import { StorefrontIcon } from "@/components/storefront-icon";
import { StorefrontArtwork } from "@/components/storefront-artwork";
import type { Game } from "@/lib/games";

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
    <section className="w-full bg-[#0d0f16] border-t border-white/5 pt-16 pb-24 sm:pt-20 sm:pb-32" aria-label={`About ${game.title}`}>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 sm:gap-16">
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4 shadow-2xl backdrop-blur-md">
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
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>Store Guide</p>
                <h2 className="mt-1 sm:mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white">{game.title}</h2>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Left Column: About & Region */}
            <div className="lg:col-span-5 space-y-10">
              <div className="prose prose-invert max-w-none">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: accent, color: accent }} />
                  About the game
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-slate-400 font-medium whitespace-pre-wrap">{about}</p>
              </div>

              {regionNote && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <StorefrontIcon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-[0.15em]">Regional Policy</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-amber-200/80 font-medium">{regionNote}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Currency & ID */}
            <div className="lg:col-span-7 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:border-white/20">
                <div className="flex items-center gap-2">
                  <StorefrontIcon name="coin" className="h-4 w-4 shrink-0" style={{ color: accent }} />
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">What it buys</h3>
                </div>
                <div className="mt-3 text-[13px] leading-relaxed text-slate-400 font-medium whitespace-pre-wrap">{currencyUses}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:border-white/20">
                <div className="flex items-center gap-2">
                  <StorefrontIcon name="id" className="h-4 w-4 shrink-0" style={{ color: accent }} />
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Find your ID</h3>
                </div>
                <div className="mt-3 text-[13px] leading-relaxed text-slate-400 font-medium whitespace-pre-wrap">{findId}</div>
              </div>

              {/* Purchase Steps: Compact Horizontal */}
              <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:border-white/20">
                <div className="flex items-center gap-3">
                  <StorefrontIcon name="cart" className="h-5 w-5 shrink-0" style={{ color: accent }} />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Purchase Process</h3>
                </div>
                <div className="mt-8 grid gap-8 sm:grid-cols-3">
                  {steps.map((step: string, index: number) => (
                    <div key={index} className="flex gap-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white shadow-[0_0_15px_rgba(0,0,0,0.3)]" style={{ backgroundColor: accent }}>
                        {index + 1}
                      </span>
                      <p className="text-[13px] leading-relaxed text-slate-300 font-semibold">{step}</p>
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
