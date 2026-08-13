"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { GameCard } from "@/components/game-card";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";
import { supportedCurrencyCodes, type SupportedCurrencyCode } from "@/lib/commerce/currencies";

type CatalogueFilter = "all" | "mobile" | "pc-console" | "gift-cards" | "popular";

const supportedFilters = new Set<CatalogueFilter>(["all", "mobile", "pc-console", "gift-cards", "popular"]);
const regionalMlbbSlugs = new Set([
  "mobile-legends-india",
  "mobile-legends-indonesia",
  "mobile-legends-philippines",
  "mobile-legends-brazil",
  "mobile-legends-malaysia",
  "mobile-legends-singapore",
  "mobile-legends-turkey",
  "mobile-legends-united-states",
]);
const mainGameOrder = [
  ...Array.from(regionalMlbbSlugs),
  "free-fire",
  "pubg-mobile",
  "genshin-impact",
  "valorant",
  "bgmi",
  "call-of-duty-mobile",
  "fortnite",
];
const mobileGameSlugs = new Set([
  ...regionalMlbbSlugs,
  "free-fire",
  "pubg-mobile",
  "genshin-impact",
  "bgmi",
  "call-of-duty-mobile",
]);
const pcConsoleGameSlugs = new Set(["valorant", "genshin-impact", "fortnite"]);
const popularGameSlugs = new Set(mainGameOrder.slice(0, 10));

const filters: { id: CatalogueFilter; label: string; icon: Parameters<typeof StorefrontIcon>[0]["name"] }[] = [
  { id: "all", label: "All", icon: "games" },
  { id: "popular", label: "Top Up", icon: "receipt" },
  { id: "mobile", label: "Mobile", icon: "account" },
  { id: "pc-console", label: "PC / Console", icon: "shield" },
  { id: "gift-cards", label: "Gift Cards", icon: "cart" },
];

function sortByOrder(items: Game[]) {
  const orderIndex = new Map(mainGameOrder.map((slug, index) => [slug, index]));
  return [...items].sort((left, right) => (orderIndex.get(left.slug) ?? 999) - (orderIndex.get(right.slug) ?? 999));
}

function matchesFilter(game: Game, filter: CatalogueFilter) {
  if (filter === "mobile") return mobileGameSlugs.has(game.slug);
  if (filter === "pc-console") return pcConsoleGameSlugs.has(game.slug);
  if (filter === "gift-cards") return game.packages.some((item) => item.toLowerCase().includes("gift card"));
  if (filter === "popular") return popularGameSlugs.has(game.slug);
  return true;
}

function matchesSearch(game: Game, query: string) {
  return [game.title, game.slug, game.publisher, game.category, ...game.packages].join(" ").toLowerCase().includes(query);
}

export function GameCatalogue({
  games,
  showRegionalMarkets = true,
  showDevelopmentBadges = true,
  showPricingSnapshots = true,
  ratesFromInrMicros,
}: {
  games: Game[];
  showRegionalMarkets?: boolean;
  showDevelopmentBadges?: boolean;
  showPricingSnapshots?: boolean;
  ratesFromInrMicros: Partial<Record<SupportedCurrencyCode, number>>;
}) {
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrencyCode>(() => {
    if (typeof window === "undefined") return "INR";
    const stored = window.localStorage.getItem("recharza.display-currency")?.toUpperCase();
    return stored && supportedCurrencyCodes.includes(stored as SupportedCurrencyCode)
      ? (stored as SupportedCurrencyCode)
      : "INR";
  });

  useEffect(() => {
    const handleCurrencyChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail?.toUpperCase();
      if (supportedCurrencyCodes.includes(next as SupportedCurrencyCode)) {
        setDisplayCurrency(next as SupportedCurrencyCode);
      }
    };
    window.addEventListener("recharza:currency-change", handleCurrencyChange);
    return () => window.removeEventListener("recharza:currency-change", handleCurrencyChange);
  }, []);
  const searchParams = useSearchParams();
  const normalizedQuery = (searchParams.get("q") ?? "").trim().toLowerCase();
  const requestedFilter = (searchParams.get("category") ?? "all") as CatalogueFilter;
  const filter = supportedFilters.has(requestedFilter) ? requestedFilter : "all";

  const mainGames = useMemo(
    () => sortByOrder(games.filter((game) => game.slug !== "mobile-legends")),
    [games],
  );
  const filteredGames = useMemo(
    () => mainGames.filter((game) => matchesFilter(game, filter) && (!normalizedQuery || matchesSearch(game, normalizedQuery))),
    [filter, mainGames, normalizedQuery],
  );
  const regionalMarkets = useMemo(
    () => showRegionalMarkets ? games.filter((game) => game.kind === "mobile-legends-region" && game.region) : [],
    [games, showRegionalMarkets],
  );

  return (
    <div className="mt-5">
      <div className="flex gap-2 overflow-x-auto border-b border-white/[0.08] pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((item) => (
          <Link
            key={item.id}
            href={item.id === "all" ? "/#games" : `/?category=${item.id}#games`}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3.5 text-xs font-black transition ${
              filter === item.id
                ? "border-violet-400/40 bg-violet-500/15 text-white"
                : "border-white/[0.08] bg-[#0d0f16] text-slate-400 hover:border-white/[0.16] hover:text-white"
            }`}
          >
            <StorefrontIcon name={item.icon} className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">
            {normalizedQuery ? "Search results" : filter === "all" ? "Hot-selling top-up games" : filters.find((item) => item.id === filter)?.label}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {normalizedQuery ? `${filteredGames.length} matching games` : "Choose a game to see live packages and checkout options."}
          </p>
        </div>
        {(normalizedQuery || filter !== "all") ? (
          <Link href="/#games" className="text-xs font-black text-violet-300 hover:text-violet-200">Clear</Link>
        ) : null}
      </div>

      {filteredGames.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredGames.map((game, index) => (
            <GameCard
              key={game.slug}
              game={game}
              priority={index < 4}
              showDevelopmentBadges={showDevelopmentBadges}
              showPricingSnapshots={showPricingSnapshots}
              displayCurrency={displayCurrency}
              ratesFromInrMicros={ratesFromInrMicros}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/[0.12] px-5 py-12 text-center">
          <StorefrontIcon name="search" className="mx-auto h-5 w-5 text-slate-500" />
          <p className="mt-3 text-sm font-black text-white">No matching game</p>
          <p className="mt-1 text-xs text-slate-500">Try another title, package or category.</p>
        </div>
      )}

      {false && filter === "all" && !normalizedQuery && regionalMarkets.length > 0 ? (
        <div className="mt-8 border-t border-white/[0.08] pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white">Mobile Legends markets</h3>
              <p className="mt-1 text-xs text-slate-500">Choose the region that matches the game account.</p>
            </div>
            <Link href="/games/mobile-legends" className="text-xs font-black text-violet-300">View all</Link>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {regionalMarkets.map((game) => (
              <Link
                key={game.slug}
                href={game.href ?? "/games/mobile-legends"}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0d0f16] px-3.5 text-xs font-black text-slate-300 transition hover:border-violet-400/30 hover:text-white"
              >
                <span className="text-base" aria-hidden="true">{game.region?.flag}</span>
                {game.region?.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
