"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";
import { billingCountries, type BillingCountryCode } from "@/lib/commerce/currencies";

type CountryPickerProps = {
  value: BillingCountryCode;
  onChange: (value: BillingCountryCode) => void;
};

const countryFlag: Record<string, string> = {
  IN: "🇮🇳", ID: "🇮🇩", PH: "🇵🇭", BR: "🇧🇷", US: "🇺🇸", CA: "🇨🇦", MX: "🇲🇽",
  GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", ES: "🇪🇸", IT: "🇮🇹", AE: "🇦🇪", SA: "🇸🇦",
  TR: "🇹🇷", SG: "🇸🇬", MY: "🇲🇾", TH: "🇹🇭",
};

export function CountryPicker({ value, onChange }: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const selected = billingCountries.find((country) => country.code === value) ?? billingCountries[0];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return billingCountries;
    return billingCountries.filter((country) => `${country.label} ${country.code} ${country.currency}`.toLowerCase().includes(normalized));
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

  function choose(countryCode: BillingCountryCode) {
    onChange(countryCode);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="input-base mt-2 flex min-h-12 w-full items-center justify-between gap-3 text-left text-text-primary"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="text-lg">{countryFlag[selected.code] ?? "🌐"}</span>
          <span className="truncate">{selected.label}</span>
        </span>
        <StorefrontIcon name="arrow" className="h-4 w-4 shrink-0 rotate-90 text-text-muted" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="country-picker-title" className="fable-surface-floating w-full max-h-[min(78vh,38rem)] overflow-hidden rounded-t-lg border border-border sm:max-w-lg sm:rounded-lg">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Billing country</p>
                <h2 id="country-picker-title" className="mt-1 font-heading text-xl font-semibold text-text-primary">Choose your country</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close country picker" className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors duration-150 hover:bg-surface-sunken hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="border-b border-border p-4">
              <label htmlFor="country-search" className="sr-only">Search countries</label>
              <div className="relative">
                <StorefrontIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input id="country-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search country or currency" className="input-base w-full pl-10" />
              </div>
            </div>
            <ul className="max-h-[min(50vh,24rem)] overflow-y-auto p-2" aria-label="Countries">
              {filtered.map((country) => {
                const active = country.code === value;
                return (
                  <li key={country.code}>
                    <button type="button" onClick={() => choose(country.code as BillingCountryCode)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-150 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${active ? "bg-primary/10 text-primary" : "text-text-primary"}`} aria-pressed={active}>
                      <span aria-hidden="true" className="text-xl">{countryFlag[country.code] ?? "🌐"}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{country.label}</span><span className="mt-0.5 block text-xs text-text-muted">{country.code} · {country.currency}</span></span>
                      {active ? <StorefrontIcon name="shield" className="h-4 w-4 shrink-0 text-primary" /> : null}
                    </button>
                  </li>
                );
              })}
              {!filtered.length ? <li className="px-3 py-8 text-center text-sm text-text-secondary">No countries match “{query}”.</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default CountryPicker;

