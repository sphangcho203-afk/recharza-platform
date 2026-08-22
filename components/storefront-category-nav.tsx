"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const categories = [
  { id: "all", label: "All", href: "/#games" },
  { id: "top-up", label: "Top Up", href: "/?category=top-up#games" },
  { id: "gift-cards", label: "Gift Cards", href: "/?category=gift-cards#games" },
  { id: "popular", label: "Popular", href: "/?category=popular#games" },
] as const;

export function StorefrontCategoryNav() {
  const searchParams = useSearchParams();
  const selected = searchParams.get("category") ?? "all";

  return (
    <nav
      aria-label="Game categories"
      className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain border-t border-slate-100 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((item) => {
        const active = selected === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`min-h-9 shrink-0 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
              active
                ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-100"
                : "border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 shadow-sm"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
