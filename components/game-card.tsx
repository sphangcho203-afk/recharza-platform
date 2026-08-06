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
  return showDevelopmentBadges ? "Coming soon" : "Unavailable";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function preferredArtworkSources(game: Game) {
  const remote = game.artworkSources.filter((source) => source.startsWith("https://"));
  const localCovers = game.artworkSources.filter(
    (source) => source.startsWith("/") && !source.includes("/assets/founder/"),
  );
  const founder = game.artworkSources.filter((source) => source.includes("/assets/founder/"));

  if (game.slug === "call-of-duty-mobile") {
    return unique([...localCovers, ...remote, ...founder]);
  }

  return unique([...remote, ...localCovers, ...founder]);
}

function preferredLogoSources(game: Game) {
  const actualLogos = game.logoSources.filter((source) => !source.includes("/assets/founder/"));
  const founder = game.logoSources.filter((source) => source.includes("/assets/founder/"));
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
  const badge = interactive ? "Available" : label;

  const card = (
    <article
      style={accentStyle}
      className={`group h-full overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-[#090b12] transition duration-200 ${
        interactive
          ? "hover:-translate-y-1 hover:border-[color:var(--game-accent)] hover:shadow-[0_22px_70px_rgba(0,0,0,0.48)]"
          : "opacity-75"
      }`}
    >
      <div
        className={`relative overflow-hidden bg-[#0b0e16] ${
          variant === "rail" ? "aspect-[4/5]" : "aspect-[16/10] sm:aspect-[4/3]"
        }`}
      >
        <StorefrontArtwork
          artworkKey={game.artworkKey}
          sources={artworkSources}
          alt={game.artworkAlt}
          fallbackLabel={game.title}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes={
            variant === "rail"
              ? "(max-width: 919px) 78vw, (max-width: 1099px) 42vw, 24vw"
              : "(max-width: 919px) 100vw, (max-width: 1099px) 50vw, 33vw"
          }
          className="absolute inset-0 h-full w-full transition-transform duration-300 motion-safe:group-hover:scale-[1.035]"
          fallbackClassName="absolute inset-0 h-full w-full"
          objectPosition={game.artworkPosition}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/10 to-black/5" />

        <span
          className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] backdrop-blur-xl ${
            interactive
              ? "border-emerald-300/20 bg-emerald-950/70 text-emerald-100"
              : "border-white/[0.1] bg-black/65 text-slate-300"
          }`}
        >
          {badge}
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div className="flex min-h-11 max-w-[70%] items-center rounded-xl border border-white/[0.12] bg-black/68 px-3 py-2 backdrop-blur-xl">
            <ResilientImage
              sources={logoSources}
              alt={game.logoAlt}
              fallbackLabel={game.title}
              width={240}
              height={96}
              sizes="160px"
              className={`max-h-7 w-auto max-w-[9rem] object-contain ${logoTreatmentClass(game)}`}
              fallbackClassName="h-7 w-12"
            />
          </div>
          {game.region ? (
            <span className="rounded-full border border-white/[0.12] bg-black/68 px-2.5 py-1.5 text-[10px] font-black text-white backdrop-blur-xl">
              {game.region.flag} {game.region.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {game.region ? `${game.region.label} market` : game.publisher}
            </p>
            <h3 className="mt-1.5 text-lg font-black leading-6 tracking-[-0.03em] text-white">
              {game.title}
            </h3>
          </div>
          <span
            aria-hidden="true"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition ${
              interactive
                ? "border-white bg-white text-slate-950 group-hover:bg-cyan-50"
                : "border-white/[0.08] bg-white/[0.03] text-slate-600"
            }`}
          >
            <StorefrontIcon name="arrow" className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.07] pt-3">
          <div>
            <p className="text-sm font-black" style={{ color: game.accent }}>
              {price ?? game.packages[0] ?? label}
            </p>
            <p className="mt-1 text-[10px] font-bold text-slate-600">{game.category}</p>
          </div>
          <span className="text-xs font-black text-slate-400">{label}</span>
        </div>
      </div>
    </article>
  );

  if (interactive && game.href) {
    return (
      <Link
        href={game.href}
        className="block h-full rounded-[1.35rem] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#05060b]"
        aria-label={`${label} ${game.title}${game.region ? ` for ${game.region.label}` : ""}`}
      >
        {card}
      </Link>
    );
  }

  return <div className="h-full">{card}</div>;
}
