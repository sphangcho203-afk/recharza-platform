import type { CSSProperties } from "react";
import Link from "next/link";

import { ResilientImage } from "@/components/resilient-image";
import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type GameCardProps = {
  game: Game;
  variant?: "rail" | "feed";
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
}: GameCardProps) {
  const interactive = Boolean(game.available && game.href);
  const label = actionLabel(game, showDevelopmentBadges);
  const price = showPricingSnapshots && game.startingPriceInPaise
    ? formatInr(game.startingPriceInPaise)
    : null;
  const accentStyle = { "--game-accent": game.accent } as CSSProperties;

  const card = (
    <article
      style={accentStyle}
      className={`storefront-card group h-full overflow-hidden rounded-xl border bg-[#0d0f16] transition duration-200 ${
        interactive
          ? "border-white/[0.08] hover:-translate-y-0.5 hover:border-white/[0.18] hover:shadow-[0_14px_36px_rgba(0,0,0,0.28)]"
          : "border-white/[0.06] opacity-65"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-[#12151e]">
        <StorefrontArtwork
          artworkKey={game.artworkKey}
          sources={preferredArtworkSources(game)}
          alt={game.artworkAlt}
          fallbackLabel={game.title}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 520px) 46vw, (max-width: 900px) 30vw, 180px"
          className="absolute inset-0 h-full w-full transition-transform duration-300 motion-safe:group-hover:scale-[1.035]"
          fallbackClassName="absolute inset-0 h-full w-full"
          objectPosition={game.artworkPosition}
          objectFit="cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent" />
        <span className="absolute bottom-2.5 left-2.5 flex h-6 max-w-[6.25rem] items-center rounded-md bg-black/55 px-2 backdrop-blur-md">
          <ResilientImage
            sources={preferredLogoSources(game)}
            alt={game.logoAlt}
            fallbackLabel={game.title}
            width={110}
            height={30}
            sizes="90px"
            className={`max-h-4 w-auto max-w-[5rem] object-contain ${game.logoTreatment === "invert" ? "brightness-0 invert" : ""}`}
            fallbackClassName="h-4 w-7"
          />
        </span>
        {!interactive ? (
          <span className="absolute right-2.5 top-2.5 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-300">
            {label}
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 text-[13px] font-black leading-5 tracking-[-0.015em] text-white sm:text-sm">
          {game.title}
        </h3>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500">Starting from</p>
            <p className="mt-0.5 truncate text-sm font-black" style={{ color: game.accent }}>
              {price ?? game.packages[0] ?? label}
            </p>
          </div>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-slate-400 transition group-hover:border-violet-300/30 group-hover:bg-violet-300 group-hover:text-slate-950">
            <StorefrontIcon name="arrow" className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );

  if (interactive && game.href) {
    return (
      <Link
        href={game.href}
        className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080c]"
        aria-label={`${label} ${game.title}`}
      >
        {card}
      </Link>
    );
  }

  return <div className="h-full">{card}</div>;
}
