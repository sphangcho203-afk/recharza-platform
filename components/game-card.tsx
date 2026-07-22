import Link from "next/link";

import { ResilientImage } from "@/components/resilient-image";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
};

function getStatusLabel(game: Game) {
  if (game.status === "checkout") return "Top up";
  if (game.status === "catalogue") return "Open market";
  return "Coming soon";
}

export function GameCard({ game }: GameCardProps) {
  const interactive = Boolean(game.available && game.href);
  const mediaSources = [...game.artworkSources, ...game.logoSources];

  const card = (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e15] p-3 shadow-[0_12px_36px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 sm:p-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#11121b]">
        <ResilientImage
          sources={mediaSources}
          alt={game.artworkAlt}
          fallbackLabel={game.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          style={{ objectPosition: game.artworkPosition ?? "center" }}
          fallbackClassName="h-full w-full"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
          <span className="max-w-[62%] truncate rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/90 backdrop-blur-md">
            {game.category}
          </span>
          {game.badge ? (
            <span className="max-w-[48%] truncate rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[9px] font-black text-white/90 backdrop-blur-md">
              {game.badge}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-3.5">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
          {game.publisher}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-[15px] font-black leading-5 text-white sm:min-h-12 sm:text-lg sm:leading-6">
          {game.title}
        </h3>

        <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
          {game.packages.slice(0, 2).map((item) => (
            <span
              key={item}
              className="max-w-full truncate rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-600">
                {game.startingPriceInPaise ? "From" : "Status"}
              </p>
              <p className="mt-0.5 truncate text-sm font-black text-white sm:text-base">
                {game.startingPriceInPaise
                  ? formatInr(game.startingPriceInPaise)
                  : "Not available"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-lg px-2.5 py-2 text-[10px] font-black transition sm:px-3 sm:text-xs ${
                interactive
                  ? "bg-white text-slate-950 group-hover:bg-violet-200"
                  : "bg-white/5 text-slate-500"
              }`}
            >
              {getStatusLabel(game)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );

  if (interactive && game.href) {
    return (
      <Link
        href={game.href}
        className="block h-full min-w-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#06060f]"
        aria-label={`${getStatusLabel(game)} for ${game.title}`}
      >
        {card}
      </Link>
    );
  }

  return <div className="h-full min-w-0">{card}</div>;
}