"use client";

import Link from "next/link";
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
  { id: "all", label: "All" },
  { id: "checkout", label: "Available" },
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

function CatalogueRail({
  games,
  showDevelopmentBadges,
  showPricingSnapshots,
  ariaLabel,
}: {
  games: Game[];
  showDevelopmentBadges: boolean;
  showPricingSnapshots: boolean;
  ariaLabel: string;
}) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden">
      <div
        aria-label={ariaLabel}
        className="flex w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 pr-4 [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:overflow-visible lg:pr-0 xl:grid-cols-4"
      >
        {games.map((game) => (
          <div
            key={game.slug}
            className="w-[76vw] max-w-[20.5rem] shrink-0 snap-start lg:w-auto lg:max-w-none"
          >
            <GameCard
              game={game}
              showDevelopmentBadges={showDevelopmentBadges}
              showPricingSnapshots={showPricingSnapshots}
            />
          </div>
        ))}
      </div>
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogueFilter>("all");

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
                Boolean(
                  game.region &&
                    supportedMobileLegendsMarketCodes.has(game.region.code),
                ),
            ),
            marketOrder,
          )
        : [],
    [games, showRegionalMarkets],
  );
  const searchableGames = useMemo(
    () => [...mainGames, ...regionGames],
    [mainGames, regionGames],
  );

  const normalizedQuery = query.trim().toLowerCase();
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

  return (
    <div className="mt-7 min-w-0 max-w-full overflow-hidden">
      <div className="grid min-w-0 gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.018] p-3 lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.4fr)] lg:items-center lg:p-4">
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
            placeholder="Search games, packs, or MLBB markets"
            className="h-12 w-full min-w-0 rounded-xl border border-white/[0.09] bg-black/20 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:font-normal placeholder:text-slate-600 hover:border-white/[0.14] focus:border-cyan-300/40 focus:bg-cyan-300/[0.035] focus:ring-4 focus:ring-cyan-300/10"
          />
        </label>

        <div
          className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 lg:justify-end [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`min-h-10 shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  active
                    ? "bg-white text-slate-950 shadow-[0_8px_24px_rgba(255,255,255,0.08)]"
                    : "border border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-cyan-300/20 hover:bg-cyan-300/[0.05] hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {hasActiveDiscovery ? (
        <section className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <p aria-live="polite" className="text-xs font-bold text-slate-500">
              {filteredGames.length} {filteredGames.length === 1 ? "result" : "results"}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-black text-cyan-300 transition hover:bg-cyan-300/[0.06] hover:text-cyan-200"
            >
              Clear search
            </button>
          </div>

          {filteredGames.length > 0 ? (
            <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.slug}
                  game={game}
                  showDevelopmentBadges={showDevelopmentBadges}
                  showPricingSnapshots={showPricingSnapshots}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-slate-500">
                <StorefrontIcon name="search" className="h-5 w-5" />
              </span>
              <p className="mt-4 font-black text-white">No matching game or market</p>
              <p className="mt-2 text-sm text-slate-500">Try a game title, currency, pack, or region.</p>
            </div>
          )}
        </section>
      ) : (
        <div className="mt-8 grid gap-10">
          <section className="min-w-0 max-w-full">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Game catalogue</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Choose the game.</h3>
              </div>
              <span className="hidden text-xs font-bold text-slate-600 sm:block">Swipe or scroll</span>
            </div>
            <CatalogueRail
              games={mainGames}
              showDevelopmentBadges={showDevelopmentBadges}
              showPricingSnapshots={showPricingSnapshots}
              ariaLabel="Recharza game catalogue"
            />
          </section>

          {regionGames.length > 0 ? (
            <section className="min-w-0 max-w-full">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Mobile Legends markets</p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Choose the account region.</h3>
                </div>
                <Link
                  href="/games/mobile-legends"
                  className="hidden min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-violet-300 transition hover:bg-violet-300/[0.06] sm:inline-flex"
                >
                  All markets
                  <StorefrontIcon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
              <CatalogueRail
                games={regionGames}
                showDevelopmentBadges={showDevelopmentBadges}
                showPricingSnapshots={showPricingSnapshots}
                ariaLabel="Mobile Legends regional markets"
              />
              <Link
                href="/games/mobile-legends"
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-black text-violet-300 sm:hidden"
              >
                View every MLBB market
                <StorefrontIcon name="arrow" className="h-4 w-4" />
              </Link>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
