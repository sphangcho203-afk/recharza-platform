import Link from "next/link";

import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
};

export function GameCard({ game }: GameCardProps) {
  const pricingLabel =
    game.pricingMode === "live"
      ? "Live supplier offers"
      : game.pricingMode === "fallback"
        ? "Protected fallback"
        : "Supplier setup staged";

  return (
    <article className="glass-glow group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-violet-400/35 hover:bg-white/[0.06]">
      <div
        className="relative flex h-44 items-end overflow-hidden p-5"
        style={{ background: game.gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.3),transparent_36%)]" />
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/20 transition duration-500 group-hover:scale-110" />
        <div className="absolute right-8 top-5 h-16 w-16 rotate-12 rounded-2xl border border-white/15 transition duration-500 group-hover:rotate-[20deg]" />
        <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {pricingLabel}
        </span>
        <span className="relative text-4xl font-black tracking-tighter text-white/95">
          {game.icon}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
              {game.category}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">{game.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{game.publisher}</p>
          </div>
          {game.startingPriceInPaise ? (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                From
              </p>
              <p className="mt-1 text-lg font-black text-white">
                {formatInr(game.startingPriceInPaise)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {game.packages.slice(0, 2).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>

        {game.available ? (
          <Link
            href={`/games/${game.slug}`}
            className="block w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-center text-sm font-bold text-white shadow-[0_12px_34px_rgba(139,92,246,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(139,92,246,0.3)]"
          >
            View packages
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-400"
          >
            Supplier flow in progress
          </button>
        )}
      </div>
    </article>
  );
}
