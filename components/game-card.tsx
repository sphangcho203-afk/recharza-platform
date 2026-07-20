import Link from "next/link";

import { GameLogo } from "@/components/game-logo";
import { ResilientImage } from "@/components/resilient-image";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
};

function getStatusLabel(game: Game) {
  if (game.status === "checkout") {
    return "Top up now";
  }

  if (game.status === "catalogue") {
    return "Choose market";
  }

  return "Coming soon";
}

export function GameCard({ game }: GameCardProps) {
  const interactive = Boolean(game.available && game.href);

  const card = (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-[0_16px_50px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_22px_65px_rgba(0,0,0,0.34)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#11121b]">
        <ResilientImage
          sources={game.artworkSources}
          alt={game.artworkAlt}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          style={{ objectPosition: game.artworkPosition ?? "center" }}
          fallbackClassName="h-full w-full"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#10101a] via-[#10101a]/25 to-black/5" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3.5">
          <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-white/85 backdrop-blur-md">
            {game.category}
          </span>
          <span
            className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-white/85 backdrop-blur-md"
            style={{ boxShadow: `0 0 22px ${game.accent}33` }}
          >
            {game.status === "checkout" ? "Ready" : "Planned"}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
          <GameLogo game={game} />
          {game.startingPriceInPaise ? (
            <div className="rounded-2xl border border-white/10 bg-black/50 px-3 py-2 text-right backdrop-blur-md">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/55">From</p>
              <p className="mt-0.5 text-lg font-black text-white">
                {formatInr(game.startingPriceInPaise)}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-4.5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-white">{game.title}</h3>
            <p className="mt-1 truncate text-xs text-slate-400">{game.publisher}</p>
          </div>
          {game.badge ? (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-300">
              {game.badge}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {game.packages.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/8 bg-white/[0.035] px-2.5 py-1 text-[11px] text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
          <p className="text-xs text-slate-500">
            {interactive ? "Secure server-priced checkout" : "Supplier integration pending"}
          </p>
          <span
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
              interactive
                ? "bg-white text-slate-950 group-hover:bg-violet-200"
                : "border border-white/10 bg-white/5 text-slate-400"
            }`}
          >
            {getStatusLabel(game)}
          </span>
        </div>
      </div>
    </article>
  );

  if (interactive && game.href) {
    return (
      <Link
        href={game.href}
        className="block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#06060f]"
        aria-label={`${getStatusLabel(game)} for ${game.title}`}
      >
        {card}
      </Link>
    );
  }

  return card;
}
