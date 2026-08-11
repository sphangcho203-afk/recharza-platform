import type { BillingFormState } from "@/components/billing-address-fields";
import {
  getDefaultCurrencyForCountry,
  type BillingCountryCode,
} from "@/lib/commerce/currencies";

type BillingAddressSource = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
};

export function toBillingFormState(
  address: BillingAddressSource,
  fxMode: "live" | "inr-only",
): BillingFormState {
  return {
    fullName: address.fullName,
    email: address.email,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    countryCode: address.countryCode as BillingCountryCode,
    presentmentCurrency:
      fxMode === "live" ? getDefaultCurrencyForCountry(address.countryCode) : "INR",
  };
}
