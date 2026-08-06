import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MobileLegendsCheckoutShell } from "@/components/mobile-legends-checkout-shell";
import { SiteHeader } from "@/components/site-header";
import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import { games } from "@/lib/games";
import {
  mobileLegendsMarkets,
  parseMobileLegendsMarket,
} from "@/lib/mobile-legends-market";
import { getMobileLegendsPackages } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return mobileLegendsMarkets.map((market) => ({ market: market.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const selectedMarket = parseMobileLegendsMarket((await params).market);

  return selectedMarket
    ? {
        title: `Mobile Legends ${selectedMarket.label} Top-Up`,
        description: `Integrated ${selectedMarket.label} Mobile Legends catalogue, player validation, billing, order creation, and payment.`,
      }
    : { title: "Mobile Legends Top-Up" };
}

export default async function MobileLegendsMarketPage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const selectedMarket = parseMobileLegendsMarket((await params).market);
  if (!selectedMarket) notFound();

  const regionalGame =
    games.find(
      (game) => game.slug === `mobile-legends-${selectedMarket.code}`,
    ) ?? games.find((game) => game.slug === "mobile-legends")!;
  const [packages, fxSnapshot] = await Promise.all([
    getMobileLegendsPackages(selectedMarket.code),
    getCurrencyRateSnapshot(),
  ]);
  const livePricing = packages.some((item) => item.source === "fazercards-live");

  if (packages.length === 0) {
    return (
      <main className="min-h-screen overflow-x-clip bg-[#06060f] text-white">
        <SiteHeader />

        <section className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-[130px]" />
            <div className="absolute right-[-10rem] top-6 h-[25rem] w-[25rem] rounded-full bg-cyan-500/8 blur-[130px]" />
          </div>

          <div className="relative mx-auto max-w-5xl">
            <Link
              href="/games/mobile-legends"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-black text-violet-300 transition hover:text-violet-200"
            >
              ← Mobile Legends markets
            </Link>

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0a0c13] shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
              <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
                <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.08] lg:aspect-auto lg:min-h-[28rem] lg:border-b-0 lg:border-r">
                  <StorefrontArtwork
                    artworkKey={regionalGame.artworkKey}
                    sources={regionalGame.artworkSources}
                    alt={regionalGame.artworkAlt}
                    fallbackLabel="Mobile Legends"
                    loading="eager"
                    className="absolute inset-0 h-full w-full"
                    fallbackClassName="absolute inset-0 h-full w-full"
                    objectPosition={regionalGame.artworkPosition}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080a10] via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 rounded-xl border border-white/[0.12] bg-black/55 px-3 py-2 backdrop-blur-xl">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
                      Selected market
                    </p>
                    <p className="mt-1 text-sm font-black text-white">
                      {selectedMarket.flag} {selectedMarket.label}
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-8 lg:p-10">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] text-amber-200">
                    <StorefrontIcon name="globe" className="h-5 w-5" />
                  </span>
                  <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                    Packs temporarily unavailable
                  </p>
                  <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                    {selectedMarket.label} is recognised, but not open for checkout.
                  </h1>
                  <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
                    Recharza has not approved a fulfilment catalogue for this market yet.
                    We will not substitute another region, invent a price, or accept a
                    payment that cannot be fulfilled.
                  </p>

                  <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      What to do next
                    </p>
                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-400">
                      <li>• Confirm the region shown inside the Mobile Legends account.</li>
                      <li>• Choose another market only when it truly matches that account.</li>
                      <li>• Return later after approved packs are published.</li>
                    </ul>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/games/mobile-legends"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
                    >
                      View all MLBB markets
                      <StorefrontIcon name="arrow" className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/support"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 text-sm font-black text-white transition hover:border-violet-300/25 hover:bg-violet-300/[0.06]"
                    >
                      Ask support
                      <StorefrontIcon name="support" className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#06060f] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-blue-600/18 blur-[120px]" />
          <div className="absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-violet-600/16 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:px-6 sm:py-9 lg:grid-cols-[1fr_16rem] lg:items-center lg:px-8">
          <div>
            <Link
              href="/games/mobile-legends"
              className="text-sm font-black text-violet-300 transition hover:text-violet-200"
            >
              ← Mobile Legends markets
            </Link>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-blue-100">
              <span>{selectedMarket.flag}</span>
              {selectedMarket.label} checkout
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Choose the pack, confirm the player, then pay.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Every step stays attached to this exact market and a recoverable order.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                {packages.length} approved offers
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Private tracking
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Server-verified payment
              </span>
            </div>
          </div>

          <div className="hidden aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-2xl shadow-black/30 lg:block">
            <StorefrontArtwork
              artworkKey={regionalGame.artworkKey}
              sources={regionalGame.artworkSources}
              alt={regionalGame.artworkAlt}
              fallbackLabel="Mobile Legends"
              loading="eager"
              className="h-full w-full"
              fallbackClassName="h-full w-full"
              objectPosition={regionalGame.artworkPosition}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mb-4 grid gap-3 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-100 sm:grid-cols-[1fr_auto] sm:items-center">
          <span>
            <strong>
              {selectedMarket.flag} {selectedMarket.label}:
            </strong>{" "}
            {selectedMarket.note}
          </span>
          <div className="flex flex-wrap gap-2">
            <span className={livePricing ? "font-bold text-emerald-200" : "font-bold text-amber-100"}>
              {livePricing ? `${packages.length} live offers` : "Protected preview pricing"}
            </span>
            <span className="text-violet-200/70">·</span>
            <span className={fxSnapshot.mode === "live" ? "font-bold text-cyan-100" : "font-bold text-amber-100"}>
              {fxSnapshot.mode === "live" ? "Live currency conversion" : "INR-only fallback"}
            </span>
          </div>
        </div>

        <MobileLegendsCheckoutShell
          packages={packages}
          market={selectedMarket}
          fxSnapshot={fxSnapshot}
        />
      </section>
    </main>
  );
}
