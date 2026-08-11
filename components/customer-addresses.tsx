"use client";

import { FormEvent, useEffect, useState } from "react";

type Address = {
  id: string;
  label: string | null;
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
};

type FormState = Omit<Address, "id" | "isDefault"> & { isDefault: boolean };

const emptyForm: FormState = {
  label: "",
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  phone: "",
  isDefault: false,
};

const input = "mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#080a10] px-3.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10";

export function CustomerAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/account/addresses", { cache: "no-store" });
      const result = (await response.json()) as { addresses?: Address[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load addresses");
      setAddresses(result.addresses ?? []);
      setError(false);
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : "Unable to load addresses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to save address");
      setForm(emptyForm);
      setMessage("Address saved.");
      await load();
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : "Unable to save address");
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(id: string) {
    const response = await fetch("/api/account/addresses/default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      setError(true);
      setMessage("Unable to set the default address.");
      return;
    }
    setMessage("Default address updated.");
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this saved address?")) return;
    const response = await fetch(`/api/account/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      setError(true);
      setMessage("Unable to remove the address.");
      return;
    }
    setMessage("Address removed.");
    await load();
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-[#0f0f19] p-5 shadow-2xl shadow-black/20 sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Billing addresses</p>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Saved addresses</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Save your billing details once and reuse them at checkout.</p>
        </div>

        {message ? <p className={`mt-4 rounded-xl border px-3.5 py-3 text-sm ${error ? "border-rose-300/20 bg-rose-300/[0.06] text-rose-100" : "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100"}`}>{message}</p> : null}

        <div className="mt-5 grid gap-3">
          {loading ? <div className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" /> : null}
          {!loading && !addresses.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
              <p className="font-black text-slate-300">No saved addresses yet.</p>
              <p className="mt-1 text-sm text-slate-500">Add one below and checkout gets a little less repetitive.</p>
            </div>
          ) : null}
          {addresses.map((address) => (
            <article key={address.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-white">{address.label || "Billing address"}</h2>
                    {address.isDefault ? <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-200">Default</span> : null}
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-200">{address.fullName}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}<br />
                    {address.city}, {address.state} {address.postalCode}<br />
                    {address.country}{address.phone ? ` · ${address.phone}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!address.isDefault ? <button type="button" onClick={() => void setDefault(address.id)} className="min-h-10 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-200 hover:border-violet-400/30">Make default</button> : null}
                  <button type="button" onClick={() => void remove(address.id)} className="min-h-10 rounded-xl border border-rose-300/15 px-3 py-2 text-xs font-black text-rose-200 hover:bg-rose-300/[0.06]">Remove</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0f0f19] p-5 shadow-2xl shadow-black/20 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Add address</p>
        <h2 className="mt-2 text-xl font-black text-white">Save another billing address</h2>
        <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Label"><input className={input} value={form.label ?? ""} onChange={(e) => update("label", e.target.value)} placeholder="Home, School, etc." /></Field>
          <Field label="Full name"><input required className={input} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="name" /></Field>
          <Field label="Address line 1" className="sm:col-span-2"><input required className={input} value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} autoComplete="address-line1" /></Field>
          <Field label="Address line 2"><input className={input} value={form.addressLine2 ?? ""} onChange={(e) => update("addressLine2", e.target.value)} autoComplete="address-line2" /></Field>
          <Field label="Phone"><input className={input} value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" /></Field>
          <Field label="City"><input required className={input} value={form.city} onChange={(e) => update("city", e.target.value)} autoComplete="address-level2" /></Field>
          <Field label="State"><input required className={input} value={form.state} onChange={(e) => update("state", e.target.value)} autoComplete="address-level1" /></Field>
          <Field label="Postal code"><input required inputMode="numeric" className={input} value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} autoComplete="postal-code" /></Field>
          <Field label="Country"><input required className={input} value={form.country} onChange={(e) => update("country", e.target.value)} autoComplete="country-name" /></Field>
          <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-300 sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => update("isDefault", e.target.checked)} className="h-4 w-4 accent-violet-500" />
            Make this my default billing address
          </label>
          <button disabled={saving} className="min-h-12 rounded-xl bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60 sm:col-span-2">
            {saving ? "Saving…" : "Save address"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`text-xs font-black text-slate-400 ${className}`}>{label}{children}</label>;
}
