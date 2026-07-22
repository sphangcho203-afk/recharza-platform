import Link from "next/link";

import { ResilientImage } from "@/components/resilient-image";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
};

function getStatusLabel(game: Game) {
  if (game.status === "checkout") {
    return "Top up";
  }

  if (game.status === "catalogue") {
    return "Choose market";
  }

  return "Coming soon";
}

export function GameCard({ game }: GameCardProps) {
  const interactive = Boolean(game.available && game.href);

  const card = (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#10101a] p-3 shadow-[0_14px_42px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_20px_55px_rgba(0,0,0,0.32)] sm:p-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#171724]">
        <ResilientImage
          sources={game.artworkSources.length > 0 ? game.artworkSources : game.logoSources}
          alt={game.logoAlt}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          style={{ objectPosition: game.artworkPosition ?? "center" }}
          fallbackClassName="h-full w-full"
          fallbackLabel={game.title.slice(0, 2)}
        />

        <div className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/90 backdrop-blur-md">
          {game.status === "checkout" ? "Available" : "Soon"}
        </div>

        {game.badge ? (
          <div className="absolute right-2.5 top-2.5 max-w-[60%] truncate rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[9px] font-bold text-white/85 backdrop-blur-md">
            {game.badge}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-3.5">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {game.publisher}
        </p>
        <h3 className="mt-1 min-h-12 text-base font-black leading-6 text-white sm:text-lg">
          {game.title}
        </h3>
        <p className="mt-1 truncate text-xs text-slate-400">{game.category}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {game.packages.slice(0, 2).map((item) => (
            <span
              key={item}
              className="max-w-full truncate rounded-full border border-white/8 bg-white/[0.035] px-2.5 py-1 text-[10px] text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
                {game.startingPriceInPaise ? "From" : "Status"}
              </p>
              <p className="truncate text-sm font-black text-white">
                {game.startingPriceInPaise
                  ? formatInr(game.startingPriceInPaise)
                  : "Not available yet"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-black transition ${
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