"use client";

import { type FormEvent, useState } from "react";

import {
  billingCountries,
  type BillingCountryCode,
} from "@/lib/commerce/currencies";

export type SavedAddressFormValue = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: BillingCountryCode;
};

export const emptySavedAddressForm: SavedAddressFormValue = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "IN",
};

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10";

export function SavedAddressForm({
  title,
  submitLabel,
  initialValue = emptySavedAddressForm,
  showDefaultOption = false,
  initialIsDefault = false,
  saving = false,
  onSave,
  onCancel,
}: {
  title: string;
  submitLabel: string;
  initialValue?: SavedAddressFormValue;
  showDefaultOption?: boolean;
  initialIsDefault?: boolean;
  saving?: boolean;
  onSave: (value: SavedAddressFormValue, makeDefault: boolean) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<SavedAddressFormValue>(initialValue);
  const [makeDefault, setMakeDefault] = useState(
    showDefaultOption && initialIsDefault,
  );

  function update<Key extends keyof SavedAddressFormValue>(
    key: Key,
    nextValue: SavedAddressFormValue[Key],
  ) {
    setValue((current) => ({ ...current, [key]: nextValue }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave(value, makeDefault);
  }

  return (
    <form
      onSubmit={submit}
      aria-label={title}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-100 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
          Full billing name
          <input
            required
            autoComplete="name"
            maxLength={100}
            value={value.fullName}
            onChange={(event) => update("fullName", event.target.value.slice(0, 100))}
            className={inputClassName}
            placeholder="Name on the payment account"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
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
        <label className="text-xs font-semibold text-slate-500">
          Phone number
          <input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={32}
            value={value.phone}
            onChange={(event) => update("phone", event.target.value.slice(0, 32))}
            className={inputClassName}
            placeholder="+91 98765 43210"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Country
          <select
            required
            value={value.countryCode}
            onChange={(event) =>
              update("countryCode", event.target.value as BillingCountryCode)
            }
            className={inputClassName}
          >
            {billingCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Postal code
          <input
            required
            autoComplete="postal-code"
            maxLength={24}
            value={value.postalCode}
            onChange={(event) => update("postalCode", event.target.value.slice(0, 24))}
            className={inputClassName}
            placeholder="600001"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
          Address line 1
          <input
            required
            autoComplete="address-line1"
            maxLength={160}
            value={value.line1}
            onChange={(event) => update("line1", event.target.value.slice(0, 160))}
            className={inputClassName}
            placeholder="House, building and street"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
          Address line 2{" "}
          <span className="font-normal text-slate-400">(optional)</span>
          <input
            autoComplete="address-line2"
            maxLength={160}
            value={value.line2}
            onChange={(event) => update("line2", event.target.value.slice(0, 160))}
            className={inputClassName}
            placeholder="Apartment, landmark or district"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
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
        <label className="text-xs font-semibold text-slate-500">
          State or province
          <input
            required
            autoComplete="address-level1"
            maxLength={100}
            value={value.state}
            onChange={(event) => update("state", event.target.value.slice(0, 100))}
            className={inputClassName}
          />
        </label>
      </div>

      {showDefaultOption ? (
        <label className="mt-4 flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={makeDefault}
            onChange={(event) => setMakeDefault(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-violet-600"
          />
          <span>
            <strong className="font-semibold text-slate-900">
              Make this the default billing address
            </strong>
            <span className="mt-0.5 block text-xs text-slate-500">
              Used to prefill checkout on your next top-up.
            </span>
          </span>
        </label>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-[11px] leading-4 text-slate-500">
          Kept only in your account and used to prefill checkout billing.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}