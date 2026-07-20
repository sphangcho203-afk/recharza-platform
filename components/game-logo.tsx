import { ResilientImage } from "@/components/resilient-image";
import type { Game } from "@/lib/games";

type GameLogoProps = {
  game: Game;
  compact?: boolean;
  priority?: boolean;
  bare?: boolean;
};

export function GameLogo({
  game,
  compact = false,
  priority = false,
  bare = false,
}: GameLogoProps) {
  const treatment =
    game.logoTreatment === "invert"
      ? "brightness-0 invert"
      : game.logoTreatment === "light-panel"
        ? ""
        : "";

  const image = (
    <ResilientImage
      sources={game.logoSources}
      alt={game.logoAlt}
      loading={priority ? "eager" : "lazy"}
      className={`max-h-full max-w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.34)] ${treatment}`}
      fallbackClassName="h-full w-full rounded-xl"
    />
  );

  if (bare) {
    return image;
  }

  return (
    <div
      className={`relative grid place-items-center overflow-hidden border border-white/10 backdrop-blur-md ${
        compact ? "h-11 w-24 rounded-xl px-2 py-1.5" : "h-16 w-36 rounded-2xl px-3 py-2"
      } ${game.logoTreatment === "light-panel" ? "bg-white/95" : "bg-black/35"}`}
    >
      {image}
    </div>
  );
}
