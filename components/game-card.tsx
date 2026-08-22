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
      className={`recharza-bleed-card group relative h-full overflow-hidden ${
        interactive ? "" : "opacity-60"
      }`}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-1 opacity-0 transition-opacity duration-300 motion-safe:group-hover:opacity-100" style={{ background: accent }} />
      {/* Tall portrait artwork bleeding to the card edges (1.16, taller than offer cards). */}
      <div className="recharza-bleed-media relative aspect-[1.16] bg-surface-sunken">
        <StorefrontArtwork
          artworkKey={game.artworkKey}
          sources={preferredArtworkSources(game)}
          alt={game.artworkAlt}
          fallbackLabel={title}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 639px) 44vw, (max-width: 1023px) 29vw, (max-width: 1279px) 18vw, 15vw"
          className="h-full w-full object-cover brightness-[.94] saturate-[1.08] transition-[transform,filter] duration-300 ease-out motion-safe:group-hover:scale-[1.06] motion-safe:group-hover:brightness-100"
          fallbackClassName="h-full w-full"
          objectPosition={game.artworkPosition}
          objectFit="cover"
        />
      </div>

      {/* Compact base strip — no price/CTA chip, only category + title + arrow. */}
      <div className="relative flex min-h-[5.4rem] flex-col justify-between gap-1.5 bg-white p-3.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">{category}</p>
            <h3 className="recharza-card-title mt-1 min-w-0 truncate text-slate-900">{title}</h3>
          </div>
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:border-violet-200 group-hover:bg-violet-50 group-hover:text-violet-600 shadow-sm">
            <StorefrontIcon name="arrow" className="h-3.5 w-3.5" />
          </span>
        </div>
        {price ? <p className="truncate text-[.72rem] font-bold text-slate-500">From <DisplayPrice amountInrMinor={price} className="ml-1 text-[.86rem] font-bold text-violet-600" /></p> : <p className="text-[.72rem] font-bold text-slate-400">Verified digital delivery</p>}
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
