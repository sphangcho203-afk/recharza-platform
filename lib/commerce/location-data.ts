import { Country, State, type ICountry, type IState } from "country-state-city";

export type BillingLocationCountry = Pick<ICountry, "isoCode" | "name" | "currency">;
export type BillingLocationState = Pick<IState, "isoCode" | "name" | "countryCode">;

export const allBillingCountries: BillingLocationCountry[] = Country.getAllCountries()
  .map((country) => ({ isoCode: country.isoCode, name: country.name, currency: country.currency }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getBillingStates(countryCode: string): BillingLocationState[] {
  return State.getStatesOfCountry(countryCode)
    .map((state) => ({ isoCode: state.isoCode, name: state.name, countryCode: state.countryCode }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getBillingCountry(countryCode: string): BillingLocationCountry | null {
  const normalized = countryCode.trim().toUpperCase();
  return allBillingCountries.find((country) => country.isoCode === normalized) ?? null;
}

export function countryFlag(isoCode: string) {
  return isoCode
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397));
}
