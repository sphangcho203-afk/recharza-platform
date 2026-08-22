"use client";

import { useEffect, useRef, useState } from "react";

import {
  SavedAddressForm,
  type SavedAddressFormValue,
} from "@/components/saved-address-form";
import { billingCountries } from "@/lib/commerce/currencies";
import type { SavedAddressView } from "@/lib/commerce/saved-addresses";

type AddressResponse = {
  ok: boolean;
  addresses?: SavedAddressView[];
  address?: SavedAddressView;
  deleted?: boolean;
  message?: string;
};

type LoadResult =
  | { ok: true; addresses: SavedAddressView[] }
  | { ok: false; message: string };

async function loadAddresses(): Promise<LoadResult> {
  try {
    const response = await fetch("/api/account/addresses", {
      cache: "no-store",
    });
    const result = (await response.json()) as AddressResponse;
    if (!response.ok || !result.ok || !result.addresses) {
      return {
        ok: false,
        message:
          response.status === 401
            ? "Your session ended. Sign in again to manage saved addresses."
            : result.message ?? "Saved addresses could not be loaded.",
      };
    }
    return { ok: true, addresses: result.addresses };
  } catch {
    return {
      ok: false,
      message:
        "Saved addresses could not be loaded. Check the connection and retry.",
    };
  }
}

type FormMode = "closed" | "create" | "edit";

function countryLabel(code: string) {
  return billingCountries.find((country) => country.code === code)?.label ?? code;
}

function savedAddressToForm(item: SavedAddressView): SavedAddressFormValue {
  return {
    fullName: item.fullName,
    email: item.email,
    phone: item.phone,
    line1: item.line1,
    line2: item.line2 ?? "",
    city: item.city,
    state: item.state,
    postalCode: item.postalCode,
    countryCode: item.countryCode,
  };
}

export function SavedAddressesPanel() {
  const [addresses, setAddresses] = useState<SavedAddressView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    loadAddresses()
      .then((snapshot) => {
        if (!active) return;
        if (snapshot.ok) {
          setAddresses(snapshot.addresses);
          setError(false);
        } else {
          setMessage(snapshot.message);
          setError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    };
  }, []);

  function openCreate() {
    setFormMode("create");
    setEditingId(null);
    setError(false);
    setMessage("");
  }

  function startEdit(item: SavedAddressView) {
    setEditingId(item.id);
    setFormMode("edit");
    setError(false);
    setMessage("");
  }

  function closeForm() {
    setFormMode("closed");
    setEditingId(null);
    setSaving(false);
  }

  function armDelete(item: SavedAddressView) {
    setConfirmingDeleteId(item.id);
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    confirmTimeout.current = setTimeout(() => setConfirmingDeleteId(null), 5000);
  }

  async function saveAddress(next: SavedAddressFormValue, makeDefault: boolean) {
    setSaving(true);
    setError(false);
    setMessage("");
    try {
      if (formMode === "edit" && editingId) {
        const current = addresses.find((item) => item.id === editingId);
        if (!current) {
          setError(true);
          setMessage("This address no longer exists. Refresh the list and retry.");
          return;
        }

        const patch: Record<string, unknown> = { id: editingId };
        if (next.fullName !== current.fullName) patch.fullName = next.fullName;
        if (next.email !== current.email) patch.email = next.email;
        if (next.phone !== current.phone) patch.phone = next.phone;
        if (next.line1 !== current.line1) patch.line1 = next.line1;
        const nextLine2 = next.line2.trim() || null;
        if (nextLine2 !== current.line2) patch.line2 = nextLine2;
        if (next.city !== current.city) patch.city = next.city;
        if (next.state !== current.state) patch.state = next.state;
        if (next.postalCode !== current.postalCode) patch.postalCode = next.postalCode;
        if (next.countryCode !== current.countryCode) patch.countryCode = next.countryCode;
        if (makeDefault !== current.isDefault) patch.isDefault = makeDefault;

        if (Object.keys(patch).length === 1) {
          closeForm();
          return;
        }

        const response = await fetch("/api/account/addresses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const result = (await response.json()) as AddressResponse;
        if (!response.ok || !result.ok || !result.address) {
          setError(true);
          setMessage(result.message ?? "The billing address could not be updated.");
          return;
        }
        setAddresses((previous) =>
          previous.map((item) => (item.id === editingId ? result.address! : item)),
        );
        setMessage("Billing address updated.");
        closeForm();
        return;
      }

      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...next,
          line2: next.line2.trim() || null,
        }),
      });
      const result = (await response.json()) as AddressResponse;
      if (!response.ok || !result.ok || !result.address) {
        setError(true);
        setMessage(result.message ?? "The billing address could not be saved.");
        return;
      }
      const created = result.address;
      setAddresses((previous) => {
        const rest = created.isDefault
          ? previous.map((item) => ({ ...item, isDefault: false }))
          : previous;
        return [...rest, created];
      });
      setMessage("Billing address saved.");
      closeForm();
    } catch {
      setError(true);
      setMessage("The address service could not be reached. Try again shortly.");
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(item: SavedAddressView) {
    setSettingDefaultId(item.id);
    setError(false);
    setMessage("");
    try {
      const response = await fetch("/api/account/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isDefault: true }),
      });
      const result = (await response.json()) as AddressResponse;
      if (!response.ok || !result.ok || !result.address) {
        setError(true);
        setMessage(result.message ?? "The default billing address could not be updated.");
        return;
      }
      setAddresses((previous) =>
        previous.map((address) => ({
          ...address,
          isDefault: address.id === item.id,
        })),
      );
      setMessage("Default billing address updated.");
    } catch {
      setError(true);
      setMessage("The address service could not be reached. Try again shortly.");
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function removeAddress(item: SavedAddressView) {
    setDeletingId(item.id);
    setConfirmingDeleteId(null);
    setError(false);
    setMessage("");
    try {
      const response = await fetch("/api/account/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const result = (await response.json()) as AddressResponse;
      if (!response.ok || !result.ok) {
        setError(true);
        setMessage(result.message ?? "The billing address could not be deleted.");
        return;
      }
      if (item.isDefault) {
        const snapshot = await loadAddresses();
        if (!snapshot.ok) {
          setMessage(snapshot.message);
          setError(true);
          return;
        }
        setAddresses(snapshot.addresses);
        setError(false);
      } else {
        setAddresses((previous) => previous.filter((address) => address.id !== item.id));
      }
      setMessage("Billing address deleted.");
    } catch {
      setError(true);
      setMessage("The address service could not be reached. Try again shortly.");
    } finally {
      setDeletingId(null);
    }
  }

  async function retryAddresses() {
    const snapshot = await loadAddresses();
    if (snapshot.ok) {
      setAddresses(snapshot.addresses);
      setError(false);
    } else {
      setMessage(snapshot.message);
      setError(true);
    }
  }

  const editingAddress =
    formMode === "edit" && editingId
      ? addresses.find((item) => item.id === editingId) ?? null
      : null;
  const busy = saving || Boolean(settingDefaultId) || Boolean(deletingId);

  return (
    <section
      aria-labelledby="saved-addresses-heading"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 sm:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
            Billing identity
          </p>
          <h2
            id="saved-addresses-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-slate-900"
          >
            Saved billing addresses
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {loading
              ? "Loading your saved billing details…"
              : `${addresses.length} ${
                  addresses.length === 1 ? "address" : "addresses"
                } used to prefill checkout billing.`}
          </p>
        </div>
        {!loading && formMode === "closed" ? (
          <button
            type="button"
            onClick={openCreate}
            disabled={busy}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-5 text-[11px] font-bold uppercase tracking-widest text-slate-900 shadow-sm transition-all hover:-translate-y-1 hover:bg-slate-50 disabled:opacity-50"
          >
            Add address
          </button>
        ) : null}
      </div>

      {formMode === "create" ? (
        <div className="mt-8">
          <SavedAddressForm
            key="create"
            title="Add a billing address"
            submitLabel="Add address"
            saving={saving}
            onSave={saveAddress}
            onCancel={closeForm}
          />
        </div>
      ) : null}

      {formMode === "edit" && editingAddress ? (
        <div className="mt-8">
          <SavedAddressForm
            key={editingAddress.id}
            title="Edit billing address"
            submitLabel="Save changes"
            initialValue={savedAddressToForm(editingAddress)}
            showDefaultOption
            initialIsDefault={editingAddress.isDefault}
            saving={saving}
            onSave={saveAddress}
            onCancel={closeForm}
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-4" aria-live="polite">
        {loading ? (
          <>
            <div className="h-32 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
            <div className="h-32 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
          </>
        ) : addresses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
            <p className="font-bold text-slate-900">No saved billing addresses.</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Add an address and it will prefill billing in checkout.
            </p>
            <button
              type="button"
              onClick={openCreate}
              disabled={busy}
              className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-violet-600 px-6 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg shadow-violet-100 transition-all hover:-translate-y-1 hover:bg-violet-700 disabled:opacity-50"
            >
              Add billing address
            </button>
          </div>
        ) : (
          addresses.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 transition-all hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">{item.fullName}</h3>
                    {item.isDefault ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                    {item.line1}
                    {item.line2 ? `, ${item.line2}` : ""}, {item.city},{" "}
                    {item.state} {item.postalCode},{" "}
                    {countryLabel(item.countryCode)}
                  </p>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {item.email} <span className="mx-1 text-slate-200">·</span> {item.phone}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
                {!item.isDefault ? (
                  <button
                    type="button"
                    onClick={() => void setDefault(item)}
                    disabled={busy}
                    className="min-h-10 rounded-xl bg-white border border-slate-200 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                  >
                    {settingDefaultId === item.id ? "Setting…" : "Set as default"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  disabled={busy}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-pressed={confirmingDeleteId === item.id}
                  onClick={() =>
                    confirmingDeleteId === item.id
                      ? void removeAddress(item)
                      : armDelete(item)
                  }
                  disabled={Boolean(deletingId)}
                  className={`min-h-10 rounded-xl border px-3.5 text-xs font-bold transition disabled:opacity-50 ${
                    confirmingDeleteId === item.id
                      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:text-rose-600"
                  }`}
                >
                  {deletingId === item.id
                    ? "Deleting…"
                    : confirmingDeleteId === item.id
                      ? "Confirm delete?"
                      : "Delete"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {message ? (
        <div
          role="status"
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <span>{message}</span>
          {error ? (
            <button
              type="button"
              onClick={() => void retryAddresses()}
              className="text-xs font-bold text-rose-600 underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}