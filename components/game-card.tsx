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

  const card = (
    <article
      className={`group grid h-full gap-4 rounded-2xl border p-3 transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out sm:p-4 ${
        interactive
          ? "fable-surface-raised border-border bg-[linear-gradient(155deg,rgba(30,33,56,.96),rgba(14,16,29,.98))] hover:-translate-y-1 hover:border-primary/70 hover:shadow-elevation-2"
          : "fable-surface-flat border-border opacity-60"
      }`}
    >
      <div className="relative aspect-[1.16] overflow-hidden rounded-xl border border-[rgba(196,181,253,.18)] bg-surface-sunken shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
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
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-200/75">{category}</p>
            <h3 className="min-w-0 truncate text-[1.02rem] font-extrabold leading-5 tracking-[-0.02em] text-text-primary sm:text-lg">{title}</h3>
          </div>
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-surface-sunken text-text-muted transition-[border-color,color,background-color] group-hover:border-primary/70 group-hover:bg-primary/10 group-hover:text-primary">
            <StorefrontIcon name="arrow" className="h-3.5 w-3.5" />
          </span>
        </div>
        {price ? <p className="truncate text-[.72rem] font-medium text-text-secondary">From <DisplayPrice amountInrMinor={price} className="ml-1 text-[.86rem] font-extrabold text-violet-100" /></p> : <p className="text-[.72rem] font-medium text-text-secondary">Verified digital delivery</p>}
      </div>

      <div className="flex items-center gap-2 border-t border-white/[.09] pt-3">
        <span className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-extrabold tracking-[.01em] text-primary-foreground shadow-[0_8px_22px_rgba(155,124,255,.18)] transition-[background-color,box-shadow] group-hover:bg-primary-hover group-hover:shadow-[0_10px_28px_rgba(155,124,255,.28)]">{label}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Secure</span>
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
