import Link from "next/link";

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

  const card = (
    <article
      className={`group relative min-w-0 overflow-hidden rounded-[1.6rem] border border-white/[0.09] bg-[#0a0d16] shadow-[0_18px_55px_rgba(0,0,0,0.3)] transition duration-300 ${
        featured
          ? "aspect-[16/10] xl:aspect-[2.08/1]"
          : "aspect-[16/10]"
      } ${
        interactive
          ? "hover:-translate-y-1 hover:border-violet-300/25 hover:shadow-[0_28px_75px_rgba(16,8,38,0.42)]"
          : "opacity-80"
      }`}
    >
      <StorefrontArtwork
        artworkKey={game.artworkKey}
        sources={[...game.artworkSources, ...game.logoSources]}
        alt={game.artworkAlt}
        fallbackLabel={game.title}
        className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-[1.045]"
        fallbackClassName="absolute inset-0 h-full w-full"
        objectPosition={game.artworkPosition}
      />
      <div
        className={`absolute inset-0 ${
          featured
            ? "bg-[linear-gradient(90deg,rgba(3,6,13,0.96)_0%,rgba(3,6,13,0.78)_39%,rgba(3,6,13,0.12)_78%)]"
            : "bg-[linear-gradient(180deg,rgba(3,6,13,0.08)_0%,rgba(3,6,13,0.18)_38%,rgba(3,6,13,0.94)_100%)]"
        }`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(124,58,237,0.11),transparent_40%,rgba(34,211,238,0.04))] opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3.5 sm:p-4">
        <span className="max-w-[64%] truncate rounded-xl border border-white/[0.1] bg-black/48 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/85 backdrop-blur-xl">
          {game.category}
        </span>
        <span
          className={`inline-flex min-h-7 items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] backdrop-blur-xl ${
            interactive
              ? "border-emerald-300/15 bg-emerald-300/[0.09] text-emerald-100"
              : "border-white/[0.09] bg-black/45 text-slate-400"
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
        className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5 ${
          featured ? "max-w-xl xl:inset-y-0 xl:left-0 xl:right-auto xl:w-[58%] xl:items-center xl:py-8" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-violet-200/90">
            {subtitle(game)}
          </p>
          <h3
            className={`mt-1.5 font-black leading-[1.02] tracking-[-0.04em] text-white ${
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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {price ? (
              <span className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.1] px-2.5 py-1.5 text-[10px] font-black text-emerald-100 backdrop-blur">
                {price}
              </span>
            ) : game.packages[0] ? (
              <span className="max-w-[11rem] truncate rounded-xl border border-white/[0.09] bg-black/35 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                {game.packages[0]}
              </span>
            ) : null}

            {game.region ? (
              <span className="rounded-xl border border-white/[0.09] bg-black/35 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 backdrop-blur">
                {game.region.defaultCurrency}
              </span>
            ) : null}
          </div>
        </div>

        <span
          className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border px-3.5 text-xs font-black backdrop-blur transition ${
            interactive
              ? "border-white/[0.14] bg-white text-slate-950 group-hover:bg-violet-100"
              : "border-white/[0.09] bg-black/40 text-slate-500"
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
        className="block min-w-0 rounded-[1.6rem] outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#06060f]"
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
