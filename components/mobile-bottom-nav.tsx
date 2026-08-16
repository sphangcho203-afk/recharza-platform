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
        className="h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden"
      />
      <nav
        aria-label="Mobile customer navigation"
        className="fixed inset-x-0 bottom-0 z-[70] grid grid-cols-5 border-t border-white/[0.09] bg-[#05070d]/97 px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(0,0,0,0.42)] backdrop-blur-xl lg:hidden"
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
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[9px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                active ? "text-white" : "text-slate-500 hover:text-white"
              }`}
            >
              <span
                className={`relative grid h-7 w-7 place-items-center rounded-lg transition ${
                  active
                    ? "bg-violet-500/15 text-violet-300"
                    : "text-slate-500"
                }`}
              >
                <StorefrontIcon name={item.icon} className="h-4 w-4" />
                {showBadge ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -top-1.5 grid min-h-[1rem] min-w-[1rem] place-items-center rounded-full bg-violet-500 px-1 text-[8px] font-black leading-none text-white"
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
