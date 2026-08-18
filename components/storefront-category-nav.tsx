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
      className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain border-t border-white/[0.06] py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((item) => {
        const active = selected === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`min-h-9 shrink-0 rounded-md border px-3.5 py-2 text-xs font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60 ${
              active
                ? "border-white bg-white text-slate-950"
                : "border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-violet-300/25 hover:bg-violet-300/[0.06] hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
