"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GameCard } from "@/components/game-card";
import { GameLogo } from "@/components/game-logo";
import type { Game } from "@/lib/games";

type CatalogueFilter = "all" | "checkout" | "battle-royale" | "shooter" | "rpg";

const filters: Array<{ id: CatalogueFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "checkout", label: "Ready" },
  { id: "battle-royale", label: "Battle royale" },
  { id: "shooter", label: "Shooter" },
  { id: "rpg", label: "RPG" },
];

function matchesFilter(game: Game, filter: CatalogueFilter) {
  if (filter === "checkout") {
    return game.available === true;
  }

  if (filter === "battle-royale") {
    return game.family === "battle-royale";
  }

  if (filter === "shooter") {
    return game.family === "shooter";
  }

  if (filter === "rpg") {
    return game.family === "rpg";
  }

  return true;
}

export function GameCatalogue({ games }: { games: Game[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogueFilter>("all");
  const mainGames = games.filter((game) => game.kind === "game");
  const regionGames = games.filter((game) => game.kind === "mobile-legends-region");
  const mlbb = mainGames.find((game) => game.slug === "mobile-legends");

  const visibleGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mainGames.filter((game) => {
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
        ...game.packages,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [filter, mainGames, query]);

  const showRegions =
    !query ||
    ["mobile legends", "mlbb", "india", "indonesia", "philippines", "arabia"].some(
      (term) => term.includes(query.trim().toLowerCase()) || query.trim().toLowerCase().includes(term),
    );

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:max-w-sm sm:flex-1">
          <span className="sr-only">Search games</span>
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
            placeholder="Search games"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50"
          />
        </label>

        <div
          className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
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

      {showRegions && mlbb ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d0d16] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
                Mobile Legends markets
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Same game and logo. Choose the account market before checkout.
              </p>
            </div>
            <GameLogo game={mlbb} compact />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {regionGames.map((game) => (
              <Link
                key={game.slug}
                href={game.href ?? "/games/mobile-legends"}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/35 hover:bg-violet-400/[0.06]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/30 text-xl">
                  {game.region?.flag}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-white">{game.region?.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    Select market
                  </span>
                </span>
                <span className="ml-auto text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-4 text-xs text-slate-500">
        <p aria-live="polite">
          {visibleGames.length} {visibleGames.length === 1 ? "game" : "games"}
        </p>
        {(query || filter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="font-bold text-violet-300 transition hover:text-violet-200"
          >
            Reset filters
          </button>
        )}
      </div>

      {visibleGames.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleGames.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
          <p className="font-bold text-white">No game matched that search</p>
          <p className="mt-2 text-sm text-slate-500">Try another title or clear the filters.</p>
        </div>
      )}
    </div>
  );
}
