import Link from "next/link";

import { ResilientImage } from "@/components/resilient-image";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
};

function getStatusLabel(game: Game) {
  if (game.status === "checkout") return "Choose market";
  if (game.status === "catalogue") return "Open market";
  return "Coming soon";
}

export function GameCard({ game }: GameCardProps) {
  const interactive = Boolean(game.available && game.href);

  const card = (
    <article className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e15] shadow-[0_12px_36px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
      <div className="relative aspect-square overflow-hidden bg-[#11121b]">
        <ResilientImage
          sources={game.artworkSources}
          alt={game.artworkAlt}
          fallbackLabel={game.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          style={{ objectPosition: game.artworkPosition ?? "center" }}
          fallbackClassName="h-full w-full"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
          <span className="rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/90 backdrop-blur-md">
            {game.category}
          </span>
          {game.badge ? (
            <span className="rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[9px] font-black text-white/90 backdrop-blur-md">
              {game.badge}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      <div className="flex min-h-44 flex-col p-3 sm:min-h-48 sm:p-4">
        <div>
          <h3 className="line-clamp-2 text-[15px] font-black leading-5 text-white sm:text-lg sm:leading-6">
            {game.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400 sm:text-xs">
            {game.publisher}
          </p>
        </div>

        <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
          {game.packages.slice(0, 2).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/10 pt-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-600">
              {game.startingPriceInPaise ? "From" : "Status"}
            </p>
            <p className="mt-0.5 text-sm font-black text-white sm:text-base">
              {game.startingPriceInPaise
                ? formatInr(game.startingPriceInPaise)
                : "Planned"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-lg px-2.5 py-2 text-[10px] font-black transition sm:text-xs ${
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
        className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#06060f]"
        aria-label={`${getStatusLabel(game)} for ${game.title}`}
      >
        {card}
      </Link>
    );
  }

  return card;
}
