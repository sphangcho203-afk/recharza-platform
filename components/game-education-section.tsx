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
    <section className="w-full bg-transparent pt-16 pb-24 sm:pt-20 sm:pb-32" aria-label={`About ${game.title}`}>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 sm:gap-16">
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-20 w-20 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-[2.5rem] border-2 border-white/10 bg-[#161722] p-3 sm:p-5 shadow-2xl">
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
                <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] text-white/40">Knowledge Base</p>
                <h2 className="mt-1 sm:mt-2 text-4xl sm:text-5xl font-black tracking-tighter text-white uppercase italic">{game.title}</h2>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Left Column: About & Region */}
            <div className="lg:col-span-5 space-y-10">
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#161722] p-8 shadow-2xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                <h3 className="text-lg font-black text-white uppercase italic tracking-wider flex items-center gap-3">
                  <StorefrontIcon name="info" className="h-5 w-5 text-violet-400" />
                  About the game
                </h3>
                <p className="mt-6 text-[15px] leading-relaxed text-white/80 font-bold whitespace-pre-wrap">{about}</p>
              </div>

              {regionNote && (
                <div className="rounded-[2.5rem] border-2 border-amber-500/40 bg-[#1c1917] p-8 shadow-2xl">
                  <div className="flex items-start gap-4">
                    <StorefrontIcon name="shield" className="mt-1 h-6 w-6 shrink-0 text-amber-400" />
                    <div>
                      <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-[0.25em]">Regional Policy</h4>
                      <p className="mt-3 text-sm leading-relaxed text-amber-400 font-black italic">{regionNote}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Currency & ID */}
            <div className="lg:col-span-7 grid gap-6 sm:grid-cols-2">
              <div className="rounded-[2.5rem] border border-white/5 bg-[#161722] p-8 shadow-xl transition-all hover:bg-[#1a1b2e] hover:border-white/10 group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                    <StorefrontIcon name="coin" className="h-5 w-5" />
                  </div>
                  <h3 className="text-[13px] font-black text-white uppercase tracking-[0.2em]">What it buys</h3>
                </div>
                <div className="mt-6 text-sm leading-relaxed text-white/80 font-bold whitespace-pre-wrap">{currencyUses}</div>
              </div>

              <div className="rounded-[2.5rem] border border-white/10 bg-[#161722] p-8 shadow-xl transition-all hover:bg-[#1a1b2e] hover:border-white/20 group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <StorefrontIcon name="id" className="h-5 w-5" />
                  </div>
                  <h3 className="text-[13px] font-black text-white uppercase tracking-[0.2em]">Find your ID</h3>
                </div>
                <div className="mt-6 text-sm leading-relaxed text-white/80 font-bold whitespace-pre-wrap">{findId}</div>
              </div>

              {/* Purchase Steps: Immersive Layout */}
              <div className="sm:col-span-2 rounded-[3rem] border border-white/5 bg-[#161722] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-violet-600/5 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                      <StorefrontIcon name="cart" className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-wider">Purchase Process</h3>
                  </div>
                  
                  <div className="mt-10 grid gap-10 sm:grid-cols-3">
                    {steps.map((step: string, index: number) => (
                      <div key={index} className="flex flex-col gap-4 relative">
                        <div className="flex items-center gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white bg-violet-600 shadow-lg shadow-violet-600/20">
                            {index + 1}
                          </span>
                          <div className="h-[2px] flex-1 bg-white/5 hidden sm:block" />
                        </div>
                        <p className="text-sm leading-relaxed text-white/70 font-bold">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
