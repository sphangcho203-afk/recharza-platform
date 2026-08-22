"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { StorefrontIcon } from "@/components/storefront-icon";
import { getPublicSupportChannels } from "@/lib/support-config";

const links = [
  { href: "/", label: "Home", icon: "games" as const },
  { href: "/?category=top-up#games", label: "Game top-ups", icon: "games" as const },
  { href: "/?category=gift-cards#games", label: "Gift cards", icon: "receipt" as const },
  { href: "/#games", label: "All products", icon: "games" as const },
  { label: "Support", icon: "support" as const, support: true },
  { href: "/orders/lookup", label: "Track an order", icon: "track" as const },
  { href: "/account/orders", label: "My orders", icon: "track" as const },
  { href: "/cart", label: "Cart", icon: "cart" as const },
  { href: "/account", label: "My account", icon: "account" as const },
];

type SupportChannel = {
  key: string;
  label: string;
  description: string;
  icon: string;
  href: string | null;
  external: boolean;
  disabled?: boolean;
};

function ChannelMark({ channel }: { channel: SupportChannel }) {
  const icon = channel.icon;
  return (
    <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
      {icon === "group" || icon === "bot" ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6" role="presentation">
          <circle cx="12" cy="12" r="11" fill="#229ED9" />
          <path d="m5.4 11.7 12.2-4.72c.57-.2 1.07.14.88.98l-2.08 9.8c-.15.7-.56.87-1.14.55l-3.25-2.4-1.57 1.51c-.17.17-.31.31-.63.31l.23-3.3 6-5.42c.26-.23-.06-.36-.4-.13l-7.42 4.67-3.2-1c-.69-.22-.7-.69.38-1.1Z" fill="white" />
        </svg>
      ) : null}
      {icon === "whatsapp" ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6" role="presentation">
          <circle cx="12" cy="12" r="11" fill="#25D366" />
          <path d="M7.4 17.2 8.1 14a5.9 5.9 0 1 1 2 1.9l-2.7 1.3Z" fill="white" />
          <path d="M10.1 9.2c.16-.2.3-.2.48-.2h.4c.15 0 .3.06.36.24l.55 1.34c.07.18.04.32-.08.47l-.4.47c-.1.12-.1.23-.02.37.23.42.83 1.27 1.86 1.75.16.08.28.07.38-.05l.5-.6c.1-.13.23-.15.38-.1l1.25.58c.18.08.24.2.2.4-.1.48-.54 1.08-1.04 1.2-.45.1-1.02.04-1.63-.2-.57-.22-1.38-.7-2.23-1.53-.7-.7-1.2-1.46-1.44-2.04-.25-.6-.25-1.25.03-1.63Z" fill="#25D366" />
        </svg>
      ) : null}
      {icon === "email" ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6" role="presentation">
          <path d="M3.5 6.5h17v11h-17z" fill="white" />
          <path d="m4 7 8 6 8-6" fill="none" stroke="#EA4335" strokeWidth="2" />
          <path d="m4 17 5.2-5M20 17l-5.2-5" fill="none" stroke="#4285F4" strokeWidth="2" />
          <path d="M4 7v10M20 7v10" stroke="#34A853" strokeWidth="2" />
        </svg>
      ) : null}
      {icon === "instagram" ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6" role="presentation">
          <defs><linearGradient id="instagram-support-gradient" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#F58529" /><stop offset=".45" stopColor="#DD2A7B" /><stop offset="1" stopColor="#8134AF" /></linearGradient></defs>
          <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="url(#instagram-support-gradient)" strokeWidth="2.2" />
          <circle cx="12" cy="12" r="3.7" fill="none" stroke="url(#instagram-support-gradient)" strokeWidth="2" />
          <circle cx="17.3" cy="6.8" r="1.1" fill="#E1306C" />
        </svg>
      ) : null}
    </span>
  );
}

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
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
      if (event.key === "Escape") {
        if (supportOpen) setSupportOpen(false);
        else setOpen(false);
      }
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
  }, [open, supportOpen]);

  const closeMenu = () => {
    setSupportOpen(false);
    setOpen(false);
  };

  const publicChannels = getPublicSupportChannels();
  const supportChannels: SupportChannel[] = [
    {
      key: "telegram-group",
      label: "Telegram live group",
      description: "Talk with the Recharza support community.",
      icon: "group",
      href: "https://t.me/supprtrz",
      external: true,
    },
    ...publicChannels.map((c) => ({
      key: c.id,
      label: c.label,
      description: c.detail,
      icon: c.id,
      href: c.href,
      external: true,
      disabled: !c.available,
    })),
  ];

  const menu = open ? (
    <div className="recharza-scrim fixed inset-0 z-[9999] isolate" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
        <aside id="mobile-navigation" role="dialog" aria-modal="true" aria-labelledby={supportOpen ? "support-chooser-title" : "mobile-navigation-title"} className="recharza-sheet absolute left-0 top-0 h-auto max-h-[95vh] w-[min(21rem,90vw)] overflow-hidden rounded-br-[2.5rem] shadow-2xl bg-white border-r border-b border-slate-200">
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="recharza-atmo-v2 absolute inset-0 opacity-[0.03]" />
          </span>
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">Recharza</p>
            {supportOpen ? (
              <div className="mt-1 flex items-center gap-2">
                <button type="button" onClick={() => setSupportOpen(false)} aria-label="Back to store navigation" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">
                  <StorefrontIcon name="chevron" className="h-5 w-5 rotate-180" />
                </button>
                <h2 id="support-chooser-title" className="text-lg font-bold tracking-tight text-slate-900">Support</h2>
              </div>
            ) : <h2 id="mobile-navigation-title" className="mt-1 text-lg font-bold tracking-tight text-slate-900">Store navigation</h2>}
          </div>
          <button type="button" onClick={closeMenu} aria-label="Close navigation menu" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">
            <StorefrontIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        {supportOpen ? (
          <div className="mt-4 overflow-y-auto px-6 pb-8">
            <p className="px-1 text-sm leading-6 text-slate-500">Choose the channel that works best for your question.</p>
            <nav aria-label="Support channels" className="mt-5 space-y-2.5">
              {supportChannels.map((channel) => {
                const content = <><ChannelMark channel={channel} /><span className="relative min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{channel.label}</span><span className="mt-0.5 block text-[11px] font-medium leading-5 text-slate-500">{channel.description}</span></span><StorefrontIcon name="arrow" className="recharza-nav-arrow relative h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-transform" /></>;
                const isDisabled = "disabled" in channel && channel.disabled;
                const className = `recharza-nav-row group relative flex min-h-[5rem] items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-300 ease-out hover:border-violet-300 hover:bg-violet-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 ${isDisabled ? "cursor-not-allowed opacity-55" : ""}`;
                if (isDisabled) return <div key={channel.key} aria-disabled="true" className={className}>{content}</div>;
                return <a key={channel.key} href={channel.href ?? undefined} target={channel.external ? "_blank" : undefined} rel={channel.external ? "noopener noreferrer" : undefined} onClick={() => { setSupportOpen(false); setOpen(false); }} className={className}>{content}</a>;
              })}
            </nav>
          </div>
        ) : (
          <nav className="mt-5 space-y-2.5 overflow-y-auto px-6 pb-10">
            {links.map((link) => {
              const base = "recharza-nav-row group relative flex min-h-[4.25rem] w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-left text-[15px] font-black text-slate-600 transition-all duration-300 ease-out hover:bg-violet-50/40 hover:border-violet-200 hover:text-violet-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60";
              const icon = <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-violet-600 shadow-sm ring-1 ring-violet-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:shadow-md" style={{ background: "#f5f3ff" }}><StorefrontIcon name={link.icon} className="h-[20px] w-[20px]" /></span>;
              const arrow = <StorefrontIcon name="arrow" className="recharza-nav-arrow ml-auto h-4 w-4 shrink-0 opacity-20 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100 group-hover:text-violet-600" />;
              return link.support ? (
                <button key={link.label} type="button" onClick={() => setSupportOpen(true)} className={base}>
                  {icon}<span className="relative">{link.label}</span>{arrow}
                </button>
              ) : (
                <a key={link.href} href={link.href} onClick={closeMenu} className={base}>
                  {icon}<span className="relative">{link.label}</span>{arrow}
                </a>
              );
            })}
          </nav>
        )}
      </aside>
    </div>
  ) : null;

  return (
    <>
      <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => { setOpen((value) => !value); setSupportOpen(false); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition duration-150 ease-out hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">
        <span className="sr-only">{open ? "Close navigation menu" : "Open navigation menu"}</span>
        <StorefrontIcon name="menu" className="h-[18px] w-[18px]" />
      </button>
      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
