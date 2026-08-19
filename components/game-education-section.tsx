"use client";

import { StorefrontIcon } from "@/components/storefront-icon";
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
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-[linear-gradient(162deg,rgba(28,31,50,.9),rgba(13,15,25,.95))] p-4 sm:p-5 shadow-[0_12px_30px_rgba(0,0,0,.22)]">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity duration-300 motion-safe:group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 55%, transparent) 50%, transparent)` }} />
      <div className="relative flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] transition-transform duration-200 group-hover:scale-105" style={{ color: accent }}>
          <StorefrontIcon name={icon} className="h-5 w-5" />
        </span>
        <h3 className="recharza-card-title text-white">{label}</h3>
      </div>
      <div className="relative mt-4 text-[13px] leading-[1.75] text-white/70">{children}</div>
    </div>
  );
}

export function GameEducationSection({
  game,
}: {
  game: Game;
}) {
  if (!game.education) return null;
  const { about, currencyUses, findId, steps, regionNote } = game.education;
  const accent = game.accent ?? "#9b7cff";

  return (
    <section className="mt-10" aria-label={`About ${game.title}`}>
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[linear-gradient(162deg,rgba(24,27,48,.95),rgba(10,12,20,.98))] p-5 shadow-[0_24px_60px_rgba(0,0,0,.35)] sm:p-7">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 50%, transparent) 50%, transparent)` }} />

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08]">
            <StorefrontIcon name="info" className="h-5 w-5" style={{ color: accent } as React.CSSProperties} />
          </span>
          <div>
            <p className="recharza-eyebrow" style={{ background: `linear-gradient(90deg, ${accent}, #22d3ee)` }}>Know the game</p>
            <h2 className="recharza-section-head mt-2 text-white">About {game.title}</h2>
          </div>
        </div>
        <p className="recharza-body relative mt-4">{about}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tile game={game} icon="coin" label="What it buys" seed={1}>
            {currencyUses}
          </Tile>
          <Tile game={game} icon="id" label="Find your ID" seed={2}>
            {findId}
          </Tile>
          <Tile game={game} icon="cart" label="How to purchase" seed={3}>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="relative flex gap-3">
                  <span className="flex flex-col items-center">
                    <span className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-[#0b0d14]" style={{ backgroundColor: accent }}>{index + 1}</span>
                    {index < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-white/15" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 pb-0.5 leading-[1.65]">{step}</span>
                </li>
              ))}
            </ol>
          </Tile>
        </div>

        {regionNote ? (
          <div className="relative mt-6 rounded-xl border border-amber-300/15 bg-[linear-gradient(135deg,rgba(217,119,6,.08),rgba(13,15,25,.6))] px-4 py-3.5 text-[12.5px] leading-[1.7] text-amber-100/80">
            <div className="relative flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-amber-300/10 text-amber-200"><StorefrontIcon name="shield" className="h-3.5 w-3.5" /></span>
              <p>{regionNote}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
