import Link from "next/link";

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
  const isRegional = game.kind === "mobile-legends-region";
  const title = isRegional ? game.region?.label ?? game.title : game.title;
  const category = isRegional ? "Mobile Legends" : game.category;

  const card = (
    <article
      className={`group grid h-full gap-3 rounded-lg border p-3 transition-[border-color,box-shadow,transform] duration-200 ease-out sm:p-4 ${
        interactive
          ? "fable-surface-raised border-border hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elevation-1"
          : "fable-surface-flat border-border opacity-60"
      }`}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-sunken">
        <StorefrontArtwork
          artworkKey={game.artworkKey}
          sources={preferredArtworkSources(game)}
          alt={game.artworkAlt}
          fallbackLabel={title}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 639px) 44vw, (max-width: 1023px) 29vw, (max-width: 1279px) 18vw, 15vw"
          className="h-full w-full object-cover transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.03]"
          fallbackClassName="h-full w-full"
          objectPosition={game.artworkPosition}
          objectFit="cover"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold leading-5 text-text-primary sm:text-base">{title}</h3>
        </div>
        <p className="truncate text-xs font-medium text-text-muted">{category}</p>
        {price ? <p className="truncate text-xs text-text-secondary">From <span className="font-semibold text-primary">{price}</span></p> : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <span className="truncate text-xs font-semibold text-text-secondary">{label}</span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-sunken text-text-secondary transition-[background-color,border-color,color] duration-150 ease-out group-hover:border-primary group-hover:bg-primary group-hover:text-white">
          <StorefrontIcon name="arrow" className="h-3.5 w-3.5" />
        </span>
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
