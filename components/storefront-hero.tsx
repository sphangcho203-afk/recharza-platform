import Link from "next/link";

import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { StorefrontArtworkKey } from "@/lib/storefront-artwork";
import type { StorefrontContent } from "@/lib/storefront-content";

const fallbackSources: string[] = [];

const supportingArtwork: Array<{
  key: StorefrontArtworkKey;
  label: string;
  detail: string;
}> = [
  { key: "free-fire", label: "Free Fire MAX", detail: "Diamonds & memberships" },
  { key: "pubg-mobile", label: "PUBG Mobile", detail: "UC & passes" },
  { key: "valorant", label: "VALORANT", detail: "Points catalogue" },
];

const trustPoints = [
  { icon: "globe" as const, label: "Regional catalogues" },
  { icon: "receipt" as const, label: "Clear price snapshots" },
  { icon: "shield" as const, label: "Private order access" },
];

export function StorefrontHero({
  content,
}: {
  content: StorefrontContent["hero"];
}) {
  return (
    <section className="relative overflow-hidden px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-14 lg:px-8 lg:pb-10 lg:pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="storefront-ambient-grid absolute inset-x-0 top-[-5rem] h-[42rem] opacity-70" />
        <div className="storefront-orb storefront-float absolute left-[-11rem] top-4 h-[28rem] w-[28rem] rounded-full bg-violet-600/18 blur-[120px]" />
        <div className="storefront-orb storefront-float-delayed absolute right-[-9rem] top-[-2rem] h-[30rem] w-[30rem] rounded-full bg-cyan-500/12 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:gap-12 xl:gap-16">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-violet-300">
              <span className="h-px w-8 bg-gradient-to-r from-violet-400 to-cyan-300" />
              {content.eyebrow}
            </div>

            <h1 className="mt-6 text-[clamp(2.75rem,7vw,5.6rem)] font-black leading-[0.93] tracking-[-0.065em] text-white">
              <span className="block">{content.title}</span>
              <span className="mt-2 block bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                {content.accent}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              {content.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row">
              <Link
                href={content.primaryCtaHref}
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 shadow-[0_18px_45px_rgba(255,255,255,0.13)] transition hover:-translate-y-0.5 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {content.primaryCtaLabel}
                <StorefrontIcon
                  name="arrow"
                  className="h-[18px] w-[18px] transition group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href={content.secondaryCtaHref}
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-white/[0.11] bg-white/[0.035] px-5 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-violet-300/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <StorefrontIcon name="games" className="h-[18px] w-[18px] text-violet-300" />
                Browse all games
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/[0.08] pt-5">
              {trustPoints.map((point) => (
                <span
                  key={point.label}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400"
                >
                  <StorefrontIcon name={point.icon} className="h-4 w-4 text-cyan-300" />
                  {point.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
            <div className="storefront-panel relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/[0.1] bg-[#0a0d17] shadow-[0_40px_110px_rgba(0,0,0,0.48)] sm:min-h-[31rem]">
              <StorefrontArtwork
                artworkKey="mobile-legends-india"
                sources={fallbackSources}
                alt="Mobile Legends India storefront artwork"
                fallbackLabel="ML"
                loading="eager"
                className="absolute inset-0 h-full w-full scale-[1.02]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,14,0.08)_0%,rgba(4,7,14,0.18)_42%,rgba(4,7,14,0.94)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,7,14,0.44),transparent_48%,rgba(4,7,14,0.12))]" />

              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-5">
                <div className="rounded-2xl border border-white/[0.11] bg-black/45 px-3.5 py-3 backdrop-blur-xl">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
                    Selected market
                  </p>
                  <p className="mt-1 text-sm font-black text-white">🇮🇳 Mobile Legends · India</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.12] bg-black/45 text-violet-200 backdrop-blur-xl">
                  <StorefrontIcon name="globe" className="h-5 w-5" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <div className="max-w-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
                    One controlled checkout
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
                    Choose the correct market before the package.
                  </h2>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-300">
                    <span className="rounded-lg border border-white/[0.09] bg-black/35 px-2.5 py-1.5 backdrop-blur">
                      Player details
                    </span>
                    <StorefrontIcon name="arrow" className="h-3.5 w-3.5 text-slate-500" />
                    <span className="rounded-lg border border-white/[0.09] bg-black/35 px-2.5 py-1.5 backdrop-blur">
                      Package
                    </span>
                    <StorefrontIcon name="arrow" className="h-3.5 w-3.5 text-slate-500" />
                    <span className="rounded-lg border border-white/[0.09] bg-black/35 px-2.5 py-1.5 backdrop-blur">
                      Payment
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 -mt-4 grid grid-cols-3 gap-2 px-3 sm:-mt-6 sm:gap-3 sm:px-5">
              {supportingArtwork.map((item) => (
                <div
                  key={item.key}
                  className="group relative min-h-[7.5rem] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0d101a] shadow-[0_16px_45px_rgba(0,0,0,0.38)] sm:min-h-[9rem]"
                >
                  <StorefrontArtwork
                    artworkKey={item.key}
                    sources={fallbackSources}
                    alt={`${item.label} game artwork`}
                    fallbackLabel={item.label.slice(0, 2)}
                    className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
                    <p className="truncate text-[11px] font-black text-white sm:text-xs">{item.label}</p>
                    <p className="mt-0.5 hidden truncate text-[10px] text-slate-400 sm:block">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] sm:grid-cols-3">
          <Link
            href="/games/mobile-legends/india"
            className="group flex min-h-24 items-center gap-4 border-b border-white/[0.07] px-4 py-4 transition hover:bg-violet-300/[0.055] sm:border-b-0 sm:border-r sm:px-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/15 bg-violet-300/[0.09] text-violet-200">
              <StorefrontIcon name="games" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">Start here</span>
              <span className="mt-1 block text-sm font-black text-white">Top up Mobile Legends India</span>
            </span>
            <StorefrontIcon name="arrow" className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>

          <Link
            href="/orders/lookup"
            className="group flex min-h-24 items-center gap-4 border-b border-white/[0.07] px-4 py-4 transition hover:bg-cyan-300/[0.045] sm:border-b-0 sm:border-r sm:px-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-200">
              <StorefrontIcon name="track" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">Private tracking</span>
              <span className="mt-1 block text-sm font-black text-white">Find an existing order</span>
            </span>
            <StorefrontIcon name="arrow" className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>

          <Link
            href="/account"
            className="group flex min-h-24 items-center gap-4 px-4 py-4 transition hover:bg-emerald-300/[0.04] sm:px-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-200">
              <StorefrontIcon name="account" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Your account</span>
              <span className="mt-1 block text-sm font-black text-white">Sign in, recover, and view orders</span>
            </span>
            <StorefrontIcon name="arrow" className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>
        </div>
      </div>
    </section>
  );
}
