"use client";

import { useMemo, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";
import {
  supportedCurrencies,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";

type CurrencySelectorProps = {
  ratesFromInrMicros: Partial<Record<SupportedCurrencyCode, number>>;
};

const STORAGE_KEY = "recharza.display-currency";

export function CurrencySelector({ ratesFromInrMicros }: CurrencySelectorProps) {
  const [currency, setCurrency] = useState<SupportedCurrencyCode>(() => {
    if (typeof window === "undefined") return "INR";
    const stored = window.localStorage.getItem(STORAGE_KEY)?.toUpperCase();
    return supportedCurrencies.some((item) => item.code === stored)
      ? (stored as SupportedCurrencyCode)
      : "INR";
  });

  const selected = supportedCurrencies.find((item) => item.code === currency) ?? supportedCurrencies[0];
  const usdToSelected = useMemo(() => {
    if (currency === "USD") return 1;
    const usdRate = ratesFromInrMicros.USD;
    const targetRate = ratesFromInrMicros[currency];
    if (!usdRate || !targetRate) return null;
    return targetRate / usdRate;
  }, [currency, ratesFromInrMicros]);

  function handleChange(next: string) {
    const parsed = next as SupportedCurrencyCode;
    setCurrency(parsed);
    window.localStorage.setItem(STORAGE_KEY, parsed);
    window.dispatchEvent(new CustomEvent("recharza:currency-change", { detail: parsed }));
  }

  return (
    <label className="group relative hidden min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-2.5 md:flex">
      <StorefrontIcon name="globe" className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
      <span className="sr-only">Display currency</span>
      <select
        value={currency}
        onChange={(event) => handleChange(event.target.value)}
        className="max-w-[7.25rem] appearance-none bg-transparent pr-1 text-[11px] font-black text-slate-200 outline-none"
        aria-label="Display currency"
      >
        {supportedCurrencies.map((item) => (
          <option key={item.code} value={item.code} className="bg-[#11131d] text-white">
            {item.code} · {item.region}
          </option>
        ))}
      </select>
      <span className="hidden border-l border-white/[0.1] pl-2 text-[10px] font-bold text-slate-500 2xl:inline">
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
