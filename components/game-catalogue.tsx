"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { GameCard } from "@/components/game-card";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";

type CatalogueFilter =
  | "all"
  | "mobile"
  | "pc-console"
  | "gift-cards"
  | "popular";

const supportedFilters = new Set<CatalogueFilter>([
  "all",
  "mobile",
  "pc-console",
  "gift-cards",
  "popular",
]);

const supportedMarketCodes = new Set([
  "india",
  "global",
  "indonesia",
  "philippines",
  "malaysia",
  "singapore",
]);

const marketOrder = [
  "india",
  "global",
  "indonesia",
  "philippines",
  "malaysia",
  "singapore",
];

const mainGameOrder = [
  "mobile-legends",
  "free-fire",
  "pubg-mobile",
  "genshin-impact",
  "valorant",
  "bgmi",
  "call-of-duty-mobile",
  "fortnite",
];

const mobileGameSlugs = new Set([
  "mobile-legends",
  "free-fire",
  "pubg-mobile",
  "genshin-impact",
  "bgmi",
  "call-of-duty-mobile",
]);
const pcConsoleGameSlugs = new Set([
  "valorant",
  "genshin-impact",
  "fortnite",
]);
const popularGameSlugs = new Set(mainGameOrder.slice(0, 5));

function sortByOrder(items: Game[], order: string[]) {
  const orderIndex = new Map(order.map((slug, index) => [slug, index]));
  return [...items].sort(
    (left, right) =>
      (orderIndex.get(left.slug) ?? Number.MAX_SAFE_INTEGER) -
      (orderIndex.get(right.slug) ?? Number.MAX_SAFE_INTEGER),
  );
}

function matchesFilter(game: Game, filter: CatalogueFilter) {
  if (filter === "mobile") return mobileGameSlugs.has(game.slug);
  if (filter === "pc-console") return pcConsoleGameSlugs.has(game.slug);
  if (filter === "gift-cards") {
    return game.packages.some((item) =>
      item.toLowerCase().includes("gift card"),
    );
  }
  if (filter === "popular") return popularGameSlugs.has(game.slug);
  return true;
}

function matchesSearch(game: Game, query: string) {
  return [game.title, game.slug, game.publisher, game.category, ...game.packages]
    .join(" ")
    .toLowerCase()
    .includes(query);
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
  const normalizedQuery = (searchParams.get("q") ?? "")
    .trim()
    .toLowerCase();
  const requestedFilter = (searchParams.get("category") ??
    "all") as CatalogueFilter;
  const filter = supportedFilters.has(requestedFilter)
    ? requestedFilter
    : "all";

  const mainGames = useMemo(
    () =>
      sortByOrder(
        games.filter((game) => game.kind === "game"),
        mainGameOrder,
      ),
    [games],
  );
  const regions = useMemo(
    () =>
      showRegionalMarkets
        ? [...games]
            .filter(
              (game) =>
                game.kind === "mobile-legends-region" &&
                Boolean(
                  game.region && supportedMarketCodes.has(game.region.code),
                ),
            )
            .sort(
              (left, right) =>
                marketOrder.indexOf(left.region?.code ?? "") -
                marketOrder.indexOf(right.region?.code ?? ""),
            )
        : [],
    [games, showRegionalMarkets],
  );
  const popularGames = useMemo(
    () => mainGames.filter((game) => popularGameSlugs.has(game.slug)),
    [mainGames],
  );
  const filteredGames = useMemo(
    () =>
      mainGames.filter(
        (game) =>
          matchesFilter(game, filter) &&
          (!normalizedQuery || matchesSearch(game, normalizedQuery)),
      ),
    [filter, mainGames, normalizedQuery],
  );
  const hasActiveDiscovery = Boolean(normalizedQuery || filter !== "all");

  if (hasActiveDiscovery) {
    return (
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <p aria-live="polite" className="text-xs font-bold text-slate-400">
            <span className="font-black text-white">{filteredGames.length}</span>{" "}
            {filteredGames.length === 1 ? "game" : "games"}
            {normalizedQuery ? ` matching “${normalizedQuery}”` : ""}
          </p>
          <Link href="/#games" className="text-xs font-black text-cyan-300">
            Clear
          </Link>
        </div>

        {filteredGames.length > 0 ? (
          <div className="recharza-game-feed">
            {filteredGames.map((game, index) => (
              <GameCard
                key={game.slug}
                game={game}
                variant="feed"
                priority={index < 2}
                showDevelopmentBadges={showDevelopmentBadges}
                showPricingSnapshots={showPricingSnapshots}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.12] px-5 py-10 text-center">
            <StorefrontIcon
              name="search"
              className="mx-auto h-5 w-5 text-slate-500"
            />
            <p className="mt-3 text-sm font-black text-white">No matching game</p>
            <p className="mt-1 text-xs text-slate-500">
              Try another title, package or platform.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-10">
      <section className="storefront-feed-section">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black text-violet-300">Popular</p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">
              Quick picks
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-600 sm:text-xs">
            Swipe
          </span>
        </div>

        <div className="recharza-popular-rail" aria-label="Popular games">
          {popularGames.map((game, index) => (
            <div key={game.slug} className="recharza-popular-card">
              <GameCard
                game={game}
                variant="rail"
                priority={index < 2}
                showDevelopmentBadges={showDevelopmentBadges}
                showPricingSnapshots={showPricingSnapshots}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="storefront-feed-section">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black text-cyan-300">All games</p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">
              Browse the catalogue
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-600 sm:text-xs">
            {mainGames.length} titles
          </span>
        </div>

        <div className="recharza-game-feed">
          {mainGames.map((game) => (
            <GameCard
              key={game.slug}
              game={game}
              variant="feed"
              showDevelopmentBadges={showDevelopmentBadges}
              showPricingSnapshots={showPricingSnapshots}
            />
          ))}
        </div>
      </section>

      {regions.length > 0 ? (
        <section className="storefront-feed-section border-t border-white/[0.08] pt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black text-violet-300">Mobile Legends</p>
              <h3 className="mt-1 text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">
                Choose the account market
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Match the market to the player account before choosing a package.
              </p>
            </div>
            <Link
              href="/games/mobile-legends"
              className="hidden text-xs font-black text-violet-300 sm:block"
            >
              View all
            </Link>
          </div>

          <div className="recharza-market-grid mt-4">
            {regions.map((game) => (
              <Link
                key={game.slug}
                href={game.href ?? "/games/mobile-legends"}
                className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.018] px-3 py-3 transition hover:border-violet-300/25 hover:bg-violet-300/[0.05]"
              >
                <span className="text-xl" aria-hidden="true">
                  {game.region?.flag}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-white">
                    {game.region?.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {game.region?.defaultCurrency}
                  </span>
                </span>
                <StorefrontIcon
                  name="arrow"
                  className="h-3.5 w-3.5 shrink-0 text-slate-600 transition group-hover:text-white"
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
