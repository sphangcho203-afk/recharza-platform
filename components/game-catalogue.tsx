"use client";

import { useMemo, useState } from "react";

import { GameCard } from "@/components/game-card";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";

type CatalogueFilter =
  | "all"
  | "checkout"
  | "battle-royale"
  | "shooter"
  | "rpg";

const filters: Array<{ id: CatalogueFilter; label: string }> = [
  { id: "all", label: "All games" },
  { id: "checkout", label: "Ready to top up" },
  { id: "battle-royale", label: "Battle royale" },
  { id: "shooter", label: "Shooter" },
  { id: "rpg", label: "RPG" },
];

const supportedMobileLegendsMarketCodes = new Set([
  "india",
  "global",
  "indonesia",
  "philippines",
  "malaysia",
  "singapore",
]);

const defaultCatalogueOrder = [
  "mobile-legends-india",
  "mobile-legends-global",
  "free-fire",
  "pubg-mobile",
  "genshin-impact",
  "mobile-legends-indonesia",
  "valorant",
  "mobile-legends-philippines",
  "mobile-legends-malaysia",
  "mobile-legends-singapore",
  "bgmi",
  "call-of-duty-mobile",
  "fortnite",
] as const;

function matchesFilter(game: Game, filter: CatalogueFilter) {
  if (filter === "checkout") return game.available === true;
  if (filter === "battle-royale") return game.family === "battle-royale";
  if (filter === "shooter") return game.family === "shooter";
  if (filter === "rpg") return game.family === "rpg";
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
    game.slug.startsWith("mobile-legends")
      ? "mlbb mobile legends bang bang"
      : "",
  ]
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogueFilter>("all");

  const mainGames = useMemo(
    () => games.filter((game) => game.kind === "game"),
    [games],
  );
  const regionGames = useMemo(
    () =>
      showRegionalMarkets
        ? games.filter(
            (game) =>
              game.kind === "mobile-legends-region" &&
              Boolean(
                game.region &&
                  supportedMobileLegendsMarketCodes.has(game.region.code),
              ),
          )
        : [],
    [games, showRegionalMarkets],
  );
  const mobileLegendsHub = mainGames.find(
    (game) => game.slug === "mobile-legends",
  );
  const ordinaryGames = useMemo(
    () => mainGames.filter((game) => game.slug !== "mobile-legends"),
    [mainGames],
  );

  const searchableGames = useMemo(() => {
    if (showRegionalMarkets) return [...ordinaryGames, ...regionGames];
    return mobileLegendsHub
      ? [mobileLegendsHub, ...ordinaryGames]
      : ordinaryGames;
  }, [mobileLegendsHub, ordinaryGames, regionGames, showRegionalMarkets]);

  const defaultGames = useMemo(() => {
    const bySlug = new Map(searchableGames.map((game) => [game.slug, game]));
    return defaultCatalogueOrder.flatMap((slug) => {
      const game = bySlug.get(slug);
      return game ? [game] : [];
    });
  }, [searchableGames]);

  const normalizedQuery = query.trim().toLowerCase();
  const showingAllMobileLegendsMarkets = Boolean(
    normalizedQuery &&
      (normalizedQuery.includes("mobile legends") ||
        normalizedQuery.includes("mlbb") ||
        "mobile legends".includes(normalizedQuery) ||
        "mlbb".includes(normalizedQuery)),
  );

  const visibleGames = useMemo(() => {
    const source = normalizedQuery
      ? searchableGames
      : filter === "all"
        ? defaultGames
        : searchableGames.filter(
            (game) =>
              game.kind !== "mobile-legends-region" ||
              defaultCatalogueOrder.includes(
                game.slug as (typeof defaultCatalogueOrder)[number],
              ),
          );

    return source.filter((game) => {
      if (!matchesFilter(game, filter)) return false;
      if (!normalizedQuery) return true;
      return matchesSearch(game, normalizedQuery);
    });
  }, [defaultGames, filter, normalizedQuery, searchableGames]);

  const featureFirstCard = !normalizedQuery && filter === "all";

  return (
    <div className="mt-7 min-w-0">
      <div className="grid min-w-0 gap-3 border-y border-white/[0.08] py-4 lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.4fr)] lg:items-center">
        <label className="relative block min-w-0">
          <span className="sr-only">Search games or markets</span>
          <StorefrontIcon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search games, packages, or MLBB markets"
            className="h-13 w-full min-w-0 rounded-2xl border border-white/[0.09] bg-white/[0.035] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:font-normal placeholder:text-slate-600 hover:border-white/[0.14] focus:border-violet-400/45 focus:bg-violet-300/[0.045] focus:ring-4 focus:ring-violet-400/10"
          />
        </label>

        <div
          className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:justify-end [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Catalogue filters"
        >
          {filters.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.id)}
                className={`min-h-11 shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                  active
                    ? "bg-white text-slate-950 shadow-[0_8px_24px_rgba(255,255,255,0.1)]"
                    : "border border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-violet-300/20 hover:bg-violet-300/[0.06] hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex min-w-0 items-center justify-between gap-4 text-xs text-slate-500">
        <p aria-live="polite" className="font-semibold">
          {showingAllMobileLegendsMarkets
            ? `Showing all ${regionGames.length} supported Mobile Legends markets`
            : `${visibleGames.length} ${visibleGames.length === 1 ? "result" : "results"}`}
        </p>
        {(query || filter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2.5 font-black text-violet-300 transition hover:bg-violet-300/[0.06] hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Reset filters
          </button>
        )}
      </div>

      {visibleGames.length > 0 ? (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 min-[620px]:grid-cols-2 xl:grid-cols-3">
          {visibleGames.map((game, index) => {
            const featured = featureFirstCard && index === 0;
            return (
              <div
                key={game.slug}
                className={featured ? "min-w-0 xl:col-span-2" : "min-w-0"}
              >
                <GameCard
                  game={game}
                  featured={featured}
                  showDevelopmentBadges={showDevelopmentBadges}
                  showPricingSnapshots={showPricingSnapshots}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-slate-500">
            <StorefrontIcon name="search" className="h-5 w-5" />
          </span>
          <p className="mt-4 font-black text-white">No game matched that search</p>
          <p className="mt-2 text-sm text-slate-500">
            Try another title, market, or package name.
          </p>
        </div>
      )}
    </div>
  );
}
