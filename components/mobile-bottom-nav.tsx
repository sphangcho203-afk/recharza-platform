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
    label: "My orders",
    href: "/account/orders",
    icon: "track",
    matches: (path) => path.startsWith("/account/orders"),
  },
  {
    label: "Support",
    href: "/support",
    icon: "support",
    matches: (path) => path.startsWith("/support"),
  },
  {
    label: "Account",
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
        className="fixed inset-x-0 bottom-0 z-[70] grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden"
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
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[9px] font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
                active ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span
                className={`relative grid h-7 w-7 place-items-center rounded-lg transition-all duration-300 ${
                  active
                    ? "bg-violet-50 text-violet-600"
                    : "text-slate-400"
                }`}
              >
                <StorefrontIcon name={item.icon} className="h-4 w-4" />
                {showBadge ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -top-1.5 grid min-h-[1rem] min-w-[1rem] place-items-center rounded-full bg-violet-600 px-1 text-[8px] font-bold leading-none text-white shadow-sm"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
