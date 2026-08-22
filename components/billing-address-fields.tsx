"use client";

import { CountryPicker } from "@/components/country-picker";
import { getBillingStates } from "@/lib/commerce/location-data";
import type { SupportedCurrencyCode } from "@/lib/commerce/currencies";

export type BillingFormState = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  presentmentCurrency: SupportedCurrencyCode;
};

export const initialBillingForm: BillingFormState = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "IN",
  presentmentCurrency: "INR",
};

const inputClassName =
  "mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10";

export function BillingAddressFields({
  value,
  onChange,
  fixedCurrency = "INR",
  stepNumber = "03",
  stepLabel = "Payment details",
}: {
  value: BillingFormState;
  onChange: (value: BillingFormState) => void;
  fixedCurrency?: SupportedCurrencyCode;
  stepNumber?: string;
  stepLabel?: string;
}) {
  const states = getBillingStates(value.countryCode);

  function update<Key extends keyof BillingFormState>(
    key: Key,
    nextValue: BillingFormState[Key],
  ) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid border-b border-slate-100 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="border-b border-slate-100 bg-slate-50 p-5 lg:border-b-0 lg:border-r lg:border-slate-100 lg:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-violet-200 bg-violet-50 text-sm font-bold text-violet-600">
              {stepNumber}
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
              {stepLabel}
            </p>
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Billing and payment identity
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Used for payment processing, receipts, and support verification. The selected game market controls the storefront currency.
          </p>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-3 text-xs leading-5 text-slate-600">
            Billing details never change the selected game-account market.
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5 lg:p-6">
          <div>
            <p className="text-sm font-bold text-slate-900">Complete billing details</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Keep the information consistent with the payment account.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${
              "border-emerald-200 bg-emerald-50 text-emerald-600"
            }`}
          >
            {fixedCurrency} market pricing
          </span>
        </div>
      </div>

      <div className="grid gap-7 p-5 sm:p-6 lg:grid-cols-2 lg:p-7">
        <fieldset className="grid content-start gap-4">
          <legend className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
            Contact and receipt
          </legend>
          <label className="text-sm font-bold text-slate-900">
            Full billing name
            <input
              required
              autoComplete="name"
              maxLength={120}
              value={value.fullName}
              onChange={(event) => update("fullName", event.target.value.slice(0, 120))}
              className={inputClassName}
              placeholder="Name on the payment account"
            />
          </label>
          <label className="text-sm font-bold text-slate-900">
            Receipt email
            <input
              required
              type="email"
              autoComplete="email"
              maxLength={254}
              value={value.email}
              onChange={(event) => update("email", event.target.value.slice(0, 254))}
              className={inputClassName}
              placeholder="billing@example.com"
            />
          </label>
          <label className="text-sm font-bold text-slate-900">
            Phone number
            <input
              required
              type="tel"
              autoComplete="tel"
              maxLength={24}
              value={value.phone}
              onChange={(event) => update("phone", event.target.value.slice(0, 24))}
              className={inputClassName}
              placeholder="+91 98765 43210"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-900">
              Country
              <CountryPicker
                value={value.countryCode}
                                  onChange={(countryCode) =>
                  onChange({
                    ...value,
                    countryCode,
                    state: getBillingStates(countryCode)[0]?.name ?? "N/A",
                    presentmentCurrency: fixedCurrency,
                  })
                }

              />
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Market currency</span>
              <span className="mt-1 block text-base font-bold text-slate-900">{fixedCurrency}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">Prices are fixed by the selected game market. Billing country does not change them.</span>
            </div>
          </div>
        </fieldset>

        <fieldset className="grid content-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
          <legend className="px-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
            Billing address
          </legend>
          <label className="text-sm font-bold text-slate-900">
            Address line 1
            <input
              required
              autoComplete="address-line1"
              maxLength={180}
              value={value.line1}
              onChange={(event) => update("line1", event.target.value.slice(0, 180))}
              className={inputClassName}
              placeholder="House, building and street"
            />
          </label>
          <label className="text-sm font-bold text-slate-900">
            Address line 2 <span className="font-normal text-slate-500">(optional)</span>
            <input
              autoComplete="address-line2"
              maxLength={180}
              value={value.line2}
              onChange={(event) => update("line2", event.target.value.slice(0, 180))}
              className={inputClassName}
              placeholder="Apartment, landmark or district"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-900">
              City
              <input
                required
                autoComplete="address-level2"
                maxLength={100}
                value={value.city}
                onChange={(event) => update("city", event.target.value.slice(0, 100))}
                className={inputClassName}
              />
            </label>
            <label className="text-sm font-bold text-slate-900">
              State or province
              <select
                required
                autoComplete="address-level1"
                value={value.state}
                onChange={(event) => update("state", event.target.value)}
                className={inputClassName}
              >
                {states.length ? <option value="">Choose a state or province</option> : <option value="N/A">Not applicable</option>}
                {states.map((state) => (
                  <option key={`${state.countryCode}-${state.isoCode}`} value={state.name}>{state.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-sm font-bold text-slate-900">
            Postal code
            <input
              required
              autoComplete="postal-code"
              maxLength={20}
              value={value.postalCode}
              onChange={(event) => update("postalCode", event.target.value.slice(0, 20))}
              className={inputClassName}
            />
          </label>
        </fieldset>
      </div>
    </section>
  );
}
