"use client";

import {
  billingCountries,
  getDefaultCurrencyForCountry,
  supportedCurrencies,
  type BillingCountryCode,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";

export type BillingFormState = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: BillingCountryCode;
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
  "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15";

export function BillingAddressFields({
  value,
  onChange,
  fxMode,
}: {
  value: BillingFormState;
  onChange: (value: BillingFormState) => void;
  fxMode: "live" | "inr-only";
}) {
  function update<Key extends keyof BillingFormState>(key: Key, nextValue: BillingFormState[Key]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.14),transparent_42%),rgba(255,255,255,0.04)] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">03 · Billing</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Billing identity and currency</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Billing country controls the suggested display currency. It does not change the locked game-account market.
            </p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${fxMode === "live" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
            {fxMode === "live" ? "Live FX snapshot" : "INR display only"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <label className="text-sm font-semibold text-slate-200">
          Full billing name
          <input required autoComplete="name" value={value.fullName} onChange={(event) => update("fullName", event.target.value)} className={inputClassName} placeholder="Name on the payment account" />
        </label>
        <label className="text-sm font-semibold text-slate-200">
          Billing email
          <input required type="email" autoComplete="email" value={value.email} onChange={(event) => update("email", event.target.value)} className={inputClassName} placeholder="billing@example.com" />
        </label>
        <label className="text-sm font-semibold text-slate-200">
          Phone number
          <input required type="tel" autoComplete="tel" value={value.phone} onChange={(event) => update("phone", event.target.value)} className={inputClassName} placeholder="+91 98765 43210" />
        </label>
        <label className="text-sm font-semibold text-slate-200">
          Country
          <select
            required
            value={value.countryCode}
            onChange={(event) => {
              const countryCode = event.target.value as BillingCountryCode;
              onChange({
                ...value,
                countryCode,
                presentmentCurrency: getDefaultCurrencyForCountry(countryCode),
              });
            }}
            className={inputClassName}
          >
            {billingCountries.map((country) => (
              <option key={country.code} value={country.code}>{country.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-200 sm:col-span-2">
          Address line 1
          <input required autoComplete="address-line1" value={value.line1} onChange={(event) => update("line1", event.target.value)} className={inputClassName} placeholder="House, building and street" />
        </label>
        <label className="text-sm font-semibold text-slate-200 sm:col-span-2">
          Address line 2 <span className="font-normal text-slate-600">(optional)</span>
          <input autoComplete="address-line2" value={value.line2} onChange={(event) => update("line2", event.target.value)} className={inputClassName} placeholder="Apartment, landmark or district" />
        </label>
        <label className="text-sm font-semibold text-slate-200">
          City
          <input required autoComplete="address-level2" value={value.city} onChange={(event) => update("city", event.target.value)} className={inputClassName} />
        </label>
        <label className="text-sm font-semibold text-slate-200">
          State or province
          <input required autoComplete="address-level1" value={value.state} onChange={(event) => update("state", event.target.value)} className={inputClassName} />
        </label>
        <label className="text-sm font-semibold text-slate-200">
          Postal code
          <input required autoComplete="postal-code" value={value.postalCode} onChange={(event) => update("postalCode", event.target.value)} className={inputClassName} />
        </label>
        <label className="text-sm font-semibold text-slate-200">
          Display currency
          <select
            required
            value={value.presentmentCurrency}
            disabled={fxMode !== "live"}
            onChange={(event) => update("presentmentCurrency", event.target.value as SupportedCurrencyCode)}
            className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-55`}
          >
            {supportedCurrencies.map((currency) => (
              <option key={currency.code} value={currency.code}>{currency.code} · {currency.label}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
