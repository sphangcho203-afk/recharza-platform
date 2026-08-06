"use client";

import { useMemo, useState } from "react";

import { GameCard } from "@/components/game-card";
import type { Game } from "@/lib/games";

type CatalogueFilter =
  | "all"
  | "checkout"
  | "battle-royale"
  | "shooter"
  | "rpg";

const filters: Array<{ id: CatalogueFilter; label: string }> = [
  { id: "all", label: "All games" },
  { id: "checkout", label: "Available" },
  { id: "battle-royale", label: "Battle royale" },
  { id: "shooter", label: "Shooter" },
  { id: "rpg", label: "RPG" },
];

const supportedMobileLegendsMarketCodes = new Set([
  "global",
  "indonesia",
  "philippines",
  "malaysia",
  "singapore",
]);

const defaultCatalogueOrder = [
  "mobile-legends-global",
  "free-fire",
  "pubg-mobile",
  "mobile-legends-indonesia",
  "genshin-impact",
  "mobile-legends-philippines",
  "valorant",
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

  return (
    <div className="mt-6 min-w-0">
      <div className="grid min-w-0 gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <label className="relative block min-w-0 md:max-w-sm">
          <span className="sr-only">Search games or markets</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search games or Mobile Legends markets"
            className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/15"
          />
        </label>

        <div
          className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`min-h-11 shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                  active
                    ? "bg-white text-slate-950"
                    : "border border-white/10 bg-white/[0.035] text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex min-w-0 items-center justify-between gap-4 text-xs text-slate-500">
        <p aria-live="polite">
          {showingAllMobileLegendsMarkets
            ? `Showing all ${regionGames.length} supported Mobile Legends markets`
            : `${visibleGames.length} ${visibleGames.length === 1 ? "game" : "games"}`}
        </p>
        {(query || filter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="min-h-11 shrink-0 rounded-lg px-2 font-bold text-violet-300 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Reset filters
          </button>
        )}
      </div>

      {visibleGames.length > 0 ? (
        <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 min-[560px]:grid-cols-2 xl:grid-cols-3">
          {visibleGames.map((game) => (
            <GameCard
              key={game.slug}
              game={game}
              showDevelopmentBadges={showDevelopmentBadges}
              showPricingSnapshots={showPricingSnapshots}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
          <p className="font-bold text-white">No game matched that search</p>
          <p className="mt-2 text-sm text-slate-500">
            Try another title, region, or clear the filters.
          </p>
        </div>
      )}
    </div>
  );
}
