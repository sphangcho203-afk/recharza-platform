"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { StorefrontIcon, type StorefrontIconName } from "@/components/storefront-icon";

const items: Array<{
  label: string;
  href: string;
  icon: StorefrontIconName;
  matches: (pathname: string) => boolean;
}> = [
  { label: "Home", href: "/", icon: "games", matches: (path) => path === "/" || path.startsWith("/games") },
  { label: "Orders", href: "/orders/lookup", icon: "track", matches: (path) => path.startsWith("/orders") },
  { label: "Support", href: "/support", icon: "support", matches: (path) => path.startsWith("/support") },
  { label: "Account", href: "/account", icon: "account", matches: (path) => path.startsWith("/account") },
];

const excludedPrefixes = ["/admin", "/operator", "/login", "/signup", "/forgot-password", "/reset-password"];

export function MobileBottomNav() {
  const pathname = usePathname();
  if (excludedPrefixes.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <>
      <div aria-hidden="true" className="h-[calc(4.75rem+env(safe-area-inset-bottom))] lg:hidden" />
      <nav
        aria-label="Mobile customer navigation"
        className="fixed inset-x-0 bottom-0 z-[70] grid grid-cols-4 border-t border-white/[0.1] bg-[#06080f]/96 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:hidden"
      >
        {items.map((item) => {
          const active = item.matches(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                active ? "text-white" : "text-slate-500 hover:text-white"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl transition ${
                  active ? "bg-violet-500/18 text-violet-300" : "text-slate-500"
                }`}
              >
                <StorefrontIcon name={item.icon} className="h-[18px] w-[18px]" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
