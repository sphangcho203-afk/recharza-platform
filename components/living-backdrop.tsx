"use client";

/**
 * Living design primitives for Recharza surfaces — restrained edition.
 * Craft comes from light, layout and motion quality, not decoration density.
 * CSS-driven (no canvas) so they stay cheap on mobile. All animations respect
 * prefers-reduced-motion. Accents come from game.accent tokens.
 */

import type { CSSProperties } from "react";

/** Slow, barely-there aurora: one wide soft orb that shifts light across a section. */
export function AuroraGradient({
  accent,
  secondary,
  seed = 0,
  intensity = 1,
  className = "",
}: {
  accent: string;
  secondary?: string;
  seed?: number;
  intensity?: number;
  className?: string;
}) {
  const op = (base: number) => Math.min(1, base * intensity);
  const orbs = [
    { color: accent, x: "12%", y: "-20%", size: "clamp(280px, 40vw, 620px)", delay: `${-seed * 3}s`, drift: "recharza-aurora-drift-a", opacity: op(0.1) },
    { color: secondary ?? accent, x: "84%", y: "-30%", size: "clamp(220px, 30vw, 520px)", delay: `${-seed * 3 - 5}s`, drift: "recharza-aurora-drift-b", opacity: op(0.07) },
  ];
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {orbs.map((orb, index) => (
        <span
          key={index}
          className={orb.drift}
          style={{
            position: "absolute",
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle at 32% 28%, ${orb.color}, transparent 70%)`,
            filter: "blur(72px)",
            opacity: orb.opacity,
            animationDelay: orb.delay,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}

/** Living card wrapper: quiet glass base, single accent hairline that fills on hover. */
export function LiveGlowCard({
  accent,
  className = "",
  style,
  children,
}: {
  accent: string;
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`relative block h-full rounded-xl border border-white/[0.07] bg-[linear-gradient(160deg,rgba(28,31,50,.9),rgba(13,15,25,.95))] shadow-[0_14px_36px_rgba(0,0,0,.26)] overflow-hidden ${className}`}
      style={{ ...style, ["--live-accent" as string]: accent }}
    >
      <span
        className="absolute inset-x-0 top-0 h-px opacity-50 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 55%, transparent) 50%, transparent)` }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
