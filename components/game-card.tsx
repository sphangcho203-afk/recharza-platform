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
  if (game.status === "catalogue") {
    return showDevelopmentBadges ? "Explore" : "Preview";
  }
  return showDevelopmentBadges ? "Coming soon" : "Unavailable";
}

function subtitle(game: Game) {
  if (game.region) return `${game.region.flag} ${game.region.label} market`;
  return game.publisher;
}

function logoTreatmentClass(game: Game) {
  if (game.logoTreatment === "invert") return "brightness-0 invert";
  return "";
}

export function GameCard({
  game,
  featured = false,
  showDevelopmentBadges = true,
  showPricingSnapshots = true,
}: GameCardProps) {
  const interactive = Boolean(game.available && game.href);
  const price =
    showPricingSnapshots && game.startingPriceInPaise
      ? `From ${formatInr(game.startingPriceInPaise)}`
      : null;
  const label = actionLabel(game, showDevelopmentBadges);
  const accentStyle = {
    "--game-accent": game.accent,
    boxShadow: `0 20px 55px rgba(0,0,0,.32), inset 0 0 0 1px ${game.accent}18`,
  } as CSSProperties;

  const card = (
    <article
      style={accentStyle}
      className={`group relative min-w-0 overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-[#080b12] transition duration-300 ${
        featured
          ? "aspect-[16/10] xl:aspect-[2.08/1]"
          : "aspect-[16/10]"
      } ${
        interactive
          ? "hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-[0_28px_75px_rgba(0,0,0,0.48)]"
          : "opacity-75"
      }`}
    >
      <StorefrontArtwork
        artworkKey={game.artworkKey}
        sources={game.artworkSources}
        alt={game.artworkAlt}
        fallbackLabel={game.title}
        className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-[1.035]"
        fallbackClassName="absolute inset-0 h-full w-full"
        objectPosition={game.artworkPosition}
      />
      <div
        className={`absolute inset-0 ${
          featured
            ? "bg-[linear-gradient(90deg,rgba(3,6,13,0.96)_0%,rgba(3,6,13,0.75)_42%,rgba(3,6,13,0.08)_82%)]"
            : "bg-[linear-gradient(180deg,rgba(3,6,13,0.06)_0%,rgba(3,6,13,0.14)_38%,rgba(3,6,13,0.96)_100%)]"
        }`}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] opacity-90"
        style={{ background: `linear-gradient(90deg, ${game.accent}, transparent 68%)` }}
      />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
        <span className="max-w-[62%] truncate rounded-lg border border-white/[0.1] bg-black/55 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-white/90 backdrop-blur-xl sm:text-[9px]">
          {game.category}
        </span>
        <span
          className={`inline-flex min-h-7 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] backdrop-blur-xl sm:text-[9px] ${
            interactive
              ? "border-emerald-300/20 bg-emerald-950/65 text-emerald-100"
              : "border-white/[0.09] bg-black/55 text-slate-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              interactive ? "bg-emerald-300" : "bg-slate-600"
            }`}
          />
          {interactive ? "Available" : label}
        </span>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 ${
          featured ? "max-w-xl xl:inset-y-0 xl:left-0 xl:right-auto xl:w-[58%] xl:items-center xl:py-8" : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex h-8 w-fit max-w-[8.75rem] items-center overflow-hidden rounded-lg border border-white/[0.1] bg-black/55 px-2.5 backdrop-blur-xl">
            <ResilientImage
              sources={game.logoSources}
              alt={game.logoAlt}
              fallbackLabel={game.title}
              className={`h-5 w-auto max-w-[7.25rem] object-contain ${logoTreatmentClass(game)}`}
              fallbackClassName="h-5 w-8"
            />
          </div>
          <p className="truncate text-[9px] font-black uppercase tracking-[0.15em] text-white/65 sm:text-[10px]">
            {subtitle(game)}
          </p>
          <h3
            className={`mt-1 font-black leading-[1.03] tracking-[-0.04em] text-white ${
              featured ? "text-2xl sm:text-3xl xl:text-4xl" : "text-xl sm:text-2xl"
            }`}
          >
            {game.title}
          </h3>

          {featured ? (
            <p className="mt-3 hidden max-w-md text-sm leading-6 text-slate-300/75 sm:block">
              {game.packages.slice(0, 3).join(" · ")}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {price ? (
              <span className="rounded-lg border border-emerald-300/15 bg-emerald-950/60 px-2.5 py-1.5 text-[9px] font-black text-emerald-100 backdrop-blur sm:text-[10px]">
                {price}
              </span>
            ) : game.packages[0] ? (
              <span className="max-w-[10rem] truncate rounded-lg border border-white/[0.09] bg-black/45 px-2.5 py-1.5 text-[9px] font-bold text-slate-300 backdrop-blur sm:text-[10px]">
                {game.packages[0]}
              </span>
            ) : null}

            {game.region ? (
              <span className="rounded-lg border border-white/[0.09] bg-black/45 px-2.5 py-1.5 text-[9px] font-bold text-slate-300 backdrop-blur sm:text-[10px]">
                {game.region.defaultCurrency}
              </span>
            ) : null}
          </div>
        </div>

        <span
          className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 text-xs font-black backdrop-blur transition ${
            interactive
              ? "border-white/[0.16] bg-white text-slate-950 group-hover:-translate-y-0.5"
              : "border-white/[0.09] bg-black/45 text-slate-500"
          }`}
          aria-hidden="true"
        >
          <span className={featured ? "inline" : "hidden sm:inline"}>{label}</span>
          {interactive ? (
            <StorefrontIcon
              name="arrow"
              className="h-4 w-4 transition group-hover:translate-x-0.5"
            />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          )}
        </span>
      </div>

      <span className="sr-only">{label}</span>
    </article>
  );

  if (interactive && game.href) {
    return (
      <Link
        href={game.href}
        className="block min-w-0 rounded-[1.35rem] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#06060f]"
        aria-label={`${label} ${game.title}${
          game.region ? ` for ${game.region.label}` : ""
        }`}
      >
        {card}
      </Link>
    );
  }

  return <div className="min-w-0">{card}</div>;
}
