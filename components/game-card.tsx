import type { CSSProperties } from "react";
import Link from "next/link";

import { ResilientImage } from "@/components/resilient-image";
import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
  featured?: boolean;
  showDevelopmentBadges?: boolean;
  showPricingSnapshots?: boolean;
};

function actionLabel(game: Game, showDevelopmentBadges: boolean) {
  if (game.status === "checkout") return "Top up";
  if (game.status === "catalogue") return showDevelopmentBadges ? "Explore" : "Preview";
  return showDevelopmentBadges ? "Coming soon" : "Unavailable";
}

function subtitle(game: Game) {
  if (game.region) return `${game.region.flag} ${game.region.label}`;
  return game.publisher;
}

function logoTreatmentClass(game: Game) {
  return game.logoTreatment === "invert" ? "brightness-0 invert" : "";
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
  const label = actionLabel(game, showDevelopmentBadges);
  const badge =
    game.badge ??
    (game.region
      ? `${game.region.flag} ${game.region.code.toUpperCase()}`
      : interactive
        ? "Live"
        : label);
  const accentStyle = {
    "--game-accent": game.accent,
  } as CSSProperties;

  const card = (
    <article
      style={accentStyle}
      className={`group storefront-card h-full min-w-0 overflow-hidden rounded-2xl border bg-[#0a0c14] transition duration-200 ${
        interactive
          ? "border-white/[0.09] hover:-translate-y-1 hover:border-[color:var(--game-accent)] hover:shadow-[0_18px_55px_rgba(0,0,0,0.45)]"
          : "border-white/[0.07] opacity-75"
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#0d1019]">
        <StorefrontArtwork
          artworkKey={game.artworkKey}
          sources={game.artworkSources}
          alt={game.artworkAlt}
          fallbackLabel={game.title}
          sizes="(max-width: 767px) 50vw, (max-width: 1023px) 25vw, 20vw"
          className="absolute inset-0 h-full w-full transition-transform duration-200 motion-safe:group-hover:scale-105"
          fallbackClassName="absolute inset-0 h-full w-full"
          objectPosition={game.artworkPosition}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070810] via-transparent to-black/10" />
        <span className="absolute right-2.5 top-2.5 max-w-[75%] truncate rounded-lg border border-white/[0.12] bg-black/65 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-xl">
          {badge}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="relative flex h-8 w-fit max-w-[8rem] items-center overflow-hidden rounded-lg border border-white/[0.1] bg-black/60 px-2.5 backdrop-blur-xl">
            <ResilientImage
              sources={game.logoSources}
              alt={game.logoAlt}
              fallbackLabel={game.title}
              width={180}
              height={64}
              sizes="128px"
              className={`h-5 w-auto max-w-[7rem] object-contain ${logoTreatmentClass(game)}`}
              fallbackClassName="h-5 w-8"
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-[8.6rem] flex-col p-3.5 sm:p-4">
        <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]">
          {subtitle(game)}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-sm font-black leading-5 tracking-[-0.025em] text-white sm:text-base">
          {game.title}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {price ? (
              <p
                className="truncate text-xs font-black sm:text-sm"
                style={{ color: game.accent }}
              >
                {price}
              </p>
            ) : (
              <p className="truncate text-[10px] font-bold text-slate-500 sm:text-xs">
                {game.packages[0] ?? label}
              </p>
            )}
            <p className="mt-1 truncate text-[9px] font-bold text-slate-600">
              {game.category}
            </p>
          </div>
          <span
            aria-hidden="true"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
              interactive
                ? "border-white/[0.1] bg-white text-slate-950 group-hover:bg-cyan-50"
                : "border-white/[0.08] bg-white/[0.03] text-slate-600"
            }`}
          >
            <StorefrontIcon name="arrow" className="h-4 w-4" />
          </span>
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </article>
  );

  if (interactive && game.href) {
    return (
      <Link
        href={game.href}
        className="block h-full min-w-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#06060f]"
        aria-label={`${label} ${game.title}${game.region ? ` for ${game.region.label}` : ""}`}
      >
        {card}
      </Link>
    );
  }

  return <div className="h-full min-w-0">{card}</div>;
}
