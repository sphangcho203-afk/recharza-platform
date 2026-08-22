"use client";

import { useEffect, useRef } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";

export function StorefrontSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const opensSearch =
        event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k");

      if (!opensSearch || isTyping) return;
      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <form
      action="/#games"
      method="get"
      role="search"
      className="relative min-w-0 flex-1"
    >
      <label htmlFor="storefront-search" className="sr-only">
        Search Recharza games and top-ups
      </label>
      <StorefrontIcon
        name="search"
        className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-500"
      />
      <input
        ref={inputRef}
        id="storefront-search"
        name="q"
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Search games, packs or regions"
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-14 text-sm font-bold text-slate-900 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-500/10 shadow-sm"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-400 sm:inline shadow-sm">
        /
      </kbd>
    </form>
  );
}
