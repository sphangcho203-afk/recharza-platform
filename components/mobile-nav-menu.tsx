"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { StorefrontIcon } from "@/components/storefront-icon";
import { TelegramGroupLauncher } from "@/components/telegram-group-launcher";

const links = [
  { href: "/", label: "Home", icon: "games" as const },
  { href: "/?category=top-up#games", label: "Game top-ups", icon: "games" as const },
  { href: "/?category=gift-cards#games", label: "Gift cards", icon: "receipt" as const },
  { href: "/#games", label: "All products", icon: "games" as const },
  { href: "https://t.me/supprtrz", label: "Live support group", icon: "support" as const, external: true },
  { href: "/orders/lookup", label: "Track an order", icon: "track" as const },
  { href: "/cart", label: "Cart", icon: "cart" as const },
  { href: "/account", label: "My account", icon: "account" as const },
];

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const pageContent = Array.from(document.querySelectorAll<HTMLElement>("main > :not(header), footer"));
    pageContent.forEach((element) => {
      if (open) {
        element.setAttribute("aria-hidden", "true");
        element.inert = true;
      } else {
        element.removeAttribute("aria-hidden");
        element.inert = false;
      }
    });
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      pageContent.forEach((element) => {
        element.removeAttribute("aria-hidden");
        element.inert = false;
      });
      (previous ?? triggerRef.current)?.focus?.();
    };
  }, [open]);

  const menu = open ? (
    <div className="fixed inset-0 z-[9999] isolate bg-black/70 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <aside id="mobile-navigation" role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title" className="relative h-full w-[min(22rem,88vw)] overflow-hidden border-r border-white/[0.12] bg-[#0e1018] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Recharza</p>
            <h2 id="mobile-navigation-title" className="mt-1 text-xl font-black text-white">Store navigation</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation menu" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>
        <nav className="mt-3 space-y-1">
          {links.map((link) => link.external ? (
            <TelegramGroupLauncher key={link.href} showArrow={false} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60" onClick={() => setOpen(false)}>
              <StorefrontIcon name={link.icon} className="h-5 w-5 text-violet-300" />
              <span>{link.label}</span>
              <StorefrontIcon name="arrow" className="ml-auto h-4 w-4 text-slate-500" />
            </TelegramGroupLauncher>
          ) : (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">
              <StorefrontIcon name={link.icon} className="h-5 w-5 text-violet-300" />
              <span>{link.label}</span>
              <StorefrontIcon name="arrow" className="ml-auto h-4 w-4 text-slate-500" />
            </a>
          ))}
        </nav>
      </aside>
    </div>
  ) : null;

  return (
    <>
      <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">
        <span className="sr-only">{open ? "Close navigation menu" : "Open navigation menu"}</span>
        <StorefrontIcon name="menu" className="h-[18px] w-[18px]" />
      </button>
      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
