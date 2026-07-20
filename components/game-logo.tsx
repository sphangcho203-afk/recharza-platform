/* eslint-disable @next/next/no-img-element */

import type { Game } from "@/lib/games";

type GameLogoProps = {
  game: Game;
  compact?: boolean;
  priority?: boolean;
};

export function GameLogo({ game, compact = false, priority = false }: GameLogoProps) {
  const treatment =
    game.logoTreatment === "invert"
      ? "brightness-0 invert"
      : game.logoTreatment === "light-panel"
        ? ""
        : "";

  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-2xl border border-white/10 ${
        compact ? "h-14 w-24 p-2" : "h-24 w-full p-4"
      } ${game.logoTreatment === "light-panel" ? "bg-white/95" : "bg-black/20"}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${game.glow}, transparent 68%)`,
        }}
      />
      <img
        src={game.logoSrc}
        alt={game.logoAlt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        className={`relative z-10 max-h-full max-w-full object-contain ${treatment}`}
      />
    </div>
  );
}
