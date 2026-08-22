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
        className="min-h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-11 text-base font-normal text-slate-900 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 shadow-sm"
        aria-label="Billing country"
      >
        {allBillingCountries.map((country) => (
          <option key={country.isoCode} value={country.isoCode} className="bg-white text-slate-900">
            {countryFlag(country.isoCode)} {country.name}
          </option>
        ))}
      </select>
      <StorefrontIcon name="arrow" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" aria-hidden="true" />
      <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {selected?.isoCode}
      </span>
    </div>
  );
}

export default CountryPicker;
