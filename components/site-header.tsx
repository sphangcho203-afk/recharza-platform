import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";

const navigation = [
  { id: "games", label: "Games", href: "/#games", description: "Browse direct top-ups and game packs." },
  { id: "gift-cards", label: "Gift cards", href: "/redeem-codes#gift-cards", description: "Platform wallets and digital gift cards." },
  { id: "redeem", label: "Redeem codes", href: "/redeem-codes", description: "Buy codes for supported games and platforms." },
  { id: "track", label: "Track order", href: "/orders/lookup", description: "Open secure private order tracking." },
  { id: "support", label: "Support", href: "/account#support", description: "Get help with an order or account." },
  { id: "account", label: "Account", href: "/account", description: "Orders, wallet, rewards, addresses, and security." },
] as const;

const bottomNavigation = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Games", href: "/#games", icon: "games" },
  { label: "Orders", href: "/orders/lookup", icon: "orders" },
  { label: "Wallet", href: "/account#wallet", icon: "wallet" },
  { label: "Account", href: "/account", icon: "account" },
] as const;

function NavigationIcon({ icon }: { icon: (typeof bottomNavigation)[number]["icon"] }) {
  if (icon === "home") return <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />;
  if (icon === "games") return <><path d="M8 9h8a5 5 0 0 1 4.7 6.7l-1 2.8a2 2 0 0 1-3.4.6L14.5 17h-5l-1.8 2.1a2 2 0 0 1-3.4-.6l-1-2.8A5 5 0 0 1 8 9Z" /><path d="M8 13v4M6 15h4M16 14h.01M18 16h.01" /></>;
  if (icon === "orders") return <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>;
  if (icon === "wallet") return <><path d="M3 6a3 3 0 0 1 3-3h13v18H6a3 3 0 0 1-3-3z" /><path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z" /></>;
  return <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
}

export function SiteHeader() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--surface-0)]/94 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link
            href="/#top"
            className="shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label="Recharza home"
          >
            <RecharzaMark compact />
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-slate-400 lg:flex" aria-label="Customer navigation">
            {navigation.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/#games"
              className="min-h-11 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Browse games
            </Link>
          </div>

          <details className="group relative md:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Open customer navigation</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <nav
              aria-label="Mobile customer navigation"
              className="absolute right-0 top-13 z-50 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-2)] p-2 shadow-2xl shadow-black/50"
            >
              {navigation.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block min-h-12 rounded-xl px-3 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <span className="block">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] font-normal leading-4 text-slate-500">
                    {item.description}
                  </span>
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </header>

      <nav
        aria-label="Mobile primary navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#08090e]/96 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden"
      >
        {bottomNavigation.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="grid min-h-14 place-items-center gap-0.5 rounded-xl px-1 text-[10px] font-bold text-slate-500 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <NavigationIcon icon={item.icon} />
            </svg>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
