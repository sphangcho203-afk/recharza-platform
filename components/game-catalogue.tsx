"use client";

import { useMemo, useState } from "react";

import { GameCard } from "@/components/game-card";
import type { Game, GameFamily } from "@/lib/games";

type CatalogueFilter = "all" | GameFamily;

const filters: Array<{ id: CatalogueFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "moba", label: "MOBA" },
  { id: "battle-royale", label: "Battle royale" },
  { id: "shooter", label: "Shooter" },
  { id: "rpg", label: "RPG" },
  { id: "strategy", label: "Strategy" },
  { id: "sports", label: "Sports" },
  { id: "sandbox", label: "Sandbox" },
  { id: "platform", label: "Platform" },
  { id: "gift-card", label: "Gift cards" },
];

export function GameCatalogue({
  games,
  initialFilter = "all",
  title,
}: {
  games: Game[];
  initialFilter?: CatalogueFilter;
  title?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogueFilter>(initialFilter);

  const visibleGames = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return games.filter((game) => {
      if (game.catalogueVisible === false) return false;
      if (filter !== "all" && game.family !== filter) return false;
      if (!normalized) return true;

      return [
        game.title,
        game.publisher,
        game.category,
        game.description,
        game.badge ?? "",
        game.region?.label ?? "",
        ...game.packages,
        ...(game.supplierAliases ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [filter, games, query]);

  return (
    <div className="mt-7 min-w-0">
      {title ? <h3 className="mb-4 text-xl font-black text-white">{title}</h3> : null}

      <div className="grid min-w-0 gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <label className="relative block min-w-0">
          <span className="sr-only">Search games, platforms, or products</span>
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
            placeholder="Search games, packs, gift cards..."
            className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-black/25 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/15"
          />
        </label>

        <div
          className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:justify-end"
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
                    : "border border-white/10 bg-white/[0.035] text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-xs text-slate-500">
        <p aria-live="polite">
          {visibleGames.length} {visibleGames.length === 1 ? "product" : "products"}
        </p>
        {(query || filter !== initialFilter) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter(initialFilter);
            }}
            className="min-h-11 rounded-lg px-2 font-bold text-violet-300 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Reset filters
          </button>
        )}
      </div>

      {visibleGames.length > 0 ? (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {visibleGames.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
          <p className="font-bold text-white">No product matched that search</p>
          <p className="mt-2 text-sm text-slate-500">Try another title, platform, or clear the filters.</p>
        </div>
      )}
    </div>
  );
}
