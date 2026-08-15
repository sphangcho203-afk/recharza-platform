"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ResilientImage } from "@/components/resilient-image";
import {
  StorefrontIcon,
  type StorefrontIconName,
} from "@/components/storefront-icon";

export type NavGame = {
  slug: string;
  title: string;
  category: string;
  href: string;
  logoSources: string[];
  logoAlt: string;
  logoTreatment: "native" | "invert" | "light-panel";
  startingPrice: string | null;
  live: boolean;
};

type SiteNavProps = {
  games: NavGame[];
};

const primaryLinks: Array<{
  label: string;
  href: string;
  icon: StorefrontIconName;
}> = [
  { label: "Top Up", href: "/#games", icon: "topup" },
  { label: "Gift Cards", href: "/?category=gift-cards#games", icon: "gift" },
  { label: "Track Order", href: "/orders/lookup", icon: "track" },
  { label: "Support", href: "/support", icon: "support" },
];

function GameThumb({
  game,
  size = "h-9 w-9",
}: {
  game: NavGame;
  size?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 p-1 ${size} ${
        game.logoTreatment === "light-panel" ? "bg-white/95" : "bg-black/40"
      }`}
    >
      <ResilientImage
        sources={game.logoSources}
        alt={game.logoAlt}
        loading="lazy"
        className={`max-h-full max-w-full object-contain ${
          game.logoTreatment === "invert" ? "brightness-0 invert" : ""
        }`}
        fallbackClassName="h-full w-full rounded-md"
      />
    </span>
  );
}

export function SiteNav({ games }: SiteNavProps) {
  const [megaOpen, setMegaOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const megaRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close menus on navigation
  useEffect(() => {
    setMegaOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  // Close mega menu on outside click / Escape
  useEffect(() => {
    if (!megaOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (megaRef.current && !megaRef.current.contains(event.target as Node)) {
        setMegaOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMegaOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [megaOpen]);

  function openMega() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  }

  function scheduleCloseMega() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  }

  const liveGames = games.filter((game) => game.live);
  const upcomingGames = games.filter((game) => !game.live);

  return (
    <>
      {/* Desktop primary nav */}
      <nav
        className="hidden items-center gap-0.5 lg:flex"
        aria-label="Primary navigation"
      >
        <div
          ref={megaRef}
          className="relative"
          onMouseEnter={openMega}
          onMouseLeave={scheduleCloseMega}
        >
          <button
            type="button"
            aria-expanded={megaOpen}
            aria-haspopup="true"
            onClick={() => setMegaOpen((open) => !open)}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold transition ${
              megaOpen
                ? "bg-white/[0.06] text-white"
                : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <StorefrontIcon name="games" className="h-4 w-4 text-violet-300" />
            Games
            <StorefrontIcon
              name="chevron-down"
              className={`h-3.5 w-3.5 text-slate-500 transition-transform ${megaOpen ? "rotate-180" : ""}`}
            />
          </button>

          {megaOpen ? (
            <div
              className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[38rem] rounded-2xl border border-white/[0.08] bg-[#0d0f16] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
              role="menu"
              aria-label="Browse games"
            >
              <p className="px-1 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                Instant top-up
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {liveGames.map((game) => (
                  <Link
                    key={game.slug}
                    href={game.href}
                    role="menuitem"
                    className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-violet-400/20 hover:bg-violet-500/[0.07]"
                  >
                    <GameThumb game={game} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-slate-100 group-hover:text-white">
                        {game.title}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {game.category}
                        {game.startingPrice
                          ? ` · from ${game.startingPrice}`
                          : ""}
                      </span>
                    </span>
                    <StorefrontIcon
                      name="arrow"
                      className="h-3.5 w-3.5 shrink-0 text-slate-600 opacity-0 transition group-hover:opacity-100"
                    />
                  </Link>
                ))}
              </div>

              {upcomingGames.length > 0 ? (
                <>
                  <p className="px-1 pb-2 pt-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Coming soon
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {upcomingGames.map((game) => (
                      <span
                        key={game.slug}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] py-1 pl-1 pr-2.5 text-[11px] font-bold text-slate-500"
                      >
                        <GameThumb game={game} size="h-6 w-6" />
                        {game.title}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}

              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <StorefrontIcon
                    name="shield"
                    className="h-3.5 w-3.5 text-emerald-400"
                  />
                  Official supplier · Instant delivery
                </span>
                <Link
                  href="/#games"
                  className="inline-flex items-center gap-1 text-[12px] font-black text-violet-300 transition hover:text-violet-200"
                >
                  Browse all games
                  <StorefrontIcon name="arrow" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {primaryLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
          >
            <StorefrontIcon
              name={link.icon}
              className="h-4 w-4 text-slate-500"
            />
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
        className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-slate-300 transition hover:text-white lg:hidden"
      >
        <StorefrontIcon name="menu" className="h-[18px] w-[18px]" />
      </button>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col overflow-y-auto border-l border-white/[0.08] bg-[#0b0d13] shadow-[-24px_0_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
              <span className="text-[13px] font-black uppercase tracking-[0.14em] text-slate-400">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:text-white"
              >
                <StorefrontIcon name="close" className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3 py-3">
              <p className="px-1 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                Instant top-up
              </p>
              <div className="flex flex-col gap-1">
                {liveGames.map((game) => (
                  <Link
                    key={game.slug}
                    href={game.href}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.05]"
                  >
                    <GameThumb game={game} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-slate-100">
                        {game.title}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {game.category}
                        {game.startingPrice
                          ? ` · from ${game.startingPrice}`
                          : ""}
                      </span>
                    </span>
                    <StorefrontIcon
                      name="arrow"
                      className="h-3.5 w-3.5 shrink-0 text-slate-600"
                    />
                  </Link>
                ))}
              </div>

              <p className="px-1 pb-2 pt-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                Store
              </p>
              <div className="flex flex-col gap-1">
                {[
                  { label: "All games", href: "/#games", icon: "grid" as const },
                  ...primaryLinks,
                  { label: "My cart", href: "/cart", icon: "cart" as const },
                  {
                    label: "My account",
                    href: "/account",
                    icon: "account" as const,
                  },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-[13px] font-bold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <StorefrontIcon
                      name={link.icon}
                      className="h-4 w-4 text-slate-500"
                    />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-auto border-t border-white/[0.06] px-4 py-4">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <StorefrontIcon
                  name="shield"
                  className="h-3.5 w-3.5 text-emerald-400"
                />
                Secure payments · Instant delivery
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
