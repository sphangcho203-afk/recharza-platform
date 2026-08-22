"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  StorefrontIcon,
  type StorefrontIconName,
} from "@/components/storefront-icon";
import { useCartCount } from "@/components/use-cart-count";

const items: Array<{
  label: string;
  href: string;
  icon: StorefrontIconName;
  matches: (pathname: string) => boolean;
}> = [
  {
    label: "Home",
    href: "/",
    icon: "games",
    matches: (path) => path === "/" || path.startsWith("/games"),
  },
  {
    label: "Cart",
    href: "/cart",
    icon: "cart",
    matches: (path) => path === "/cart",
  },
  {
    label: "Orders",
    href: "/account/orders",
    icon: "track",
    matches: (path) => path.startsWith("/account/orders"),
  },
  {
    label: "Help",
    href: "/support",
    icon: "support",
    matches: (path) => path.startsWith("/support"),
  },
  {
    label: "Profile",
    href: "/account",
    icon: "account",
    matches: (path) => path.startsWith("/account"),
  },
];

const excludedPrefixes = [
  "/admin",
  "/operator",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count, ready } = useCartCount();
  if (excludedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(5.25rem+env(safe-area-inset-bottom))] lg:hidden"
      />
      <nav
        aria-label="Mobile customer navigation"
        className="fixed inset-x-0 bottom-0 z-[70] grid grid-cols-5 border-t border-white/10 bg-[#0f1115]/90 px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl lg:hidden"
      >
        {items.map((item) => {
          const active = item.matches(pathname);
          const showBadge = item.href === "/cart" && ready && count > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={showBadge ? `${item.label}, ${count} items` : item.label}
              className={`flex min-h-[4.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0 text-[9px] font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
                active ? "text-white" : "text-slate-500 hover:text-slate-400"
              }`}
            >
              <span
                className={`relative grid h-7 w-7 place-items-center rounded-lg transition-all duration-300 ${
                  active
                    ? "bg-violet-500/20 text-violet-400 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                    : "text-slate-500"
                }`}
              >
                <StorefrontIcon name={item.icon} className="h-3.5 w-3.5" />
                {showBadge ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1 grid min-h-[0.75rem] min-w-[0.75rem] place-items-center rounded-full bg-violet-600 px-0.5 text-[7px] font-black leading-none text-white shadow-[0_0_8px_rgba(124,58,237,0.6)]"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </span>
              <span className="whitespace-nowrap uppercase tracking-[0.02em] text-[7px] sm:text-[9px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
