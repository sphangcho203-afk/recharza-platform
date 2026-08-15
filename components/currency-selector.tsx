"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";
import { supportedCurrencies, type SupportedCurrencyCode } from "@/lib/commerce/currencies";

type CurrencySelectorProps = {
  ratesFromInrMicros: Partial<Record<SupportedCurrencyCode, number>>;
  compact?: boolean;
};

const STORAGE_KEY = "recharza.display-currency";
const CURRENCY_EVENT = "recharza:currency-change";

function currencySymbol(code: SupportedCurrencyCode, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value ?? code;
}

function readStoredCurrency(): SupportedCurrencyCode {
  if (typeof window === "undefined") return "INR";
  const stored = window.localStorage.getItem(STORAGE_KEY)?.toUpperCase();
  return supportedCurrencies.some((item) => item.code === stored)
    ? (stored as SupportedCurrencyCode)
    : "INR";
}

export function CurrencySelector({ ratesFromInrMicros, compact = false }: CurrencySelectorProps) {
  const [currency, setCurrency] = useState<SupportedCurrencyCode>(readStoredCurrency);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchId = useId();
  const titleId = useId();
  const selected = supportedCurrencies.find((item) => item.code === currency) ?? supportedCurrencies[0];
  const usdToSelected = useMemo(() => {
    if (currency === "USD") return 1;
    const usdRate = ratesFromInrMicros.USD;
    const targetRate = ratesFromInrMicros[currency];
    if (!usdRate || !targetRate) return null;
    return targetRate / usdRate;
  }, [currency, ratesFromInrMicros]);
  const filteredCurrencies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return supportedCurrencies;
    return supportedCurrencies.filter((item) =>
      `${item.code} ${item.region}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("input")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [open]);

  function choose(next: SupportedCurrencyCode) {
    setCurrency(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: next }));
    setQuery("");
    setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`group inline-flex min-h-10 min-w-0 items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.06] px-2.5 text-left transition-colors duration-150 ease-out hover:border-violet-300/45 hover:bg-violet-300/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60 sm:px-3 ${compact ? "w-[5.5rem]" : "min-w-[11.5rem]"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Display currency: ${selected.code} ${selected.region}`}
      >
        <span aria-hidden="true" className="grid h-7 min-w-7 shrink-0 place-items-center rounded-full border border-violet-200/25 bg-violet-300/12 px-1.5 text-xs font-black text-violet-100">{currencySymbol(selected.code, selected.locale)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-black uppercase tracking-[0.12em] text-slate-300 sm:text-xs">{selected.code}</span>
          <span className="sr-only">{selected.label} · {selected.region}</span>
        </span>
        <StorefrontIcon name="arrow" className="h-3 w-3 shrink-0 rotate-90 text-violet-200/70 transition-transform group-hover:translate-y-0.5" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-h-[min(78vh,38rem)] overflow-hidden rounded-t-2xl border border-white/[0.12] bg-[#11131d] shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:max-w-lg sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">Display settings</p>
                <h2 id={titleId} className="mt-1 text-xl font-black text-white">Choose currency</h2>
                <p className="mt-1 text-sm text-slate-500">Prices update without leaving your current page.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close currency picker" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="border-b border-white/[0.08] p-4">
              <label htmlFor={searchId} className="sr-only">Search currencies</label>
              <div className="relative">
                <StorefrontIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input id={searchId} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search country or currency" className="min-h-11 w-full rounded-lg border border-white/[0.1] bg-white/[0.04] pl-10 pr-3 text-sm text-white outline-none transition focus:border-violet-300/50 focus:ring-2 focus:ring-violet-300/20" />
              </div>
            </div>
            <ul className="max-h-[min(50vh,24rem)] overflow-y-auto p-2" aria-label="Currencies">
              {filteredCurrencies.map((item) => {
                const active = item.code === currency;
                return (
                  <li key={item.code}>
                    <button type="button" onClick={() => choose(item.code)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-150 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60 ${active ? "bg-violet-300/10 text-white" : "text-slate-300"}`} aria-pressed={active}>
                      <span aria-hidden="true" className="grid h-10 min-w-10 shrink-0 place-items-center rounded-xl border border-violet-200/15 bg-violet-300/[0.08] px-1.5 text-center text-[11px] font-black text-violet-100"><span className="text-sm">{currencySymbol(item.code, item.locale)}</span><span className="text-[8px] tracking-[0.08em] text-violet-200/70">{item.code}</span></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{item.region}</span><span className="mt-0.5 block text-xs text-slate-500">Display prices in {item.code}</span></span>
                      {active ? <StorefrontIcon name="shield" className="h-4 w-4 shrink-0 text-violet-300" /> : null}
                    </button>
                  </li>
                );
              })}
              {!filteredCurrencies.length ? <li className="px-3 py-8 text-center text-sm text-slate-500">No currencies match “{query}”.</li> : null}
            </ul>
            <div className="border-t border-white/[0.08] px-5 py-3 text-xs text-slate-600">
              {usdToSelected ? `Reference rate: 1 USD ≈ ${usdToSelected.toFixed(2)} ${selected.code}` : "Reference rates update when available."}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function getCurrencySnapshotForClient(
  ratesFromInrMicros: Record<SupportedCurrencyCode, number>,
) {
  return ratesFromInrMicros;
}
