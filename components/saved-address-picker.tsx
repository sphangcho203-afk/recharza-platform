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
    <section className="mt-10 rounded-[2.5rem] border-2 border-white/10 bg-[#161722] p-8 shadow-2xl">
      <div>
        <h3 className="text-xl font-black tracking-tight text-white uppercase italic">Saved Addresses</h3>
        <p className="mt-1 text-sm font-bold text-white/40">
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
              className={`flex min-h-12 items-start gap-3 rounded-[1.5rem] border-2 px-6 py-6 text-left transition-all duration-300 ${
                selected
                  ? "border-violet-500 bg-[#1a1b2e] shadow-lg shadow-violet-500/20"
                  : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-[#1a1b2e]"
              }`}
            >
              <span className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-all ${selected ? 'border-violet-500 bg-violet-500' : 'border-white/20'}`}>
                {selected ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm font-black text-white uppercase tracking-wider">{address.fullName}</strong>
                  {address.isDefault ? (
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
                      Default
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs font-bold leading-relaxed text-white/60">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
                  {address.postalCode}, {countryLabel(address.countryCode)}
                </span>
                <span className="mt-1 block text-[11px] font-bold text-white/40">
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
          className={`flex min-h-12 items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed p-6 text-left text-sm font-black uppercase tracking-widest transition-all duration-300 ${
            selectedAddressId === null
              ? "border-violet-500 bg-[#1a1b2e] text-violet-400 shadow-lg shadow-violet-500/10"
              : "border-white/10 bg-transparent text-white/40 hover:border-white/20 hover:text-white/60"
          }`}
        >
          <span className="text-lg">+</span> Use a new address
        </button>
      </div>
    </section>
  );
}
