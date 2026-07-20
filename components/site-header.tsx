import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06060f]/82 backdrop-blur-2xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/#top" className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <RecharzaMark compact />
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.035] p-1 text-sm text-slate-300 lg:flex"
          aria-label="Primary navigation"
        >
          {[
            ["Games", "/#games"],
            ["MLBB Regions", "/#games"],
            ["Pricing", "/#pricing-engine"],
            ["How it works", "/#how-it-works"],
            ["Track order", "/orders/lookup"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="rounded-xl px-3.5 py-2 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/operator"
            className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-violet-400/40 hover:bg-white/10 sm:block"
          >
            Operator
          </Link>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-black text-white shadow-[0_10px_30px_rgba(139,92,246,0.24)] transition hover:-translate-y-0.5"
          >
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
}
