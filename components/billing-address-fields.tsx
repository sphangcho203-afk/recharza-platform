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
  "mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-bold text-white outline-none transition placeholder:text-white/20 focus:border-violet-500 focus:bg-white/10 focus:ring-4 focus:ring-violet-500/20";

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
    <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#161722] shadow-2xl">
      <div className="grid border-b border-white/5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="border-b border-white/5 bg-white/5 p-6 lg:border-b-0 lg:border-r lg:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/20 text-sm font-black text-violet-400">
              {stepNumber}
            </span>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-400">
              {stepLabel}
            </p>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight text-white italic">
            Billing & Identity
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/40 font-bold">
            Used for payment processing, receipts, and support verification. The selected market controls the currency.
          </p>
          <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 px-4 py-4 text-xs leading-relaxed text-white/30 font-bold">
            Billing details never change the selected game-account market.
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-6 lg:p-8">
          <div>
            <p className="text-base font-black text-white italic">Complete Billing Details</p>
            <p className="mt-1 text-xs leading-relaxed text-white/40 font-bold">
              Keep the information consistent with the payment account.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-400 shadow-lg shadow-emerald-500/10`}
          >
            {fixedCurrency} market
          </span>
        </div>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:p-10">
        <fieldset className="grid content-start gap-6">
          <legend className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-violet-400 italic">
            Contact and receipt
          </legend>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Full billing name</span>
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
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Receipt email</span>
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
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Phone number</span>
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
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Country</span>
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
            <div className="rounded-2xl border border-white/5 bg-white/5 px-5 py-4">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Market currency</span>
              <span className="mt-1 block text-lg font-black text-white italic">{fixedCurrency}</span>
            </div>
          </div>
        </fieldset>

        <fieldset className="grid content-start gap-6 rounded-[2rem] border border-white/5 bg-white/5 p-6 sm:p-8">
          <legend className="px-4 text-[11px] font-black uppercase tracking-[0.3em] text-violet-400 italic">
            Billing address
          </legend>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Address line 1</span>
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
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Address line 2 <span className="font-bold text-white/10">(optional)</span></span>
            <input
              autoComplete="address-line2"
              maxLength={180}
              value={value.line2}
              onChange={(event) => update("line2", event.target.value.slice(0, 180))}
              className={inputClassName}
              placeholder="Apartment, landmark or district"
            />
          </label>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">City</span>
              <input
                required
                autoComplete="address-level2"
                maxLength={100}
                value={value.city}
                onChange={(event) => update("city", event.target.value.slice(0, 100))}
                className={inputClassName}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">State or province</span>
              <select
                required
                autoComplete="address-level1"
                value={value.state}
                onChange={(event) => update("state", event.target.value)}
                className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-[#1a1b2e] px-5 text-base font-bold text-white outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              >
                {states.length ? <option value="" className="bg-[#1a1b2e]">Choose state</option> : <option value="N/A" className="bg-[#1a1b2e]">N/A</option>}
                {states.map((state) => (
                  <option key={`${state.countryCode}-${state.isoCode}`} value={state.name} className="bg-[#1a1b2e]">{state.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Postal code</span>
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
