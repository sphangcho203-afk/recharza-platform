"use client";

import { useEffect, useMemo, useState } from "react";

import { supportedCurrencies, type SupportedCurrencyCode } from "@/lib/commerce/currencies";
import { convertInrMinorToDisplayMinor, formatDisplayMinor, type DisplayRateMap, ONE_INR_MICROS } from "@/lib/commerce/display-currency";

const STORAGE_KEY = "recharza.display-currency";
const CURRENCY_EVENT = "recharza:currency-change";

const fallbackRates: DisplayRateMap = {
  INR: ONE_INR_MICROS,
  USD: 10480,
  EUR: 9070,
  GBP: 7760,
  PHP: 643190,
  IDR: 186880000,
  BRL: 54350,
  CAD: 14580,
  MXN: 178360,
  AED: 38490,
  SAR: 39300,
  TRY: 501230,
  SGD: 13410,
  MYR: 42820,
  THB: 30480,
};

function readCurrency() {
  if (typeof window === "undefined") return "INR" as SupportedCurrencyCode;
  const stored = window.localStorage.getItem(STORAGE_KEY)?.toUpperCase() as SupportedCurrencyCode | undefined;
  return stored && supportedCurrencies.some((item) => item.code === stored) ? stored : "INR";
}

export function useDisplayCurrency() {
  const [currency, setCurrency] = useState<SupportedCurrencyCode>(readCurrency);
  const [rates, setRates] = useState<DisplayRateMap>(fallbackRates);

  useEffect(() => {
    const onCurrencyChange = (event: Event) => {
      const next = (event as CustomEvent<SupportedCurrencyCode>).detail;
      if (supportedCurrencies.some((item) => item.code === next)) setCurrency(next);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setCurrency(readCurrency());
    };
    window.addEventListener(CURRENCY_EVENT, onCurrencyChange);
    window.addEventListener("storage", onStorage);
    fetch("/api/commerce/display-rates", { cache: "force-cache" })
      .then((response) => (response.ok ? response.json() : null))
      .then((snapshot) => {
        if (snapshot?.ratesFromInrMicros) setRates(snapshot.ratesFromInrMicros as DisplayRateMap);
      })
      .catch(() => undefined);
    return () => {
      window.removeEventListener(CURRENCY_EVENT, onCurrencyChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { currency, rates };
}

export function DisplayPrice({ amountInrMinor, className }: { amountInrMinor: number; className?: string }) {
  const { currency, rates } = useDisplayCurrency();
  const formatted = useMemo(() => formatDisplayMinor(amountInrMinor, currency, rates), [amountInrMinor, currency, rates]);
  return <span className={className}>{formatted}</span>;
}

export function displayMinorAmount(amountInrMinor: number, currency: SupportedCurrencyCode, rates: DisplayRateMap) {
  return convertInrMinorToDisplayMinor(amountInrMinor, currency, rates);
}
