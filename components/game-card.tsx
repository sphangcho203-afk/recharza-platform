import Link from "next/link";

import { StorefrontArtwork } from "@/components/storefront-artwork";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
  showDevelopmentBadges?: boolean;
  showPricingSnapshots?: boolean;
};

function actionLabel(game: Game, showDevelopmentBadges: boolean) {
  if (game.status === "checkout") return "Top up";
  if (game.status === "catalogue") {
    return showDevelopmentBadges ? "Explore" : "Preview";
  }
  return showDevelopmentBadges ? "Soon" : "Unavailable";
}

function subtitle(game: Game) {
  if (game.region) return `${game.region.flag} ${game.region.label}`;
  return game.publisher;
}

export function GameCard({
  game,
  showDevelopmentBadges = true,
  showPricingSnapshots = true,
}: GameCardProps) {
  const interactive = Boolean(game.available && game.href);
  const price =
    showPricingSnapshots && game.startingPriceInPaise
      ? `From ${formatInr(game.startingPriceInPaise)}`
      : null;

  const card = (
    <article className="group relative aspect-[16/9] min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0c101b] shadow-[0_14px_44px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
      <StorefrontArtwork
        artworkKey={game.artworkKey}
        sources={[...game.artworkSources, ...game.logoSources]}
        alt={game.artworkAlt}
        fallbackLabel={game.title}
        className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.025]"
        fallbackClassName="absolute inset-0 h-full w-full"
        objectPosition={game.artworkPosition}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,7,15,0.88)_0%,rgba(4,7,15,0.5)_48%,rgba(4,7,15,0.06)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span className="max-w-[62%] truncate rounded-full border border-white/12 bg-black/55 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/85 backdrop-blur-md">
          {game.category}
        </span>
        {game.region ? (
          <span className="grid h-7 min-w-7 place-items-center rounded-full border border-white/12 bg-black/60 px-1.5 text-sm backdrop-blur-md" aria-label={game.region.label}>
            {game.region.flag}
          </span>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-black leading-tight text-white sm:text-lg">
            {game.title}
          </h3>
          <p className="mt-1 truncate text-[11px] font-semibold text-slate-300/75 sm:text-xs">
            {subtitle(game)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {price ? (
              <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2 py-1 text-[10px] font-black text-emerald-100">
                {price}
              </span>
            ) : game.packages[0] ? (
              <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-bold text-slate-300">
                {game.packages[0]}
              </span>
            ) : null}
          </div>
        </div>

        <span
          className={`grid h-10 min-w-10 shrink-0 place-items-center rounded-full border text-sm font-black backdrop-blur transition ${
            interactive
              ? "border-white/15 bg-white text-slate-950 group-hover:bg-violet-200"
              : "border-white/10 bg-black/35 text-slate-500"
          }`}
          aria-hidden="true"
        >
          {interactive ? "→" : "·"}
        </span>
      </div>

      <span className="sr-only">{actionLabel(game, showDevelopmentBadges)}</span>
    </article>
  );

  if (interactive && game.href) {
    return (
      <Link
        href={game.href}
        className="block min-w-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#06060f]"
        aria-label={`${actionLabel(game, showDevelopmentBadges)} ${game.title}${
          game.region ? ` for ${game.region.label}` : ""
        }`}
      >
        {card}
      </Link>
    );
  }

  return <div className="min-w-0">{card}</div>;
}
