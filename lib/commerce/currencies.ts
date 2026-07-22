export const supportedCurrencies = [
  { code: "INR", label: "Indian Rupee", locale: "en-IN", minorDigits: 2, region: "South Asia" },
  { code: "USD", label: "US Dollar", locale: "en-US", minorDigits: 2, region: "Global / North America" },
  { code: "EUR", label: "Euro", locale: "en-IE", minorDigits: 2, region: "Europe" },
  { code: "GBP", label: "British Pound", locale: "en-GB", minorDigits: 2, region: "United Kingdom" },
  { code: "PHP", label: "Philippine Peso", locale: "en-PH", minorDigits: 2, region: "Philippines" },
  { code: "IDR", label: "Indonesian Rupiah", locale: "id-ID", minorDigits: 0, region: "Indonesia" },
  { code: "BRL", label: "Brazilian Real", locale: "pt-BR", minorDigits: 2, region: "Brazil" },
  { code: "CAD", label: "Canadian Dollar", locale: "en-CA", minorDigits: 2, region: "Canada" },
  { code: "MXN", label: "Mexican Peso", locale: "es-MX", minorDigits: 2, region: "Mexico" },
  { code: "AED", label: "UAE Dirham", locale: "en-AE", minorDigits: 2, region: "United Arab Emirates" },
  { code: "SAR", label: "Saudi Riyal", locale: "en-SA", minorDigits: 2, region: "Saudi Arabia" },
  { code: "TRY", label: "Turkish Lira", locale: "tr-TR", minorDigits: 2, region: "Turkey" },
  { code: "SGD", label: "Singapore Dollar", locale: "en-SG", minorDigits: 2, region: "Singapore" },
  { code: "MYR", label: "Malaysian Ringgit", locale: "ms-MY", minorDigits: 2, region: "Malaysia" },
  { code: "THB", label: "Thai Baht", locale: "th-TH", minorDigits: 2, region: "Thailand" },
] as const;

export type SupportedCurrencyCode = (typeof supportedCurrencies)[number]["code"];

export const supportedCurrencyCodes = supportedCurrencies.map((item) => item.code) as SupportedCurrencyCode[];

export const billingCountries = [
  { code: "IN", label: "India", currency: "INR" },
  { code: "ID", label: "Indonesia", currency: "IDR" },
  { code: "PH", label: "Philippines", currency: "PHP" },
  { code: "BR", label: "Brazil", currency: "BRL" },
  { code: "US", label: "United States", currency: "USD" },
  { code: "CA", label: "Canada", currency: "CAD" },
  { code: "MX", label: "Mexico", currency: "MXN" },
  { code: "GB", label: "United Kingdom", currency: "GBP" },
  { code: "DE", label: "Germany", currency: "EUR" },
  { code: "FR", label: "France", currency: "EUR" },
  { code: "ES", label: "Spain", currency: "EUR" },
  { code: "IT", label: "Italy", currency: "EUR" },
  { code: "AE", label: "United Arab Emirates", currency: "AED" },
  { code: "SA", label: "Saudi Arabia", currency: "SAR" },
  { code: "TR", label: "Turkey", currency: "TRY" },
  { code: "SG", label: "Singapore", currency: "SGD" },
  { code: "MY", label: "Malaysia", currency: "MYR" },
  { code: "TH", label: "Thailand", currency: "THB" },
] as const satisfies ReadonlyArray<{ code: string; label: string; currency: SupportedCurrencyCode }>;

export type BillingCountryCode = (typeof billingCountries)[number]["code"];

export function parseSupportedCurrency(value: unknown): SupportedCurrencyCode | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return supportedCurrencyCodes.find((code) => code === normalized) ?? null;
}

export function parseBillingCountry(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return billingCountries.find((country) => country.code === normalized) ?? null;
}

export function getDefaultCurrencyForCountry(value: unknown): SupportedCurrencyCode {
  return parseBillingCountry(value)?.currency ?? "USD";
}

export function getCurrencyDefinition(code: SupportedCurrencyCode) {
  return supportedCurrencies.find((currency) => currency.code === code)!;
}

export function convertInrPaiseToCurrencyMinor(
  amountInPaise: number,
  currency: SupportedCurrencyCode,
  rateFromInrMicros: number,
) {
  const definition = getCurrencyDefinition(currency);
  const targetScale = 10 ** definition.minorDigits;
  const numerator = amountInPaise * rateFromInrMicros * targetScale;
  const denominator = 100 * 1_000_000;
  return Math.max(1, Math.round(numerator / denominator));
}

export function formatCurrencyMinor(amountMinor: number, code: SupportedCurrencyCode) {
  const definition = getCurrencyDefinition(code);
  return new Intl.NumberFormat(definition.locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: definition.minorDigits,
    maximumFractionDigits: definition.minorDigits,
  }).format(amountMinor / 10 ** definition.minorDigits);
}
