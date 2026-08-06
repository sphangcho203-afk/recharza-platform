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
  if (game.status === "catalogue") {
    return showDevelopmentBadges ? "Explore" : "Preview";
  }
  return showDevelopmentBadges ? "Soon" : "Unavailable";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function preferredArtworkSources(game: Game) {
  const remote = game.artworkSources.filter((source) =>
    source.startsWith("https://"),
  );
  const localCovers = game.artworkSources.filter(
    (source) =>
      source.startsWith("/") && !source.includes("/assets/founder/"),
  );
  const founder = game.artworkSources.filter((source) =>
    source.includes("/assets/founder/"),
  );

  if (game.slug === "call-of-duty-mobile") {
    return unique([...localCovers, ...remote, ...founder]);
  }

  return unique([...remote, ...localCovers, ...founder]);
}

function preferredLogoSources(game: Game) {
  const actualLogos = game.logoSources.filter(
    (source) => !source.includes("/assets/founder/"),
  );
  const founder = game.logoSources.filter((source) =>
    source.includes("/assets/founder/"),
  );
  return unique([...actualLogos, ...founder]);
}

function logoTreatmentClass(game: Game) {
  return game.logoTreatment === "invert" ? "brightness-0 invert" : "";
}

export function GameCard({
  game,
  variant = "feed",
  priority = false,
  showDevelopmentBadges = true,
  showPricingSnapshots = true,
}: GameCardProps) {
  const interactive = Boolean(game.available && game.href);
  const label = actionLabel(game, showDevelopmentBadges);
  const price =
    showPricingSnapshots && game.startingPriceInPaise
      ? `From ${formatInr(game.startingPriceInPaise)}`
      : null;
  const accentStyle = { "--game-accent": game.accent } as CSSProperties;
  const artworkSources = preferredArtworkSources(game);
  const logoSources = preferredLogoSources(game);

  const card = (
    <article
      style={accentStyle}
      className={`group h-full overflow-hidden rounded-2xl border bg-[#090b12] transition duration-200 ${
        interactive
          ? "border-white/[0.09] hover:border-[color:var(--game-accent)]"
          : "border-white/[0.07] opacity-70"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b border-white/[0.07] bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.09),transparent_58%),#080a11]">
        <StorefrontArtwork
          artworkKey={game.artworkKey}
          sources={artworkSources}
          alt={game.artworkAlt}
          fallbackLabel={game.title}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes={
            variant === "rail"
              ? "(max-width: 919px) 64vw, 16rem"
              : "(max-width: 639px) 50vw, (max-width: 1099px) 33vw, 25vw"
          }
          className="absolute inset-3 transition-transform duration-200 motion-safe:group-hover:scale-[1.02] sm:inset-4"
          fallbackClassName="absolute inset-0 h-full w-full"
          objectPosition={game.artworkPosition}
          objectFit="contain"
        />

        <span
          className={`absolute right-2.5 top-2.5 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.11em] backdrop-blur-xl ${
            interactive
              ? "border-emerald-300/20 bg-emerald-950/75 text-emerald-100"
              : "border-white/[0.1] bg-black/70 text-slate-400"
          }`}
        >
          {interactive ? "Live" : label}
        </span>
      </div>

      <div className="p-3 sm:p-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-5 max-w-[4.75rem] shrink-0 items-center">
            <ResilientImage
              sources={logoSources}
              alt={game.logoAlt}
              fallbackLabel={game.title}
              width={100}
              height={32}
              sizes="76px"
              className={`max-h-4 w-auto max-w-[4.75rem] object-contain ${logoTreatmentClass(
                game,
              )}`}
              fallbackClassName="h-4 w-7"
            />
          </span>
          <p className="min-w-0 truncate text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
            {game.region ? game.region.label : game.publisher}
          </p>
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-black leading-5 tracking-[-0.025em] text-white sm:text-base">
          {game.title}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
          <div className="min-w-0">
            <p
              className="truncate text-xs font-black sm:text-sm"
              style={{ color: game.accent }}
            >
              {price ?? game.packages[0] ?? label}
            </p>
            <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-600">
              {game.category}
            </p>
          </div>
          <span
            aria-hidden="true"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
              interactive
                ? "border-white/[0.12] bg-white text-slate-950"
                : "border-white/[0.07] text-slate-600"
            }`}
          >
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
        className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-3 focus-visible:ring-offset-[#05060b]"
        aria-label={`${label} ${game.title}${
          game.region ? ` for ${game.region.label}` : ""
        }`}
      >
        {card}
      </Link>
    );
  }

  return <div className="h-full">{card}</div>;
}
