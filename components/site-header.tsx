import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";

const navigation = [
  { href: "/#games", label: "Games" },
  { href: "/orders/lookup", label: "Track order" },
  { href: "/account", label: "Account" },
  { href: "/operator", label: "Operator" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07070c]/94 backdrop-blur-xl">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/#top"
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          aria-label="Recharza home"
        >
          <RecharzaMark compact />
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/games/mobile-legends"
            className="rounded-xl bg-white px-3.5 py-2 text-xs font-black text-slate-950 transition hover:bg-violet-200"
          >
            Top up MLBB
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open navigation</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <nav
            aria-label="Mobile navigation"
            className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#101018] p-2 shadow-2xl shadow-black/50"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/games/mobile-legends"
              className="mt-1 block rounded-xl bg-white px-3 py-3 text-center text-sm font-black text-slate-950"
            >
              Top up Mobile Legends
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
