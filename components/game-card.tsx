import Link from "next/link";

import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import { DisplayPrice } from "@/components/display-price";
import type { Game } from "@/lib/games";

type GameCardProps = {
  game: Game;
  priority?: boolean;
  showDevelopmentBadges?: boolean;
  showPricingSnapshots?: boolean;
};

function actionLabel(game: Game, showDevelopmentBadges: boolean) {
  if (game.status === "checkout") return "Top up";
  if (game.status === "catalogue") return showDevelopmentBadges ? "Explore" : "Preview";
  return showDevelopmentBadges ? "Soon" : "Unavailable";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function preferredArtworkSources(game: Game) {
  const local = game.artworkSources.filter((source) => source.startsWith("/") && !source.includes("/assets/founder/"));
  const remote = game.artworkSources.filter((source) => source.startsWith("https://"));
  const founder = game.artworkSources.filter((source) => source.includes("/assets/founder/"));
  return unique([...local, ...remote, ...founder]);
}

export function GameCard({
  game,
  priority = false,
  showDevelopmentBadges = true,
  showPricingSnapshots = true,
}: GameCardProps) {
  const interactive = Boolean(game.available && game.href);
  const label = actionLabel(game, showDevelopmentBadges);
  const price = showPricingSnapshots && game.startingPriceInPaise ? game.startingPriceInPaise : null;
  const isRegional = game.kind === "mobile-legends-region";
  const title = isRegional ? game.region?.label ?? game.title : game.title;
  const category = isRegional ? "Mobile Legends" : game.category;

  const accent = game.accent ?? "#9b7cff";
  const card = (
    <article
      className={`recharza-premium-card group relative h-full overflow-hidden rounded-[1.5rem] bg-white p-2.5 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(15,23,42,0.03)] transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08),0_0_0_1px_rgba(124,58,237,0.08)] hover:-translate-y-1.5 ${
        interactive ? "" : "opacity-60"
      }`}
    >
      {/* Artwork container with improved shape and foundation */}
      <div className="relative aspect-square overflow-hidden rounded-[1.1rem] bg-slate-50 ring-1 ring-slate-900/5">
        <StorefrontArtwork
          artworkKey={game.artworkKey}
          sources={preferredArtworkSources(game)}
          alt={game.artworkAlt}
          fallbackLabel={title}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 639px) 44vw, (max-width: 1023px) 29vw, (max-width: 1279px) 18vw, 15vw"
          className="h-full w-full object-cover brightness-[.98] saturate-[1.02] transition-all duration-700 cubic-bezier(0.23, 1, 0.32, 1) group-hover:scale-110 group-hover:brightness-105"
          fallbackClassName="h-full w-full"
          objectPosition={game.artworkPosition}
          objectFit="cover"
        />
        {/* Premium overlay for artwork depth */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 opacity-40 transition-opacity duration-500 group-hover:opacity-20" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.03)]" />
      </div>

      {/* Content area with premium typography and layout */}
      <div className="relative flex flex-col px-2 pb-2.5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-violet-600/80">{category}</p>
            <h3 className="mt-1 truncate text-[1rem] font-black leading-tight tracking-tight text-slate-900">{title}</h3>
          </div>
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200/60 transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) group-hover:bg-violet-600 group-hover:text-white group-hover:ring-violet-600 group-hover:shadow-[0_8px_20px_rgba(124,58,237,0.3)] group-hover:rotate-[360deg]">
            <StorefrontIcon name="arrow" className="h-3.5 w-3.5" />
          </div>
        </div>
        
        <div className="mt-3.5 flex items-end justify-between gap-2">
          {price ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">From</span>
              <DisplayPrice amountInrMinor={price} className="text-[0.92rem] font-black text-violet-600 leading-none" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 ring-1 ring-emerald-500/10">
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );

  if (interactive && game.href) {
    return (
      <Link
        href={game.href}
        className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken"
        aria-label={`${label} ${title}`}
      >
        {card}
      </Link>
    );
  }

  return <div className="h-full">{card}</div>;
}
