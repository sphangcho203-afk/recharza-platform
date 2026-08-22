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
        className="fixed inset-x-0 bottom-0 z-[70] grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.1)] backdrop-blur-md lg:hidden"
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
              className={`flex min-h-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-0 text-[9px] font-black transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
                active ? "text-violet-700" : "text-slate-900 hover:text-black"
              }`}
            >
              <span
                className={`relative grid h-8 w-8 place-items-center rounded-xl transition-all duration-300 ${
                  active
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                    : "text-slate-900"
                }`}
              >
                <StorefrontIcon name={item.icon} className="h-4 w-4" />
                {showBadge ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1.5 grid min-h-[0.9rem] min-w-[0.9rem] place-items-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[8px] font-black leading-none text-white shadow-sm"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </span>
              <span className="whitespace-nowrap text-[8px] font-black uppercase tracking-widest sm:text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
