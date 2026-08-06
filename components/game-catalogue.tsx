"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { GameCard } from "@/components/game-card";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";

type CatalogueFilter = "all" | "mobile" | "pc-console" | "gift-cards" | "popular";

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
const pcConsoleGameSlugs = new Set(["valorant", "genshin-impact", "fortnite"]);
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
    return game.packages.some((item) => item.toLowerCase().includes("gift card"));
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
  const normalizedQuery = (searchParams.get("q") ?? "").trim().toLowerCase();
  const requestedFilter = (searchParams.get("category") ?? "all") as CatalogueFilter;
  const filter = supportedFilters.has(requestedFilter) ? requestedFilter : "all";

  const mainGames = useMemo(
    () => sortByOrder(games.filter((game) => game.kind === "game"), mainGameOrder),
    [games],
  );
  const regions = useMemo(
    () =>
      showRegionalMarkets
        ? games.filter(
            (game) =>
              game.kind === "mobile-legends-region" &&
              Boolean(game.region && supportedMarketCodes.has(game.region.code)),
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
      <div className="mt-7">
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
          <p aria-live="polite" className="text-sm font-bold text-slate-400">
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
                priority={index === 0}
                showDevelopmentBadges={showDevelopmentBadges}
                showPricingSnapshots={showPricingSnapshots}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-14 text-center">
            <StorefrontIcon name="search" className="mx-auto h-6 w-6 text-slate-500" />
            <p className="mt-4 font-black text-white">No matching game</p>
            <p className="mt-2 text-sm text-slate-500">Try another title, pack or platform.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-7 space-y-14">
      <section className="storefront-feed-section">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black text-violet-300">Popular right now</p>
            <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
              Start with a game you know.
            </h3>
          </div>
          <span className="hidden text-xs font-bold text-slate-600 sm:block">Swipe to explore</span>
        </div>

        <div className="recharza-popular-rail" aria-label="Popular games">
          {popularGames.map((game, index) => (
            <div key={game.slug} className="recharza-popular-card">
              <GameCard
                game={game}
                variant="rail"
                priority={index === 0}
                showDevelopmentBadges={showDevelopmentBadges}
                showPricingSnapshots={showPricingSnapshots}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="storefront-feed-section">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black text-cyan-300">All games</p>
            <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
              Keep scrolling. Pick your next top-up.
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-600">{mainGames.length} titles</span>
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
        <section className="storefront-feed-section rounded-3xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(139,92,246,0.08),rgba(7,9,15,0.94)_42%)] p-5 sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black text-violet-300">Mobile Legends regions</p>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
                Select the account market.
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Regions are routes, not repeated product cards. Pick the market that matches the game account.
              </p>
            </div>
            <Link
              href="/games/mobile-legends"
              className="hidden items-center gap-2 text-xs font-black text-violet-300 sm:inline-flex"
            >
              All markets
              <StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((game) => (
              <Link
                key={game.slug}
                href={game.href ?? "/games/mobile-legends"}
                className="group flex min-h-16 items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 transition hover:border-violet-300/30 hover:bg-violet-300/[0.06]"
              >
                <span className="text-2xl" aria-hidden="true">{game.region?.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-white">{game.region?.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {game.region?.defaultCurrency} · Mobile Legends
                  </span>
                </span>
                <StorefrontIcon
                  name="arrow"
                  className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white"
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
