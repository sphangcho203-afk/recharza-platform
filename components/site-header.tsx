import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#07070c]/94 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href="/#top"
          className="shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          aria-label="Recharza home"
        >
          <RecharzaMark compact />
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex" aria-label="Customer navigation">
          <Link href="/#games" className="transition hover:text-white">
            Games
          </Link>
          <Link href="/#mlbb-regions" className="transition hover:text-white">
            MLBB markets
          </Link>
          <Link href="/orders/lookup" className="transition hover:text-white">
            Track order
          </Link>
          <Link href="/account" className="transition hover:text-white">
            Account
          </Link>
        </nav>

        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/orders/lookup"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-slate-200 transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:hidden"
            aria-label="Track an order"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M4 7h16M7 4v6M17 4v6M6 13h5M6 17h8" />
            </svg>
          </Link>
          <Link
            href="/account"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-slate-200 transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label="Open customer account"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <circle cx="12" cy="8" r="3" />
              <path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" />
            </svg>
          </Link>
          <Link
            href="/games/mobile-legends"
            className="min-h-11 shrink-0 rounded-xl bg-white px-3.5 py-3 text-xs font-black text-slate-950 transition hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Top up
          </Link>
        </div>
      </div>
    </header>
  );
}