"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";

const links = [
  { href: "/", label: "Home", icon: "games" as const },
  { href: "/#games", label: "Browse games", icon: "games" as const },
  { href: "/cart", label: "Cart", icon: "cart" as const },
  { href: "/orders/lookup", label: "Track orders", icon: "track" as const },
  { href: "/support", label: "Support", icon: "support" as const },
  { href: "/account", label: "Account", icon: "account" as const },
  { href: "/policies/terms", label: "Legal", icon: "shield" as const },
];

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const pageContent = Array.from(document.querySelectorAll<HTMLElement>("main, footer"));
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

  return (
    <>
      <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">
        <span className="sr-only">{open ? "Close navigation menu" : "Open navigation menu"}</span>
        <StorefrontIcon name="menu" className="h-[18px] w-[18px]" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] isolate bg-black/65 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <aside id="mobile-navigation" role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title" className="relative h-full w-[min(22rem,88vw)] overflow-y-auto border-r border-white/[0.12] bg-[#0e1018] opacity-100 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Recharza</p>
                <h2 id="mobile-navigation-title" className="mt-1 text-xl font-black text-white">Store navigation</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation menu" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </div>
            <nav className="mt-5 space-y-1">
              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-black text-slate-300 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">
                  <StorefrontIcon name={link.icon} className="h-4 w-4 text-violet-300" />
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-xs font-black text-white">Need a hand?</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Our support team can help with account, payment, and delivery questions.</p>
              <Link href="/support" onClick={() => setOpen(false)} className="mt-3 inline-flex text-xs font-black text-violet-300 hover:text-violet-200">Open support <span aria-hidden="true" className="ml-1">→</span></Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
