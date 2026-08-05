import type { Metadata } from "next";

import { CartWorkspace } from "@/components/cart-workspace";
import { SiteHeader } from "@/components/site-header";
import { mobileLegendsMarkets } from "@/lib/mobile-legends-market";
import { getMobileLegendsPackages } from "@/lib/storefront-catalog";

export const metadata: Metadata = {
  title: "Cart | Recharza",
  description:
    "Build a Mobile Legends top-up cart, validate player destinations, and continue to Recharza checkout.",
};

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const market =
    mobileLegendsMarkets.find((item) => item.code === "india") ??
    mobileLegendsMarkets[0];
  const packages = await getMobileLegendsPackages(market.code);

  return (
    <main className="min-h-screen min-w-0 overflow-x-clip bg-[var(--surface-0)] text-white">
      <SiteHeader />
      <section className="relative min-w-0 overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-[-16rem] h-[32rem] w-[32rem] rounded-full bg-violet-700/16 blur-[130px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>
        <div className="relative mx-auto min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-11">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
            Recharza cart
          </p>
          <h1 className="mt-3 max-w-3xl break-words text-3xl font-black tracking-[-0.05em] sm:text-5xl">
            Packages and player destinations, organised before payment.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Add offers, validate each Mobile Legends destination, and keep the cart
            across guest browsing or account login.
          </p>
        </div>
      </section>
      <section className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <CartWorkspace packages={packages} market={market} />
      </section>
    </main>
  );
}
