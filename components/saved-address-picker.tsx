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
    <section className="rounded-lg border border-white/[0.08] bg-[#0d0f16] p-4 sm:p-5">
      <div>
        <h3 className="text-base font-semibold text-white">Saved billing addresses</h3>
        <p className="mt-1 text-xs text-slate-500">
          Pick a saved address or choose a new one to enter below.
        </p>
      </div>

      <div
        role="group"
        aria-label="Choose a saved billing address"
        className="mt-3 grid gap-2"
      >
        {addresses.map((address) => {
          const selected = address.id === selectedAddressId;
          return (
            <button
              key={address.id}
              type="button"
              onClick={() => onSelect(address)}
              aria-pressed={selected}
              className={`flex min-h-12 items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition ${
                selected
                  ? "border-violet-400/55 bg-violet-500/[0.08]"
                  : "border-white/[0.08] bg-[#0a0c12] hover:border-white/[0.17]"
              }`}
            >
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-white/25">
                {selected ? <span className="h-2 w-2 rounded-full bg-violet-300" /> : null}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm font-semibold text-white">{address.fullName}</strong>
                  {address.isDefault ? (
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      Default
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
                  {address.postalCode}, {countryLabel(address.countryCode)}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
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
          className={`flex min-h-12 items-center gap-3 rounded-lg border border-dashed px-3.5 py-3 text-left text-sm font-semibold transition ${
            selectedAddressId === null
              ? "border-violet-400/55 bg-violet-500/[0.08] text-white"
              : "border-white/[0.12] bg-[#0a0c12] text-slate-300 hover:border-white/[0.22] hover:text-white"
          }`}
        >
          <span className="text-violet-300">+</span> Use a new address
        </button>
      </div>
    </section>
  );
}
