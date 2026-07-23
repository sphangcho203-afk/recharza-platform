import Link from "next/link";

import { ResilientImage } from "@/components/resilient-image";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
  compact?: boolean;
};

function getActionLabel(game: Game) {
  if (game.kind === "gift-card" || game.fulfilmentType === "gift-card") return "Buy code";
  if (game.fulfilmentType === "redeem-code") return "View codes";
  if (game.kind === "mobile-legends-region") return "View packs";
  return "Top up";
}

function getFulfilmentLabel(game: Game) {
  if (game.fulfilmentType === "gift-card") return "Digital gift card";
  if (game.fulfilmentType === "redeem-code") return "Code delivery";
  if (game.fulfilmentType === "subscription") return "Subscription";
  if (game.fulfilmentType === "uid") return "UID top-up";
  return "Direct top-up";
}

export function GameCard({ game, compact = false }: GameCardProps) {
  const mediaSources = [...game.logoSources, ...game.artworkSources];

  return (
    <Link
      href={game.href}
      className="group block h-full min-w-0 rounded-[1.35rem] outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#07070c]"
      aria-label={`${getActionLabel(game)} for ${game.title}`}
    >
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0d0e15] shadow-[0_16px_48px_rgba(0,0,0,0.3)] transition duration-300 group-hover:-translate-y-1 group-hover:border-white/20 group-hover:shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
        <div
          className={`relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.11),transparent_50%),#11131d] ${
            compact ? "aspect-[1.15/1]" : "aspect-square"
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-25 blur-3xl"
            style={{ background: game.accent }}
          />
          <ResilientImage
            sources={mediaSources}
            alt={game.logoAlt}
            fallbackLabel={game.title}
            className="relative h-full w-full object-contain p-[14%] transition duration-500 group-hover:scale-[1.045]"
            fallbackClassName="h-full w-full"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            <span className="max-w-[58%] truncate rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.11em] text-white/90 backdrop-blur-md">
              {game.category}
            </span>
            {game.badge ? (
              <span className="max-w-[52%] truncate rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[9px] font-black text-white/90 backdrop-blur-md">
                {game.badge}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]">
            {game.publisher}
          </p>
          <h3 className="mt-1.5 line-clamp-2 min-h-10 text-[15px] font-black leading-5 tracking-[-0.02em] text-white sm:min-h-12 sm:text-lg sm:leading-6">
            {game.title}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-9 text-[11px] leading-[1.15rem] text-slate-500 sm:text-xs">
            {game.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-[9px] font-bold text-slate-400">
              {getFulfilmentLabel(game)}
            </span>
            {game.packages[0] ? (
              <span className="max-w-[8.5rem] truncate rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-[9px] font-bold text-slate-400">
                {game.packages[0]}
              </span>
            ) : null}
          </div>

          <div className="mt-auto pt-4">
            <div className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-600 sm:text-[9px]">
                  Indicative from
                </p>
                <p className="mt-0.5 truncate text-sm font-black text-white sm:text-base">
                  {game.startingPriceInPaise
                    ? formatInr(game.startingPriceInPaise)
                    : "Supplier sync"}
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-white px-2.5 py-2 text-[10px] font-black text-slate-950 transition group-hover:bg-violet-200 sm:px-3 sm:text-xs">
                {getActionLabel(game)}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
