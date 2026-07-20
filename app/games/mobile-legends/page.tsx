import type { Metadata } from "next";
import Link from "next/link";

import { GameLogo } from "@/components/game-logo";
import { MobileLegendsOrderForm } from "@/components/mobile-legends-order-form";
import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { games, mobileLegendsRegions } from "@/lib/games";
import { getMobileLegendsPackages } from "@/lib/storefront-catalog";

export const metadata: Metadata = {
  title: "Mobile Legends Top-Up",
  description:
    "Choose a Mobile Legends market and approved package with server-owned pricing, player validation, and protected order tracking on Recharza.",
};

export const dynamic = "force-dynamic";

export default async function MobileLegendsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const params = await searchParams;
  const mobileLegendsGame = games.find((game) => game.slug === "mobile-legends")!;
  const selectedRegion =
    mobileLegendsRegions.find((region) => region.code === params.region) ??
    mobileLegendsGame.region!;
  const packages = await getMobileLegendsPackages();
  const livePricing = packages.some((item) => item.source === "fazercards-live");

  return (
    <main className="min-h-screen overflow-hidden bg-[#06060f] text-white">
      <SiteHeader />

      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="orb-drift absolute left-[-8rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="orb-drift-delayed absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-35" />
          <div className="scanline absolute inset-0 opacity-20" />
        </div>

        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <Link
            href="/#games"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 transition hover:text-violet-200"
          >
            <span aria-hidden="true">←</span>
            Back to catalogue
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                <span>{selectedRegion.flag}</span>
                {selectedRegion.label} market selected
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Mobile Legends top-up for the correct market.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                Choose the market before the package. Recharza keeps India, Indonesia, Philippines
                and Arabia as regional catalogue routes under the same Mobile Legends brand instead
                of pretending they are separate games.
              </p>
            </div>

            <div className="relative min-h-52 overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/25">
              <ResilientImage
                sources={mobileLegendsGame.artworkSources}
                alt={mobileLegendsGame.artworkAlt}
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: mobileLegendsGame.artworkPosition ?? "center" }}
                fallbackClassName="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090910] via-[#090910]/30 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <GameLogo game={mobileLegendsGame} priority />
                <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                  <span className="text-white/70">Catalogue state</span>
                  <span
                    className={
                      livePricing ? "font-bold text-emerald-200" : "font-bold text-amber-100"
                    }
                  >
                    {livePricing ? "Live approved" : "Protected fallback"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                  Select MLBB market
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Regional categories will filter live supplier offers after their exact IDs are approved.
                </p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Link
                  href="/games/mobile-legends"
                  className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                    selectedRegion.code === "global"
                      ? "border-violet-400/50 bg-violet-400/15 text-white"
                      : "border-white/10 bg-black/15 text-slate-400 hover:text-white"
                  }`}
                >
                  🌐 Global
                </Link>
                {mobileLegendsRegions.map((region) => (
                  <Link
                    key={region.code}
                    href={`/games/mobile-legends?region=${region.code}`}
                    className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                      selectedRegion.code === region.code
                        ? "border-violet-400/50 bg-violet-400/15 text-white"
                        : "border-white/10 bg-black/15 text-slate-400 hover:text-white"
                    }`}
                  >
                    {region.flag} {region.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="mb-6 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm leading-6 text-violet-100">
          <strong>{selectedRegion.flag} {selectedRegion.label}:</strong> {selectedRegion.note}. Shared
          fallback packages remain visible until an approved live supplier category exists for this market.
        </div>
        <MobileLegendsOrderForm packages={packages} />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8 lg:grid-cols-4">
          {[
            ["01", "Market-first routing", "The selected MLBB market is explicit before package selection begins."],
            ["02", "Supplier-aware pricing", "Offers pass through FX, fee, overhead and margin rules before publication."],
            ["03", "Replay-safe creation", "Idempotency keys and database constraints prevent duplicate orders during retries."],
            ["04", "Private tracking", "A separate access token protects each persisted order timeline."],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-white/5 bg-black/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
                {number}
              </p>
              <h2 className="mt-3 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
