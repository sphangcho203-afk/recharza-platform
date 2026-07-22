import {
  getDefaultCurrencyForCountry,
  parseBillingCountry,
  parseSupportedCurrency,
  type BillingCountryCode,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";

export type BillingAddress = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: BillingCountryCode;
};

export type BillingSelection = {
  address: BillingAddress;
  presentmentCurrency: SupportedCurrencyCode;
};

function clean(value: unknown, maximum: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maximum);
}

export function validateBillingSelection(value: unknown):
  | { ok: true; selection: BillingSelection }
  | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Billing details are required." };
  }

  const data = value as Record<string, unknown>;
  const country = parseBillingCountry(data.countryCode);
  if (!country) {
    return { ok: false, message: "Choose a supported billing country." };
  }

  const fullName = clean(data.fullName, 100);
  const email = clean(data.email, 254).toLowerCase();
  const phone = clean(data.phone, 32);
  const line1 = clean(data.line1, 160);
  const line2 = clean(data.line2, 160);
  const city = clean(data.city, 100);
  const state = clean(data.state, 100);
  const postalCode = clean(data.postalCode, 24);

  if (fullName.length < 2) return { ok: false, message: "Enter the billing name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid billing email address." };
  }
  if (!/^[+()\-\s\d]{7,32}$/.test(phone)) {
    return { ok: false, message: "Enter a valid billing phone number." };
  }
  if (line1.length < 4) return { ok: false, message: "Enter the billing address." };
  if (city.length < 2) return { ok: false, message: "Enter the billing city." };
  if (state.length < 2) return { ok: false, message: "Enter the billing state or province." };
  if (postalCode.length < 3) return { ok: false, message: "Enter the billing postal code." };

  const requestedCurrency = parseSupportedCurrency(data.presentmentCurrency);
  const presentmentCurrency = requestedCurrency ?? getDefaultCurrencyForCountry(country.code);

  return {
    ok: true,
    selection: {
      presentmentCurrency,
      address: {
        fullName,
        email,
        phone,
        line1,
        line2: line2 || null,
        city,
        state,
        postalCode,
        countryCode: country.code,
      },
    },
  };
}
