"use client";

import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";

function Tile({
  game,
  icon,
  label,
  seed,
  children,
}: {
  game: Game;
  icon: "coin" | "id" | "cart" | "support";
  label: string;
  seed: number;
  children: React.ReactNode;
}) {
  const accent = game.accent ?? "#9b7cff";
  const drifts = [
    { left: "-18%", top: "-26%", w: "92%", h: "96%", dur: `${12 + seed * 2}s`, delay: `${-seed * 4}s` },
    { left: "78%", top: "72%", w: "72%", h: "78%", dur: `${15 + seed * 2}s`, delay: `${-seed * 6 - 3}s` },
  ];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[linear-gradient(162deg,rgba(30,33,56,.92),rgba(13,15,25,.96))] p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,.28)]">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {drifts.map((orb, index) => (
          <span
            key={index}
            style={{
              position: "absolute",
              left: orb.left,
              top: orb.top,
              width: orb.w,
              height: orb.h,
              borderRadius: "50%",
              background: `radial-gradient(circle at 34% 30%, ${accent}, transparent 70%)`,
              filter: "blur(56px)",
              opacity: 0.12,
              animation: `recharza-aurora-drift-a ${orb.dur} ease-in-out ${orb.delay} infinite alternate`,
              willChange: "transform, opacity",
            }}
          />
        ))}
        <span style={{ position: "absolute", left: "76%", top: "20%", width: 4, height: 4, borderRadius: "50%", background: accent, boxShadow: `0 0 10px ${accent}`, opacity: 0.65, animation: `recharza-particle-float 9s ease-in-out ${-seed * 3}s infinite alternate`, willChange: "transform" }} />
        <span style={{ position: "absolute", left: "30%", top: "78%", width: 3, height: 3, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}`, opacity: 0.45, animation: `recharza-particle-float 12s ease-in-out ${-seed * 5 - 2}s infinite alternate`, willChange: "transform" }} />
      </span>
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[1.5px] overflow-hidden">
        <span style={{ display: "block", width: "55%", height: "100%", background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 10px ${accent}`, animation: `recharza-line-sweep 5.4s ease-in-out ${-seed * 1.6}s infinite`, willChange: "transform" }} />
      </span>
      <div className="relative flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105" style={{ background: `radial-gradient(circle at 30% 22%, ${accent}55, ${accent}18)`, color: accent, boxShadow: `0 0 22px -8px ${accent}` }}>
          <StorefrontIcon name={icon} className="h-5 w-5" />
        </span>
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.09em] text-white/85">{label}</h3>
      </div>
      <div className="relative mt-4 text-[13px] leading-[1.75] text-white/70">{children}</div>
    </div>
  );
}

export function GameEducationSection({
  game,
}: {
  game: Game;
}) {
  if (!game.education) return null;
  const { about, currencyUses, findId, steps, regionNote } = game.education;
  const accent = game.accent ?? "#9b7cff";

  return (
    <section className="mt-10" aria-label={`About ${game.title}`}>
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[linear-gradient(162deg,rgba(24,27,48,.95),rgba(10,12,20,.98))] p-5 shadow-[0_24px_60px_rgba(0,0,0,.35)] sm:p-7">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <span style={{ position: "absolute", left: "-14%", top: "-30%", width: "84%", height: "100%", borderRadius: "50%", background: `radial-gradient(circle at 34% 30%, ${accent}, transparent 70%)`, filter: "blur(64px)", opacity: 0.14, animation: "recharza-aurora-drift-b 16s ease-in-out -3s infinite alternate", willChange: "transform, opacity" }} />
          <span style={{ position: "absolute", right: "-18%", bottom: "-36%", width: "76%", height: "100%", borderRadius: "50%", background: `radial-gradient(circle at 60% 66%, rgba(139,92,246,.85), transparent 72%)`, filter: "blur(70px)", opacity: 0.1, animation: "recharza-aurora-drift-c 19s ease-in-out -9s infinite alternate", willChange: "transform, opacity" }} />
          {[
            { left: "86%", top: "14%", size: 4, delay: 0, opacity: 0.6 },
            { left: "68%", top: "44%", size: 3, delay: -2, opacity: 0.45 },
            { left: "12%", top: "58%", size: 3, delay: -5, opacity: 0.4 },
            { left: "42%", top: "84%", size: 2, delay: -8, opacity: 0.35 },
          ].map((dot, index) => (
            <span key={index} style={{ position: "absolute", left: dot.left, top: dot.top, width: dot.size, height: dot.size, borderRadius: "50%", background: accent, boxShadow: `0 0 ${dot.size * 3}px ${accent}`, opacity: dot.opacity, animation: `recharza-particle-float ${9 + index * 2}s ease-in-out ${dot.delay}s infinite alternate`, willChange: "transform" }} />
          ))}
        </span>
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[1.5px] overflow-hidden">
          <span style={{ display: "block", width: "60%", height: "100%", background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 12px ${accent}`, animation: "recharza-line-sweep 5.8s ease-in-out infinite", willChange: "transform" }} />
        </span>

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `radial-gradient(circle at 30% 22%, ${accent}66, ${accent}22)`, boxShadow: `0 0 26px -6px ${accent}` }}>
            <StorefrontIcon name="info" className="h-5 w-5" style={{ color: accent } as React.CSSProperties} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${accent}aa` }}>Know the game</p>
            <h2 className="text-[17px] font-semibold text-white">About {game.title}</h2>
          </div>
        </div>
        <p className="relative mt-3 text-[13.5px] leading-[1.75] text-white/75">{about}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tile game={game} icon="coin" label="What it buys" seed={1}>
            {currencyUses}
          </Tile>
          <Tile game={game} icon="id" label="Find your ID" seed={2}>
            {findId}
          </Tile>
          <Tile game={game} icon="cart" label="How to purchase" seed={3}>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="relative flex gap-3">
                  <span className="flex flex-col items-center">
                    <span className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-[#0b0d14] shadow-[0_0_14px]" style={{ backgroundColor: accent, boxShadow: `0 0 14px ${accent}66` }}>{index + 1}</span>
                    {index < steps.length - 1 && <span className="mt-1 w-px flex-1 opacity-30" style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 pb-0.5 leading-[1.65]">{step}</span>
                </li>
              ))}
            </ol>
          </Tile>
        </div>

        {regionNote ? (
          <div className="relative mt-6 overflow-hidden rounded-xl border border-amber-300/15 bg-[linear-gradient(135deg,rgba(217,119,6,.09),rgba(13,15,25,.6))] px-4 py-3.5 text-[12.5px] leading-[1.7] text-amber-100/80">
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              <span style={{ position: "absolute", left: "-10%", top: "-30%", width: "60%", height: "110%", borderRadius: "50%", background: "radial-gradient(circle at 34% 30%, rgba(251,191,36,.55), transparent 70%)", filter: "blur(44px)", opacity: 0.14, animation: "recharza-aurora-drift-a 14s ease-in-out infinite alternate", willChange: "transform, opacity" }} />
            </span>
            <div className="relative flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-amber-300/10 text-amber-200"><StorefrontIcon name="shield" className="h-3.5 w-3.5" /></span>
              <p>{regionNote}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
