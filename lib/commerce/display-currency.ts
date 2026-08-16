import type { SupportedCurrencyCode } from "@/lib/commerce/currencies";

export type DisplayRateMap = Record<SupportedCurrencyCode, number>;

export const ONE_INR_MICROS = 1_000_000;

export function convertInrMinorToDisplayMinor(
  amountInrMinor: number,
  currency: SupportedCurrencyCode,
  ratesFromInrMicros: DisplayRateMap,
) {
  if (!Number.isFinite(amountInrMinor) || amountInrMinor < 0) return 0;
  const rateMicros = ratesFromInrMicros[currency] || (currency === "INR" ? ONE_INR_MICROS : 0);
  if (!rateMicros) return Math.round(amountInrMinor);
  return Math.max(0, Math.round((amountInrMinor * rateMicros) / ONE_INR_MICROS));
}

export function formatDisplayMinor(
  amountInrMinor: number,
  currency: SupportedCurrencyCode,
  ratesFromInrMicros: DisplayRateMap,
) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(convertInrMinorToDisplayMinor(amountInrMinor, currency, ratesFromInrMicros) / 100);
}
