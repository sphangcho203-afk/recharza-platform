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
  "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#08080f] px-4 py-3 text-base font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15";

export function BillingAddressFields({
  value,
  onChange,
  fxMode,
  stepNumber = "03",
  stepLabel = "Payment details",
  saveAddress = false,
  onSaveAddressChange,
  isAuthenticated = false,
}: {
  value: BillingFormState;
  onChange: (value: BillingFormState) => void;
  fxMode: "live" | "inr-only";
  stepNumber?: string;
  stepLabel?: string;
  saveAddress?: boolean;
  onSaveAddressChange?: (value: boolean) => void;
  isAuthenticated?: boolean;
}) {
  function update<Key extends keyof BillingFormState>(key: Key, nextValue: BillingFormState[Key]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="grid border-b border-white/[0.08] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="border-b border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.2),transparent_62%)] p-5 lg:border-b-0 lg:border-r lg:border-white/[0.08] lg:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-sm font-black text-violet-200">{stepNumber}</span>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-300">{stepLabel}</p>
          </div>
          <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-white">Billing and payment identity</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">Used for payment processing, receipts, regional currency display, and support verification.</p>
          <div className="mt-5 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 text-xs leading-5 text-slate-500">Billing details never change the selected game-account market.</div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5 lg:p-6">
          <div>
            <p className="text-sm font-black text-white">Complete billing details</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Keep the information consistent with the payment account.</p>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black ${fxMode === "live" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
            {fxMode === "live" ? "Live FX" : "INR only"}
          </span>
        </div>
      </div>

      <div className="grid gap-7 p-5 sm:p-6 lg:grid-cols-2 lg:p-7">
        <fieldset className="grid content-start gap-4">
          <legend className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Contact and receipt</legend>
          <label className="text-sm font-semibold text-slate-200">Full billing name<input required autoComplete="name" maxLength={120} value={value.fullName} onChange={(event) => update("fullName", event.target.value.slice(0, 120))} className={inputClassName} placeholder="Name on the payment account" /></label>
          <label className="text-sm font-semibold text-slate-200">Receipt email<input required type="email" autoComplete="email" maxLength={254} value={value.email} onChange={(event) => update("email", event.target.value.slice(0, 254))} className={inputClassName} placeholder="billing@example.com" /></label>
          <label className="text-sm font-semibold text-slate-200">Phone number<input required type="tel" autoComplete="tel" maxLength={24} value={value.phone} onChange={(event) => update("phone", event.target.value.slice(0, 24))} className={inputClassName} placeholder="+91 98765 43210" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-200">Country<select required value={value.countryCode} onChange={(event) => { const countryCode = event.target.value as BillingCountryCode; onChange({ ...value, countryCode, presentmentCurrency: getDefaultCurrencyForCountry(countryCode) }); }} className={inputClassName}>{billingCountries.map((country) => <option key={country.code} value={country.code}>{country.label}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-200">Display currency<select required value={value.presentmentCurrency} disabled={fxMode !== "live"} onChange={(event) => update("presentmentCurrency", event.target.value as SupportedCurrencyCode)} className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-55`}>{supportedCurrencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} · {currency.label}</option>)}</select></label>
          </div>
        </fieldset>

        <fieldset className="grid content-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
          <legend className="px-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Billing address</legend>
          <label className="text-sm font-semibold text-slate-200">Address line 1<input required autoComplete="address-line1" maxLength={180} value={value.line1} onChange={(event) => update("line1", event.target.value.slice(0, 180))} className={inputClassName} placeholder="House, building and street" /></label>
          <label className="text-sm font-semibold text-slate-200">Address line 2 <span className="font-normal text-slate-600">(optional)</span><input autoComplete="address-line2" maxLength={180} value={value.line2} onChange={(event) => update("line2", event.target.value.slice(0, 180))} className={inputClassName} placeholder="Apartment, landmark or district" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-200">City<input required autoComplete="address-level2" maxLength={100} value={value.city} onChange={(event) => update("city", event.target.value.slice(0, 100))} className={inputClassName} /></label>
            <label className="text-sm font-semibold text-slate-200">State or province<input required autoComplete="address-level1" maxLength={100} value={value.state} onChange={(event) => update("state", event.target.value.slice(0, 100))} className={inputClassName} /></label>
          </div>
          <label className="text-sm font-semibold text-slate-200">Postal code<input required autoComplete="postal-code" maxLength={20} value={value.postalCode} onChange={(event) => update("postalCode", event.target.value.slice(0, 20))} className={inputClassName} /></label>

          {isAuthenticated && onSaveAddressChange ? (
            <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-sm text-slate-300 transition hover:border-violet-300/20 hover:bg-violet-300/[0.03]">
              <input type="checkbox" checked={saveAddress} onChange={(event) => onSaveAddressChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-500" />
              <span><span className="font-bold text-white">Save this address for future purchases</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">We’ll keep it in your account so checkout is faster next time.</span></span>
            </label>
          ) : null}
        </fieldset>
      </div>
    </section>
  );
}
