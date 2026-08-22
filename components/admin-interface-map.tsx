import Link from "next/link";

import { mobileLegendsMarkets } from "@/lib/mobile-legends-market";

const interfaces = [
  {
    title: "Customer storefront",
    href: "/",
    description: "Homepage, game catalogue, customer navigation and storefront content.",
    access: "Public",
  },
  {
    title: "Customer account",
    href: "/account",
    description: "Verified account, order history, saved players and customer security.",
    access: "Verified user",
  },
  {
    title: "Order tracking",
    href: "/orders/lookup",
    description: "Private order lookup and token-protected tracking.",
    access: "Customer token",
  },
  {
    title: "Staff workspace",
    href: "/staff",
    description: "Order operations, fulfilment recovery and staff queues.",
    access: "Staff or admin",
  },
  {
    title: "Admin control centre",
    href: "/admin",
    description: "Catalogue, pricing, supplier, order, system and access controls.",
    access: "Admin",
  },
];

export function AdminInterfaceMap() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {interfaces.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="system-card group p-5 border border-slate-200 bg-white shadow-sm rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-slate-900">{item.title}</h3>
              <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {item.access}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{item.description}</p>
            <span className="mt-4 inline-flex text-xs font-bold text-violet-600 transition group-hover:translate-x-0.5">
              Open interface →
            </span>
          </Link>
        ))}
      </div>

      <section className="system-panel p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">Regional versions</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Mobile Legends interface routes</h3>
          </div>
          <Link href="/games/mobile-legends" className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50">
            Open market chooser
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {mobileLegendsMarkets.map((market) => (
            <Link
              key={market.code}
              href={`/games/mobile-legends/${market.code}`}
              className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 transition-all duration-300 shadow-sm hover:border-violet-200 hover:bg-violet-50"
            >
              <span className="text-xl" aria-hidden="true">{market.flag}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">{market.label}</span>
                <span className="block truncate text-[10px] font-medium text-slate-400">/{market.code} · {market.defaultCurrency}</span>
              </span>
              <span className="text-violet-600">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
