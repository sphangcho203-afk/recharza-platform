"use client";

import Link from "next/link";
import { useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";

const links = [
  { href: "/#games", label: "Browse games", icon: "games" as const },
  { href: "/#offers", label: "Featured offers", icon: "receipt" as const },
  { href: "/#how-it-works", label: "How it works", icon: "shield" as const },
  { href: "/orders/lookup", label: "Track order", icon: "track" as const },
  { href: "/support", label: "Help center", icon: "support" as const },
  { href: "/account", label: "Account", icon: "account" as const },
];

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative lg:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white">
        <span className="sr-only">Open navigation menu</span>
        <StorefrontIcon name="menu" className="h-[18px] w-[18px]" />
      </button>
      {open ? (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#10121b]/[0.98] p-2 shadow-2xl backdrop-blur-xl">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white">
              <StorefrontIcon name={link.icon} className="h-4 w-4 text-violet-300" />{link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
