import Link from "next/link";

import { GameLogo } from "@/components/game-logo";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
};

function getPricingLabel(game: Game) {
  if (game.pricingMode === "live") {
    return "Live supplier offers";
  }

  if (game.pricingMode === "fallback") {
    return game.kind === "mobile-legends-region"
      ? "Regional route ready"
      : "Protected fallback";
  }

  return "Supplier setup staged";
}

function getStatusLabel(game: Game) {
  if (game.status === "checkout") {
    return "Open checkout";
  }

  if (game.status === "catalogue") {
    return "Choose region";
  }

  return "Integration in progress";
}

export function GameCard({ game }: GameCardProps) {
  const card = (
    <article className="glass-glow group relative h-full overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[0.035] shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1.5 hover:border-violet-400/40 hover:bg-white/[0.06] focus-within:-translate-y-1.5 focus-within:border-violet-400/50">
      <div
        className="relative overflow-hidden p-4 pb-5"
        style={{ background: game.gradient }}
      >
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-14 h-44 w-44 rounded-full blur-3xl transition duration-500 group-hover:scale-110"
          style={{ background: game.glow }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%,rgba(0,0,0,0.22))]" />
        <div className="relative flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
            {getPricingLabel(game)}
          </span>
          {game.region ? (
            <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {game.region.flag} {game.region.label}
            </span>
          ) : null}
        </div>
        <div className="relative mt-5 transition duration-500 group-hover:scale-[1.025]">
          <GameLogo game={game} />
        </div>
      </div>

      <div className="flex h-[18rem] flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
              {game.category}
            </p>
            <h3 className="mt-1 truncate text-xl font-semibold text-white">{game.title}</h3>
            <p className="mt-1 line-clamp-1 text-sm text-slate-400">{game.publisher}</p>
          </div>
          {game.startingPriceInPaise ? (
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                From
              </p>
              <p className="mt-1 text-lg font-black text-white">
                {formatInr(game.startingPriceInPaise)}
              </p>
            </div>
          ) : null}
        </div>

        {game.region?.note ? (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
            {game.region.note}
          </p>
        ) : (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
            Real game branding with supplier integration staged behind protected server pricing.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {game.packages.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-5">
          {game.available && game.href ? (
            <span className="block w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-center text-sm font-black text-white shadow-[0_12px_34px_rgba(139,92,246,0.2)] transition group-hover:shadow-[0_16px_40px_rgba(139,92,246,0.32)]">
              {getStatusLabel(game)}
            </span>
          ) : (
            <span className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-400">
              {getStatusLabel(game)}
            </span>
          )}
        </div>
      </div>
    </article>
  );

  if (game.available && game.href) {
    return (
      <Link
        href={game.href}
        className="block h-full rounded-[1.7rem] outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#06060f]"
        aria-label={`${getStatusLabel(game)} for ${game.title}`}
      >
        {card}
      </Link>
    );
  }

  return card;
}
