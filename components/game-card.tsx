import type { CSSProperties } from "react";
import Link from "next/link";

import { ResilientImage } from "@/components/resilient-image";
import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import {
  convertInrPaiseToCurrencyMinor,
  formatCurrencyMinor,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
  variant?: "rail" | "feed";
  priority?: boolean;
  showDevelopmentBadges?: boolean;
  showPricingSnapshots?: boolean;
  displayCurrency?: SupportedCurrencyCode;
  ratesFromInrMicros?: Partial<Record<SupportedCurrencyCode, number>>;
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
  const remote = game.artworkSources.filter((source) => source.startsWith("https://"));
  const local = game.artworkSources.filter((source) => source.startsWith("/") && !source.includes("/assets/founder/"));
  const founder = game.artworkSources.filter((source) => source.includes("/assets/founder/"));
  return unique([...local, ...remote, ...founder]);
}

function preferredLogoSources(game: Game) {
  const actual = game.logoSources.filter((source) => !source.includes("/assets/founder/"));
  const founder = game.logoSources.filter((source) => source.includes("/assets/founder/"));
  return unique([...actual, ...founder]);
}

export function GameCard({
  game,
  priority = false,
  showDevelopmentBadges = true,
  showPricingSnapshots = true,
  displayCurrency = "INR",
  ratesFromInrMicros,
}: GameCardProps) {
  const interactive = Boolean(game.available && game.href);
  const label = actionLabel(game, showDevelopmentBadges);
  const displayRate = ratesFromInrMicros?.[displayCurrency];
  const price = showPricingSnapshots && game.startingPriceInPaise
    ? displayRate
      ? formatCurrencyMinor(
          convertInrPaiseToCurrencyMinor(game.startingPriceInPaise, displayCurrency, displayRate),
          displayCurrency,
        )
      : formatInr(game.startingPriceInPaise)
    : null;
  const accentStyle = { "--game-accent": game.accent } as CSSProperties;

  const card = (
    <article
      style={accentStyle}
      className={`fable-game-card group h-full overflow-hidden rounded-lg border transition-[border-color,box-shadow,transform] duration-200 ease-out ${
        interactive
          ? "fable-surface-raised border-border hover:-translate-y-1 hover:border-primary/50 hover:shadow-elevation-2"
          : "fable-surface-flat border-border opacity-60"
      }`}
    >
      <div className="relative aspect-square overflow-hidden border-b border-border bg-surface-sunken">
        <StorefrontArtwork
          artworkKey={game.artworkKey}
          sources={preferredArtworkSources(game)}
          alt={game.artworkAlt}
          fallbackLabel={game.title}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 520px) 46vw, (max-width: 900px) 30vw, 180px"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.03]"
          fallbackClassName="absolute inset-0 h-full w-full"
          objectPosition={game.artworkPosition}
          objectFit="cover"
        />
      </div>

      <div className="grid gap-4 p-6">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <ResilientImage
            sources={preferredLogoSources(game)}
            alt={game.logoAlt}
            fallbackLabel={game.title}
            width={110}
            height={30}
            sizes="90px"
            className={`max-h-6 w-auto max-w-[7rem] object-contain object-left ${game.logoTreatment === "invert" ? "brightness-0 invert" : ""}`}
            fallbackClassName="h-6 w-8"
          />
          {!interactive ? <span className="rounded-lg border border-border bg-surface-sunken px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</span> : null}
        </div>
        <div className="grid gap-2">
          <h3 className="line-clamp-2 min-h-12 text-lg font-heading font-semibold leading-tight tracking-tight text-text-primary">{game.title}</h3>
          <p className="text-sm text-text-muted">{game.region?.label ?? game.category}</p>
        </div>
        <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="text-sm text-text-secondary">Starting from</p>
            <p className="mt-1 truncate text-base font-semibold text-primary">{price ?? game.packages[0] ?? label}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-sunken text-text-secondary transition-colors duration-150 ease-out group-hover:border-primary group-hover:bg-primary group-hover:text-white">
            <StorefrontIcon name="arrow" className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );

  if (interactive && game.href) {
    return (
      <Link
        href={game.href}
        className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken"
        aria-label={`${label} ${game.title}`}
      >
        {card}
      </Link>
    );
  }

  return <div className="h-full">{card}</div>;
}
