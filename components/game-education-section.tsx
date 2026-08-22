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
  if (!game.education) return null;
  const { about, currencyUses, findId, steps, regionNote } = game.education;
  const accent = game.accent ?? "#9b7cff";

  return (
    <section className="mt-10" aria-label={`About ${game.title}`}>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 max-h-[600px] overflow-y-auto storefront-scrollbar">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 opacity-20" style={{ background: accent }} />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
              <StorefrontIcon name="info" className="h-5 w-5" style={{ color: accent } as React.CSSProperties} />
            </span>
            <div>
              <p className="recharza-eyebrow" style={{ color: accent }}>Know the game</p>
              <h2 className="recharza-section-head mt-2 text-slate-900">About {game.title}</h2>
            </div>
          </div>
          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2 shadow-sm">
            <StorefrontArtwork
              artworkKey={game.artworkKey}
              sources={game.media.sources}
              alt={`${game.title} logo`}
              fallbackLabel={game.title.slice(0, 2)}
              className="h-full w-full"
              objectFit="contain"
            />
          </div>
        </div>
        <div className="recharza-body relative mt-4 text-slate-600 font-medium whitespace-pre-wrap">{about}</div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tile game={game} icon="coin" label="What it buys" seed={1}>
            <div className="whitespace-pre-wrap">{currencyUses}</div>
          </Tile>
          <Tile game={game} icon="id" label="Find your ID" seed={2}>
            <div className="whitespace-pre-wrap">{findId}</div>
          </Tile>
          <Tile game={game} icon="cart" label="How to purchase" seed={3}>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="relative flex gap-3">
                  <span className="flex flex-col items-center">
                    <span className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: accent }}>{index + 1}</span>
                    {index < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 pb-0.5 leading-[1.65] text-slate-700 font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </Tile>
        </div>

        {regionNote ? (
          <div className="relative mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-[12.5px] leading-[1.7] text-amber-900 font-medium">
            <div className="relative flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white border border-amber-200 text-amber-600 shadow-sm"><StorefrontIcon name="shield" className="h-3.5 w-3.5" /></span>
              <p>{regionNote}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
