"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  StorefrontIcon,
  type StorefrontIconName,
} from "@/components/storefront-icon";

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
    matches: (pathname) => pathname === "/" || pathname.startsWith("/games"),
  },
  {
    label: "Orders",
    href: "/orders/lookup",
    icon: "track",
    matches: (pathname) => pathname.startsWith("/orders"),
  },
  {
    label: "Support",
    href: "/support",
    icon: "support",
    matches: (pathname) => pathname.startsWith("/support"),
  },
  {
    label: "Account",
    href: "/account",
    icon: "account",
    matches: (pathname) => pathname.startsWith("/account"),
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
  if (excludedPrefixes.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(5.5rem+env(safe-area-inset-bottom))] lg:hidden"
      />
      <nav
        aria-label="Mobile customer navigation"
        className="customer-mobile-nav fixed inset-x-3 bottom-3 z-[70] grid grid-cols-4 rounded-2xl border border-white/[0.1] bg-[#080a12]/95 p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_22px_70px_rgba(0,0,0,0.58)] backdrop-blur-2xl lg:hidden"
      >
        {items.map((item) => {
          const active = item.matches(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                active
                  ? "bg-white text-slate-950"
                  : "text-slate-500 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <StorefrontIcon
                name={item.icon}
                className={`h-[18px] w-[18px] ${active ? "text-violet-600" : ""}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
