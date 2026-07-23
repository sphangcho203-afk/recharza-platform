import "server-only";

import {
  supportedCurrencyCodes,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";

const DEFAULT_FX_URL = "https://api.frankfurter.dev/v2/rates";
const ONE_INR_MICROS = 1_000_000;

export type CurrencyRateSnapshot = {
  base: "INR";
  mode: "live" | "inr-only";
  source: string;
  quotedAt: string;
  ratesFromInrMicros: Record<SupportedCurrencyCode, number>;
};

type FxRow = {
  date?: unknown;
  base?: unknown;
  quote?: unknown;
  rate?: unknown;
};

function asRateMicros(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const micros = Math.round(numeric * ONE_INR_MICROS);
  return Number.isSafeInteger(micros) && micros > 0 ? micros : null;
}

export async function getCurrencyRateSnapshot(): Promise<CurrencyRateSnapshot> {
  const rates = Object.fromEntries(
    supportedCurrencyCodes.map((code) => [code, code === "INR" ? ONE_INR_MICROS : 0]),
  ) as Record<SupportedCurrencyCode, number>;

  const quotes = supportedCurrencyCodes.filter((code) => code !== "INR").join(",");
  const url = new URL(process.env.FX_RATE_SOURCE_URL?.trim() || DEFAULT_FX_URL);
  url.searchParams.set("base", "INR");
  url.searchParams.set("quotes", quotes);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: 60 * 60 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) throw new Error(`FX provider returned ${response.status}.`);
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) throw new Error("FX provider returned an invalid payload.");

    let latestDate = "";
    for (const item of payload as FxRow[]) {
      if (typeof item.quote !== "string") continue;
      const quote = item.quote.toUpperCase() as SupportedCurrencyCode;
      if (!supportedCurrencyCodes.includes(quote)) continue;
      const micros = asRateMicros(item.rate);
      if (!micros) continue;
      rates[quote] = micros;
      if (typeof item.date === "string" && item.date > latestDate) latestDate = item.date;
    }

    const available = supportedCurrencyCodes.filter((code) => rates[code] > 0);
    if (available.length < 2) throw new Error("FX provider returned no usable quote currencies.");

    return {
      base: "INR",
      mode: "live",
      source: url.origin,
      quotedAt: latestDate ? `${latestDate}T00:00:00.000Z` : new Date().toISOString(),
      ratesFromInrMicros: rates,
    };
  } catch (error) {
    console.error("Live FX rates unavailable", error);
    return {
      base: "INR",
      mode: "inr-only",
      source: "fallback",
      quotedAt: new Date().toISOString(),
      ratesFromInrMicros: rates,
    };
  }
}
