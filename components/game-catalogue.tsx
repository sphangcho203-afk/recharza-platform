"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { GameCard } from "@/components/game-card";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";

type CatalogueFilter = "all" | "top-up" | "gift-cards" | "popular";

const supportedFilters = new Set<CatalogueFilter>(["all", "top-up", "gift-cards", "popular"]);
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
const popularGameSlugs = new Set(mainGameOrder.slice(0, 10));

const filters: { id: CatalogueFilter; label: string; icon: Parameters<typeof StorefrontIcon>[0]["name"] }[] = [
  { id: "all", label: "All", icon: "games" },
  { id: "top-up", label: "Top Up", icon: "receipt" },
  { id: "gift-cards", label: "Gift Cards", icon: "cart" },
  { id: "popular", label: "Popular", icon: "shield" },
];

function sortByOrder(items: Game[]) {
  const orderIndex = new Map(mainGameOrder.map((slug, index) => [slug, index]));
  return [...items].sort((left, right) => (orderIndex.get(left.slug) ?? 999) - (orderIndex.get(right.slug) ?? 999));
}

function matchesFilter(game: Game, filter: CatalogueFilter) {
  if (filter === "top-up") return !game.packages.some((item) => item.toLowerCase().includes("gift card"));
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
}: {
  games: Game[];
  showRegionalMarkets?: boolean;
  showDevelopmentBadges?: boolean;
  showPricingSnapshots?: boolean;
}) {
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
    <div className="mt-6 sm:mt-8">
      <div className="relative -mx-1 border-b border-slate-200 pb-3 sm:pb-4">
        <nav aria-label="Catalogue filters" className="flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {filters.map((item) => (
          <Link
            key={item.id}
            href={item.id === "all" ? "/#games" : `/?category=${item.id}#games`}
            className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
              filter === item.id
                ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-100"
                : "border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50"
            }`}
          >
            <StorefrontIcon name={item.icon} className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        </nav>
        <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-10 w-10 bg-gradient-to-l from-white to-transparent sm:hidden" />
      </div>

      <div className="mt-8 grid gap-3 sm:flex sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {normalizedQuery ? "Search results" : filter === "all" ? "Hot-selling top-up games" : filters.find((item) => item.id === filter)?.label}
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {normalizedQuery ? `${filteredGames.length} matching games` : `${filteredGames.length} game paths available · choose a title to see live packages and checkout options.`}
          </p>
        </div>
        {(normalizedQuery || filter !== "all") ? (
          <Link href="/#games" className="text-sm font-bold text-violet-600 transition-all hover:text-violet-700 hover:underline">Clear all filters</Link>
        ) : null}
      </div>

      {filteredGames.length ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredGames.map((game, index) => (
            <GameCard
              key={game.slug}
              game={game}
              priority={index < 4}
              showDevelopmentBadges={showDevelopmentBadges}
              showPricingSnapshots={showPricingSnapshots}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid min-h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center place-items-center">
          <div className="max-w-xs">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-200">
              <StorefrontIcon name="search" className="h-6 w-6 text-slate-500" />
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">No matching game</p>
            <p className="mt-2 text-sm font-medium text-slate-500">Try another title, package or category to find what you're looking for.</p>
          </div>
        </div>
      )}

      {false && filter === "all" && !normalizedQuery && regionalMarkets.length > 0 ? (
        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Mobile Legends markets</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">Choose the region that matches the game account.</p>
            </div>
            <Link href="/games/mobile-legends" className="text-sm font-bold text-violet-600 hover:underline">View all regions</Link>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {regionalMarkets.map((game) => (
              <Link
                key={game.slug}
                href={game.href ?? "/games/mobile-legends"}
                className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 shadow-sm"
              >
                <span className="text-lg" aria-hidden="true">{game.region?.flag}</span>
                {game.region?.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
