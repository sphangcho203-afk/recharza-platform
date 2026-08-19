"use client";

/**
 * Living design primitives for Recharza surfaces.
 * CSS-driven (no canvas) so they stay cheap on mobile. All animations respect
 * prefers-reduced-motion. Accents come from game.accent tokens.
 */

import type { CSSProperties } from "react";

/** Slow aurora: 3 soft blurred orbs drifting on a section. */
export function AuroraGradient({
  accent,
  secondary,
  seed = 0,
  intensity = 1,
  className = "",
  children,
}: {
  accent: string;
  secondary?: string;
  seed?: number;
  intensity?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const op = (base: number) => Math.min(1, base * intensity);
  const orbs = [
    { color: accent, x: "8%", y: "12%", size: "clamp(220px, 34vw, 560px)", delay: `${-seed * 3}s`, drift: "recharza-aurora-drift-a", opacity: op(0.16) },
    { color: secondary ?? accent, x: "82%", y: "6%", size: "clamp(180px, 26vw, 460px)", delay: `${-seed * 3 - 4}s`, drift: "recharza-aurora-drift-b", opacity: op(0.13) },
    { color: "#ffffff", x: "46%", y: "88%", size: "clamp(240px, 30vw, 520px)", delay: `${-seed * 3 - 7}s`, drift: "recharza-aurora-drift-c", opacity: op(0.05) },
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
            background: `radial-gradient(circle at 32% 28%, ${orb.color}, transparent 68%)`,
            filter: "blur(60px)",
            opacity: orb.opacity,
            animationDelay: orb.delay,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}

/** Floating particles: small glowing dots with staggered parallax drift. */
export function ParticleField({
  accent,
  count = 10,
  seed = 0,
  className = "",
}: {
  accent: string;
  count?: number;
  seed?: number;
  className?: string;
}) {
  // Deterministic pseudo-random placement so layout never shifts between renders.
  const particles = Array.from({ length: count }, (_, index) => {
    const a = (index * 9301 + 49297) % 233280;
    const rand = (value: number) => a / 233280 * (value % 1 + Math.floor(value));
    const x = ((index * 37 + seed * 71) % 100);
    const y = ((index * 53 + seed * 97) % 100);
    const size = index % 3 === 0 ? 5 : index % 3 === 1 ? 3 : 2;
    const duration = 9 + (index % 6);
    const delay = -(index + seed * 3);
    const opacity = 0.55 - (index % 4) * 0.11;
    void rand;
    return { x, y, size, duration, delay, opacity };
  });
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          key={index}
          className="recharza-particle"
          style={{
            position: "absolute",
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 ${particle.size * 3}px ${accent}`,
            opacity: particle.opacity,
            animation: `recharza-particle-float ${particle.duration}s ease-in-out ${particle.delay}s infinite alternate`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}

/** Thin electric line sweep across a card's top edge (brand 'R' energy motif). */
export function ElectricSweep({ accent, className = "" }: { accent: string; className?: string }) {
  return (
    <span className={`absolute inset-x-0 top-0 h-[1.5px] overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <span
        className="recharza-sweep"
        style={{
          display: "block",
          width: "60%",
          height: "100%",
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          boxShadow: `0 0 10px ${accent}`,
          animation: "recharza-line-sweep 4.6s ease-in-out infinite",
          willChange: "transform",
        }}
      />
    </span>
  );
}

/** Living card wrapper: glass base + animated accent edge glow on hover. */
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
      className={`relative block h-full rounded-xl border border-white/[0.08] bg-[linear-gradient(160deg,rgba(30,33,56,.92),rgba(13,15,25,.96))] shadow-[0_18px_46px_rgba(0,0,0,.32)] overflow-hidden ${className}`}
      style={{ ...style, ["--live-accent" as string]: accent }}
    >
      <span
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 38%, transparent), 0 0 34px -10px ${accent}`,
        }}
        aria-hidden="true"
      />
      <span className="recharza-sheen" aria-hidden="true" />
      {children}
    </span>
  );
}
