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

const supportedMobileLegendsMarketCodes = new Set([
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

const marketOrder = [
  "mobile-legends-india",
  "mobile-legends-global",
  "mobile-legends-indonesia",
  "mobile-legends-philippines",
  "mobile-legends-malaysia",
  "mobile-legends-singapore",
];

function sortByOrder(items: Game[], order: string[]) {
  const orderIndex = new Map(order.map((slug, index) => [slug, index]));
  return [...items].sort(
    (left, right) =>
      (orderIndex.get(left.slug) ?? Number.MAX_SAFE_INTEGER) -
      (orderIndex.get(right.slug) ?? Number.MAX_SAFE_INTEGER),
  );
}

function matchesFilter(game: Game, filter: CatalogueFilter) {
  if (filter === "mobile") {
    return game.kind === "mobile-legends-region" || mobileGameSlugs.has(game.slug);
  }
  if (filter === "pc-console") return pcConsoleGameSlugs.has(game.slug);
  if (filter === "gift-cards") {
    return game.packages.some((item) => item.toLowerCase().includes("gift card"));
  }
  if (filter === "popular") {
    return game.kind === "mobile-legends-region"
      ? game.region?.code === "india" || game.region?.code === "global"
      : popularGameSlugs.has(game.slug);
  }
  return true;
}

function matchesSearch(game: Game, query: string) {
  return [
    game.title,
    game.slug,
    game.publisher,
    game.category,
    game.region?.label ?? "",
    ...game.packages,
    game.slug.startsWith("mobile-legends") ? "mlbb mobile legends bang bang" : "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function CatalogueGrid({
  games,
  showDevelopmentBadges,
  showPricingSnapshots,
}: {
  games: Game[];
  showDevelopmentBadges: boolean;
  showPricingSnapshots: boolean;
}) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
      {games.map((game) => (
        <GameCard
          key={game.slug}
          game={game}
          showDevelopmentBadges={showDevelopmentBadges}
          showPricingSnapshots={showPricingSnapshots}
        />
      ))}
    </div>
  );
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
  const regionGames = useMemo(
    () =>
      showRegionalMarkets
        ? sortByOrder(
            games.filter(
              (game) =>
                game.kind === "mobile-legends-region" &&
                Boolean(game.region && supportedMobileLegendsMarketCodes.has(game.region.code)),
            ),
            marketOrder,
          )
        : [],
    [games, showRegionalMarkets],
  );
  const searchableGames = useMemo(() => [...mainGames, ...regionGames], [mainGames, regionGames]);
  const hasActiveDiscovery = Boolean(normalizedQuery || filter !== "all");
  const filteredGames = useMemo(
    () =>
      searchableGames.filter(
        (game) =>
          matchesFilter(game, filter) &&
          (!normalizedQuery || matchesSearch(game, normalizedQuery)),
      ),
    [filter, normalizedQuery, searchableGames],
  );

  if (hasActiveDiscovery) {
    return (
      <div className="mt-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
          <p aria-live="polite" className="text-xs font-bold text-slate-400">
            <span className="font-black text-white">{filteredGames.length}</span>{" "}
            {filteredGames.length === 1 ? "result" : "results"}
            {normalizedQuery ? ` for “${normalizedQuery}”` : ""}
          </p>
          <Link
            href="/#games"
            className="inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-black text-cyan-300 transition hover:bg-cyan-300/[0.06] hover:text-cyan-200"
          >
            Clear filters
            <StorefrontIcon name="arrow" className="h-4 w-4" />
          </Link>
        </div>

        {filteredGames.length > 0 ? (
          <CatalogueGrid
            games={filteredGames}
            showDevelopmentBadges={showDevelopmentBadges}
            showPricingSnapshots={showPricingSnapshots}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-slate-500">
              <StorefrontIcon name="search" className="h-5 w-5" />
            </span>
            <p className="mt-4 font-black text-white">No matching game or market</p>
            <p className="mt-2 text-sm text-slate-500">Try another game title, pack, platform, or region.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-7 grid gap-10">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Game catalogue</p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Choose your game.</h3>
          </div>
          <span className="hidden text-xs font-bold text-slate-600 sm:block">{mainGames.length} titles</span>
        </div>
        <CatalogueGrid
          games={mainGames}
          showDevelopmentBadges={showDevelopmentBadges}
          showPricingSnapshots={showPricingSnapshots}
        />
      </section>

      {regionGames.length > 0 ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Mobile Legends markets</p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Select the account region.</h3>
            </div>
            <Link
              href="/games/mobile-legends"
              className="hidden min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-violet-300 transition hover:bg-violet-300/[0.06] sm:inline-flex"
            >
              All markets
              <StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
          <CatalogueGrid
            games={regionGames}
            showDevelopmentBadges={showDevelopmentBadges}
            showPricingSnapshots={showPricingSnapshots}
          />
        </section>
      ) : null}
    </div>
  );
}
