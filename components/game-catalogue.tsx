"use client";

import { useMemo, useState } from "react";

import { GameCard } from "@/components/game-card";
import type { Game } from "@/lib/games";

type CatalogueFilter =
  | "all"
  | "checkout"
  | "mlbb-regions"
  | "battle-royale"
  | "shooter-rpg";

const filters: Array<{ id: CatalogueFilter; label: string }> = [
  { id: "all", label: "All games" },
  { id: "checkout", label: "Ready now" },
  { id: "mlbb-regions", label: "MLBB regions" },
  { id: "battle-royale", label: "Battle royale" },
  { id: "shooter-rpg", label: "Shooter & RPG" },
];

function matchesFilter(game: Game, filter: CatalogueFilter) {
  if (filter === "checkout") {
    return game.available === true;
  }

  if (filter === "mlbb-regions") {
    return game.kind === "mobile-legends-region";
  }

  if (filter === "battle-royale") {
    return game.family === "battle-royale";
  }

  if (filter === "shooter-rpg") {
    return game.family === "shooter" || game.family === "rpg";
  }

  return true;
}

export function GameCatalogue({ games }: { games: Game[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogueFilter>("all");

  const visibleGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return games.filter((game) => {
      if (!matchesFilter(game, filter)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        game.title,
        game.publisher,
        game.category,
        game.region?.label,
        ...game.packages,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [filter, games, query]);

  return (
    <div className="mt-10">
      <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-3 shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block lg:w-[22rem]">
            <span className="sr-only">Search games and regions</span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            >
              ⌕
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games, publishers or regions"
              className="w-full rounded-2xl border border-white/10 bg-black/25 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
            />
          </label>

          <div
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                    active
                      ? "border-violet-400/50 bg-violet-400/15 text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.15)]"
                      : "border-white/10 bg-black/15 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <p aria-live="polite" className="text-slate-400">
          Showing <span className="font-bold text-white">{visibleGames.length}</span> catalogue
          {visibleGames.length === 1 ? " entry" : " entries"}
        </p>
        {(query || filter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="text-xs font-bold text-violet-300 transition hover:text-violet-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {visibleGames.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleGames.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.7rem] border border-dashed border-white/15 bg-white/[0.025] px-6 py-16 text-center">
          <p className="text-lg font-bold text-white">No catalogue match found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try another game name, publisher, category or MLBB region.
          </p>
        </div>
      )}
    </div>
  );
}
