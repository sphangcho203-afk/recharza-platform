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
      className={`group grid h-full gap-4 rounded-xl border p-3 transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out overflow-hidden sm:p-4 ${
        interactive
          ? "fable-surface-raised border-white/[0.08] bg-[linear-gradient(162deg,rgba(30,33,56,.96),rgba(14,16,29,.98))] hover:-translate-y-1 hover:shadow-elevation-2 motion-safe:group-hover:scale-[1.015]"
          : "fable-surface-flat border-border opacity-60"
      }`}
      style={interactive ? { boxShadow: "0 18px 44px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.06)", border: `1px solid rgba(255,255,255,.08)`, transitionDuration: "200ms" } : undefined}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity duration-300 motion-safe:group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 55%, transparent) 50%, transparent)` }} />
      <div className="relative aspect-[1.16] overflow-hidden rounded-lg border border-[rgba(196,181,253,.18)] bg-surface-sunken shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
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

      <div className="grid min-w-0 gap-2">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/75">{category}</p>
            <h3 className="min-w-0 truncate text-[1.02rem] font-semibold leading-5 tracking-[-0.02em] text-text-primary sm:text-lg">{title}</h3>
          </div>
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.12] bg-white/[0.03] text-text-muted transition-[color,background-color,transform,border-color] duration-200 group-hover:translate-x-0.5 group-hover:border-white/[0.22] group-hover:text-white">
            <StorefrontIcon name="arrow" className="h-3.5 w-3.5 transition-colors duration-200" />
          </span>
        </div>
        {price ? <p className="truncate text-[.72rem] font-medium text-text-secondary">From <DisplayPrice amountInrMinor={price} className="ml-1 text-[.86rem] font-semibold text-violet-100" /></p> : <p className="text-[.72rem] font-medium text-text-secondary">Verified digital delivery</p>}
      </div>

      <div className="flex items-center gap-2 border-t border-white/[.09] pt-3">
        <span className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold tracking-[.01em] text-primary-foreground transition-[background-color,box-shadow,transform] duration-200 group-hover:bg-primary-hover group-hover:translate-y-[-1px]">{label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">Secure</span>
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
