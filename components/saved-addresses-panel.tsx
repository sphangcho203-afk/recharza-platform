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
      className="rounded-lg border border-white/10 bg-[#0f0f19] p-5 shadow-2xl shadow-black/25 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            Billing identity
          </p>
          <h2
            id="saved-addresses-heading"
            className="mt-2 text-2xl font-semibold text-white"
          >
            Saved billing addresses
          </h2>
          <p className="mt-1 text-sm text-slate-500">
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
            className="min-h-11 rounded-lg border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-xs font-semibold text-violet-100 transition hover:bg-violet-400/20 disabled:opacity-50"
          >
            Add address
          </button>
        ) : null}
      </div>

      {formMode === "create" ? (
        <div className="mt-4">
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
        <div className="mt-4">
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

      <div className="mt-4 grid gap-3" aria-live="polite">
        {loading ? (
          <>
            <div className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.025]" />
            <div className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.025]" />
          </>
        ) : addresses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="font-semibold text-slate-300">No saved billing addresses.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add an address and it will prefill billing in checkout.
            </p>
            <button
              type="button"
              onClick={openCreate}
              disabled={busy}
              className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-white px-4 py-3 text-xs font-semibold text-slate-950 disabled:opacity-50"
            >
              Add billing address
            </button>
          </div>
        ) : (
          addresses.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:p-5"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">{item.fullName}</h3>
                    {item.isDefault ? (
                      <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-400">
                    {item.line1}
                    {item.line2 ? `, ${item.line2}` : ""}, {item.city},{" "}
                    {item.state} {item.postalCode},{" "}
                    {countryLabel(item.countryCode)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.email} · {item.phone}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3.5">
                {!item.isDefault ? (
                  <button
                    type="button"
                    onClick={() => void setDefault(item)}
                    disabled={busy}
                    className="min-h-10 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.07] px-3.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-300/15 disabled:opacity-50"
                  >
                    {settingDefaultId === item.id ? "Setting…" : "Set as default"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  disabled={busy}
                  className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-xs font-semibold text-slate-200 transition hover:text-white disabled:opacity-50"
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
                  className={`min-h-10 rounded-lg border px-3.5 text-xs font-semibold transition disabled:opacity-50 ${
                    confirmingDeleteId === item.id
                      ? "border-rose-400/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
                      : "border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-rose-400/25 hover:text-rose-200"
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
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
              : "border-white/10 bg-black/20 text-slate-400"
          }`}
        >
          <span>{message}</span>
          {error ? (
            <button
              type="button"
              onClick={() => void retryAddresses()}
              className="text-xs font-semibold text-rose-100 underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}