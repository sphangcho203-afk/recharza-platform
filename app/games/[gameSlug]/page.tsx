import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GenericProductOrderForm } from "@/components/generic-product-order-form";
import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import { catalogueGames, getGameBySlug } from "@/lib/games";
import { getStoreProductsForGame } from "@/lib/storefront-game-catalog";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return catalogueGames
    .filter((game) => game.kind !== "mobile-legends-region")
    .map((game) => ({ gameSlug: game.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}): Promise<Metadata> {
  const game = getGameBySlug((await params).gameSlug);
  if (!game || game.catalogueVisible === false) return { title: "Game catalogue | Recharza" };

  return {
    title: `${game.title} Top-Up | Recharza`,
    description: `${game.description} Browse server-verified packs, local display currencies, billing, and secure order tracking.`,
  };
}

function fulfilmentLabel(type: string) {
  if (type === "gift-card") return "Digital gift card";
  if (type === "redeem-code") return "Digital code delivery";
  if (type === "uid") return "UID direct top-up";
  if (type === "subscription") return "Subscription";
  return "Player-ID direct top-up";
}

export default async function GameProductPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const game = getGameBySlug((await params).gameSlug);
  if (
    !game ||
    game.catalogueVisible === false ||
    game.kind === "mobile-legends-region" ||
    game.slug === "mobile-legends"
  ) {
    notFound();
  }

  const [products, fxSnapshot] = await Promise.all([
    getStoreProductsForGame(game),
    getCurrencyRateSnapshot(),
  ]);
  const livePricing = products.some((item) => item.source === "fazercards-live");

  return (
    <main className="min-h-screen bg-[#07070c] pb-28 text-white md:pb-8">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-[-10rem] top-[-14rem] h-[32rem] w-[32rem] rounded-full opacity-15 blur-[130px]"
            style={{ background: game.accent }}
          />
          <div className="absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-violet-600/12 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-15" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-7 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center lg:px-8">
          <div>
            <Link href="/#games" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
              ← Back to all games
            </Link>
            <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.13em]">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">
                {game.category}
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">
                {fulfilmentLabel(game.fulfilmentType)}
              </span>
              <span className={`rounded-full border px-3 py-1.5 ${livePricing ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
                {livePricing ? "Live supplier catalogue" : "Indicative supplier preview"}
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {game.title}
            </h1>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
              {game.publisher}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              {game.description}
            </p>
            <div className="mt-6 grid max-w-2xl gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">Products</p>
                <p className="mt-2 text-xl font-black">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">Delivery</p>
                <p className="mt-2 text-sm font-black">Server verified</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">Tracking</p>
                <p className="mt-2 text-sm font-black">Private token</p>
              </div>
            </div>
          </div>

          <div className="mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%),#11131d] shadow-2xl shadow-black/35">
            <ResilientImage
              sources={[...game.logoSources, ...game.artworkSources]}
              alt={game.logoAlt}
              fallbackLabel={game.title}
              loading="eager"
              className="h-full w-full object-contain p-[14%]"
              fallbackClassName="h-full w-full"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm leading-6 text-amber-100">
          <strong>Pricing boundary:</strong> preview prices are indicative until a reviewed FazerCards category is synchronized and published. The server rechecks the product, supplier record, currency quote, billing details, and delivery fields before accepting an order.
        </div>
        <GenericProductOrderForm game={game} products={products} fxSnapshot={fxSnapshot} />
      </section>
    </main>
  );
}
