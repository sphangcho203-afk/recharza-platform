import Link from "next/link";

import { ResilientImage } from "@/components/resilient-image";
import { StorefrontIcon } from "@/components/storefront-icon";
import { formatInr, type MobileLegendsPackage } from "@/lib/mobile-legends";

function bonusLabel(name: string) {
  const match = name.match(/(\d+)\s*\+\s*(\d+)/i);
  return match ? `+${match[2]} bonus` : null;
}

export function StorefrontPackShowcase({ packages }: { packages: MobileLegendsPackage[] }) {
  const visible = packages.slice(0, 8);
  const bonusCount = visible.filter((item) => bonusLabel(item.name)).length;
  const weeklyPass = packages.find((item) => item.name.toLowerCase().includes("weekly diamond pass"));

  if (!visible.length) return null;

  return (
    <section className="storefront-feed-section border-y border-white/[0.08] bg-white/[0.015] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black text-cyan-300">Popular products</p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.045em] text-white">
              Real packs. Real published prices.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Product bonuses are shown only when they are included in the package name or supplier catalogue.
            </p>
          </div>
          <Link
            href="/games/mobile-legends/india"
            className="hidden items-center gap-2 text-xs font-black text-cyan-300 sm:inline-flex"
          >
            View all packs
            <StorefrontIcon name="arrow" className="h-4 w-4" />
          </Link>
        </div>

        <div className="recharza-pack-rail mt-7" aria-label="Popular Mobile Legends packs">
          {visible.map((item) => {
            const bonus = bonusLabel(item.name);
            return (
              <Link
                key={item.id}
                href="/games/mobile-legends/india"
                className="recharza-pack-card group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090b13] transition hover:-translate-y-1 hover:border-violet-300/30"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(91,124,255,0.22),transparent_45%),#080a12]">
                  <ResilientImage
                    sources={item.media.sources}
                    alt={item.media.alt}
                    fallbackLabel={item.name}
                    fill
                    sizes="(max-width: 919px) 72vw, 240px"
                    className="object-contain p-7 transition-transform duration-300 motion-safe:group-hover:scale-105"
                    fallbackClassName="absolute inset-0 h-full w-full"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-white/[0.1] bg-black/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-xl">
                    {item.source === "fazercards-live" ? "Live offer" : "Preview"}
                  </span>
                  {bonus ? (
                    <span className="absolute right-3 top-3 rounded-full bg-violet-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                      {bonus}
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <h3 className="min-h-12 text-sm font-black leading-5 text-white">{item.name}</h3>
                  <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/[0.07] pt-3">
                    <div>
                      <p className="text-lg font-black text-cyan-200">{formatInr(item.amountInPaise)}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-600">{item.deliveryLabel}</p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-950">
                      <StorefrontIcon name="arrow" className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(34,211,238,0.08),rgba(7,9,15,0.92)_55%)] p-5 sm:p-7">
            <StorefrontIcon name="receipt" className="h-5 w-5 text-cyan-300" />
            <h3 className="mt-4 text-2xl font-black tracking-[-0.035em] text-white">About the products</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Recharza lists diamonds, passes, memberships and other digital packs from the published catalogue. Final player, region and billing details are reviewed before an order is created.
            </p>
          </article>

          <article className="rounded-3xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(139,92,246,0.1),rgba(7,9,15,0.92)_55%)] p-5 sm:p-7">
            <StorefrontIcon name="games" className="h-5 w-5 text-violet-300" />
            <h3 className="mt-4 text-2xl font-black tracking-[-0.035em] text-white">Bonuses without fake discounts</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              {bonusCount > 0
                ? `${bonusCount} of the featured packs currently include a stated bonus amount.`
                : "No bonus claim is shown unless the published package includes one."}
              {weeklyPass ? ` ${weeklyPass.name} is also available in the catalogue.` : ""}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
