"use client";

import { billingCountries } from "@/lib/commerce/currencies";
import type { SavedAddressView } from "@/lib/commerce/saved-addresses";

function countryLabel(code: string) {
  return billingCountries.find((country) => country.code === code)?.label ?? code;
}

export function SavedAddressPicker({
  addresses,
  selectedAddressId,
  onSelect,
}: {
  addresses: SavedAddressView[];
  selectedAddressId: string | null;
  onSelect: (address: SavedAddressView | null) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">Saved billing addresses</h3>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Pick a saved address or choose a new one to enter below.
        </p>
      </div>

      <div
        role="group"
        aria-label="Choose a saved billing address"
        className="mt-4 grid gap-3"
      >
        {addresses.map((address) => {
          const selected = address.id === selectedAddressId;
          return (
            <button
              key={address.id}
              type="button"
              onClick={() => onSelect(address)}
              aria-pressed={selected}
              className={`flex min-h-12 items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all ${
                selected
                  ? "border-violet-600 bg-violet-50 shadow-sm"
                  : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-violet-600' : 'border-slate-300'}`}>
                {selected ? <span className="h-2.5 w-2.5 rounded-full bg-violet-600" /> : null}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm font-bold text-slate-900">{address.fullName}</strong>
                  {address.isDefault ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Default
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-600">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
                  {address.postalCode}, {countryLabel(address.countryCode)}
                </span>
                <span className="mt-1 block text-[11px] font-bold text-slate-400">
                  {address.email} · {address.phone}
                </span>
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={selectedAddressId === null}
          className={`flex min-h-12 items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-left text-sm font-bold transition-all ${
            selectedAddressId === null
              ? "border-violet-600 bg-violet-50 text-violet-700 shadow-sm"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          <span className="text-lg">+</span> Use a new address
        </button>
      </div>
    </section>
  );
}
