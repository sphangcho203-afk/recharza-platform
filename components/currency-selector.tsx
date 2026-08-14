"use client";

import { useMemo, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";
import { supportedCurrencies, type SupportedCurrencyCode } from "@/lib/commerce/currencies";

type CurrencySelectorProps = {
  ratesFromInrMicros: Partial<Record<SupportedCurrencyCode, number>>;
  compact?: boolean;
};

const STORAGE_KEY = "recharza.display-currency";
const CURRENCY_EVENT = "recharza:currency-change";

function readStoredCurrency(): SupportedCurrencyCode {
  if (typeof window === "undefined") return "INR";
  const stored = window.localStorage.getItem(STORAGE_KEY)?.toUpperCase();
  return supportedCurrencies.some((item) => item.code === stored)
    ? (stored as SupportedCurrencyCode)
    : "INR";
}

export function CurrencySelector({ ratesFromInrMicros, compact = false }: CurrencySelectorProps) {
  const [currency, setCurrency] = useState<SupportedCurrencyCode>(readStoredCurrency);
  const selected = supportedCurrencies.find((item) => item.code === currency) ?? supportedCurrencies[0];
  const usdToSelected = useMemo(() => {
    if (currency === "USD") return 1;
    const usdRate = ratesFromInrMicros.USD;
    const targetRate = ratesFromInrMicros[currency];
    if (!usdRate || !targetRate) return null;
    return targetRate / usdRate;
  }, [currency, ratesFromInrMicros]);

  function handleChange(next: string) {
    if (!supportedCurrencies.some((item) => item.code === next)) return;
    const parsed = next as SupportedCurrencyCode;
    setCurrency(parsed);
    window.localStorage.setItem(STORAGE_KEY, parsed);
    window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: parsed }));
  }

  return (
    <label className={`group inline-flex min-h-10 min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 transition-colors duration-150 ease-out hover:border-primary/60 sm:gap-3 sm:px-3 ${compact ? "max-w-[5.75rem]" : "min-w-[13rem]"}`}>
      <StorefrontIcon name="globe" className="h-4 w-4 shrink-0 text-primary" />
      <span className="grid min-w-0 gap-0.5">
        <span className={`${compact ? "sr-only" : "text-xs font-semibold uppercase tracking-wide text-text-muted"}`}>Currency</span>
        <select
          value={currency}
          onChange={(event) => handleChange(event.target.value)}
          className={`input-base min-w-0 appearance-none bg-transparent pr-0 text-sm font-semibold text-text-primary outline-none ${compact ? "w-[3.8rem] truncate" : "w-auto"}`}
          aria-label="Display currency"
        >
          {supportedCurrencies.map((item) => (
            <option key={item.code} value={item.code} className="bg-[#11131d] text-white">
              {item.code} · {item.region}
            </option>
          ))}
        </select>
      </span>
      <span className="ml-auto hidden whitespace-nowrap text-xs text-text-muted xl:block">
        {usdToSelected ? `1 USD ≈ ${usdToSelected.toFixed(2)} ${selected.code}` : "Live FX"}
      </span>
    </label>
  );
}

export function getCurrencySnapshotForClient(
  ratesFromInrMicros: Record<SupportedCurrencyCode, number>,
) {
  return ratesFromInrMicros;
}
