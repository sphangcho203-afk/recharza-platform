import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07070c]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/#top"
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <RecharzaMark compact />
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex" aria-label="Primary navigation">
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

        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/[0.07]"
          >
            Account
          </Link>
          <Link
            href="/games/mobile-legends"
            className="hidden rounded-xl bg-white px-3.5 py-2 text-xs font-black text-slate-950 transition hover:bg-violet-200 sm:block"
          >
            Top up MLBB
          </Link>
        </div>
      </div>
    </header>
  );
}
