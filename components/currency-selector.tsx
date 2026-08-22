"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { StorefrontIcon } from "@/components/storefront-icon";
import { supportedCurrencies, type SupportedCurrencyCode } from "@/lib/commerce/currencies";

const pickerCurrencies = supportedCurrencies.filter((item) => !["CAD", "MXN"].includes(item.code));

type CurrencySelectorProps = {
  compact?: boolean;
};

const STORAGE_KEY = "recharza.display-currency";
const CURRENCY_EVENT = "recharza:currency-change";

function currencySymbol(code: SupportedCurrencyCode, _locale: string) {
  const marks: Partial<Record<SupportedCurrencyCode, string>> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    PHP: "₱",
    IDR: "Rp",
    BRL: "R$",
    CAD: "C$",
    MXN: "MX$",
    AED: "د.إ",
    SAR: "ر.س",
    TRY: "₺",
    SGD: "S$",
    MYR: "RM",
    THB: "฿",
  };
  return marks[code] ?? code;
}

function readStoredCurrency(): SupportedCurrencyCode {
  if (typeof window === "undefined") return "INR";
  const stored = window.localStorage.getItem(STORAGE_KEY)?.toUpperCase();
  return pickerCurrencies.some((item) => item.code === stored)
    ? (stored as SupportedCurrencyCode)
    : "INR";
}

export function CurrencySelector({ compact = false }: CurrencySelectorProps) {
  const [currency, setCurrency] = useState<SupportedCurrencyCode>(readStoredCurrency);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "currency-picker-title";
  const selected = supportedCurrencies.find((item) => item.code === currency) ?? supportedCurrencies[0];
  const filteredCurrencies = useMemo(() => pickerCurrencies, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
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
    setOpen(false);
  }

  const picker = open ? (
    <div className="recharza-scrim fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="recharza-sheet w-full max-h-[min(88vh,46rem)] overflow-hidden shadow-2xl bg-white border border-slate-200 sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 bg-slate-50">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Display currency</p>
            <h2 id={titleId} className="mt-0.5 text-lg font-bold text-slate-900">Choose currency</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close currency picker" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"><StorefrontIcon name="close" className="h-5 w-5" /></button>
        </div>
        <ul className="max-h-[min(62vh,28rem)] overflow-y-auto p-2" aria-label="Currencies">
          {filteredCurrencies.map((item) => {
            const active = item.code === currency;
            return (
              <li key={item.code}>
                <button
                  type="button"
                  onClick={() => choose(item.code)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 ${
                    active ? "bg-violet-50 text-violet-700" : "text-slate-600"
                  }`}
                  aria-pressed={active}
                >
                  <span aria-hidden="true" className="grid h-9 min-w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white px-1 text-center text-slate-900">
                    <span className="text-sm font-bold leading-none">{currencySymbol(item.code, item.locale)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{item.region}</span>
                    <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{item.code}</span>
                  </span>
                  {active ? <StorefrontIcon name="shield" className="h-4 w-4 shrink-0 text-violet-600" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className={`group relative inline-flex items-center gap-1 rounded-xl border border-slate-400 bg-white px-1.5 py-1 text-left transition-all duration-200 hover:border-violet-500 hover:bg-violet-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 ${compact ? "h-7" : "h-9"}`} aria-haspopup="dialog" aria-expanded={open} aria-label={`Display currency: ${selected.code} ${selected.region}`}>
        <span aria-hidden="true" className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md border border-slate-400 bg-slate-200 text-[10px] font-black text-slate-900 shadow-sm">{currencySymbol(selected.code, selected.locale)}</span>
        {!compact && <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 group-hover:text-violet-600">{selected.code}</span>}
        <StorefrontIcon name="arrow" className="h-2 w-2 rotate-90 text-slate-600 transition-transform group-hover:translate-y-0.5 group-hover:text-violet-600" />
      </button>
      {typeof document !== "undefined" && picker ? createPortal(picker, document.body) : null}
    </>
  );
}
