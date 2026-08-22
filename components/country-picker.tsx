"use client";

import { StorefrontIcon } from "@/components/storefront-icon";
import { allBillingCountries, countryFlag } from "@/lib/commerce/location-data";

type CountryPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CountryPicker({ value, onChange }: CountryPickerProps) {
  const selected = allBillingCountries.find((country) => country.isoCode === value) ?? allBillingCountries[0];

  return (
    <div className="relative mt-2">
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="recharza-checkout-input min-h-12 w-full appearance-none px-4 py-3 pr-11 text-base font-bold outline-none transition"
        aria-label="Billing country"
      >
        {allBillingCountries.map((country) => (
          <option key={country.isoCode} value={country.isoCode} className="bg-[#1a1b2e] text-white">
            {countryFlag(country.isoCode)} {country.name}
          </option>
        ))}
      </select>
      <StorefrontIcon name="arrow" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-white/40" aria-hidden="true" />
      <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-white/20">
        {selected?.isoCode}
      </span>
    </div>
  );
}

export default CountryPicker;
