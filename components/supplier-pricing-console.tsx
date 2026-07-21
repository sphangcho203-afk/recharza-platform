"use client";

import { type FormEvent, useState } from "react";

import { formatInr } from "@/lib/mobile-legends";

type PricingPolicy = {
  usdInrRatePaise: number;
  fxBufferBps: number;
  gatewayFeeBps: number;
  targetMarginBps: number;
  minimumMarginInPaise: number;
  overheadInPaise: number;
  roundingInPaise: number;
};

type PricingResponse = {
  ok: boolean;
  message?: string;
  access?: { mode: string; role: string };
  policy?: PricingPolicy;
  productsRepriced?: number;
  catalog?: {
    productCount: number;
    publishedCount: number;
    latestSync: {
      status: string;
      categoriesSynced: number;
      offersSynced: number;
      startedAt: string;
      completedAt: string | null;
      errorMessage: string | null;
    } | null;
  };
};

type SyncResponse = {
  ok: boolean;
  message?: string;
  categoriesSynced?: number;
  offersSynced?: number;
  invalidOffers?: number;
  publishedOffers?: number;
  publicationMode?: string;
};

const defaultPolicy: PricingPolicy = {
  usdInrRatePaise: 9650,
  fxBufferBps: 250,
  gatewayFeeBps: 250,
  targetMarginBps: 1200,
  minimumMarginInPaise: 1500,
  overheadInPaise: 500,
  roundingInPaise: 500,
};

const policyFields: Array<{
  key: keyof PricingPolicy;
  label: string;
  helper: string;
  suffix: string;
}> = [
  { key: "usdInrRatePaise", label: "USD/INR rate", helper: "Paise per US dollar. ₹96.50 is stored as 9650.", suffix: "paise/USD" },
  { key: "fxBufferBps", label: "FX reserve", helper: "Protects against conversion spread and currency movement.", suffix: "bps" },
  { key: "gatewayFeeBps", label: "Gateway reserve", helper: "Estimated payment processing cost reserved from revenue.", suffix: "bps" },
  { key: "targetMarginBps", label: "Base margin target", helper: "Small packs automatically receive a higher percentage floor.", suffix: "bps" },
  { key: "minimumMarginInPaise", label: "Minimum profit", helper: "Absolute expected profit floor after reserved gateway cost.", suffix: "paise" },
  { key: "overheadInPaise", label: "Per-order overhead", helper: "Contribution toward supplier plan, support, and operating cost.", suffix: "paise" },
  { key: "roundingInPaise", label: "Price rounding", helper: "Prices always round upward by this increment.", suffix: "paise" },
];

function buildHeaders(token: string, json = false) {
  const headers: Record<string, string> = {};
  if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

export function SupplierPricingConsole() {
  const [token, setToken] = useState("");
  const [policy, setPolicy] = useState<PricingPolicy>(defaultPolicy);
  const [catalog, setCatalog] = useState<PricingResponse["catalog"]>(undefined);
  const [access, setAccess] = useState<PricingResponse["access"]>(undefined);
  const [busy, setBusy] = useState<"load" | "save" | "sync" | "">("");
  const [message, setMessage] = useState(
    "Use a verified staff session, or the emergency token, to load supplier controls.",
  );
  const [isError, setIsError] = useState(false);

  function useSavedToken() {
    const saved = sessionStorage.getItem("recharza-operator-token") ?? "";
    if (!saved) {
      setIsError(true);
      setMessage("No emergency token is saved. Leave the field empty to use your staff session.");
      return;
    }
    setToken(saved);
    void loadPricing(saved);
  }

  async function loadPricing(currentToken = token) {
    setBusy("load");
    setIsError(false);
    setMessage("Loading supplier economics...");

    try {
      const response = await fetch("/api/operator/pricing", {
        headers: buildHeaders(currentToken),
        cache: "no-store",
      });
      const result = (await response.json()) as PricingResponse;

      if (!response.ok || !result.ok || !result.policy) {
        setIsError(true);
        setMessage(result.message ?? "Pricing controls could not be loaded.");
        return;
      }

      if (currentToken.trim()) {
        sessionStorage.setItem("recharza-operator-token", currentToken.trim());
      }
      setPolicy(result.policy);
      setCatalog(result.catalog);
      setAccess(result.access);
      setMessage(`Pricing policy loaded through ${result.access?.mode ?? "protected access"}.`);
    } catch {
      setIsError(true);
      setMessage("The pricing service could not be reached.");
    } finally {
      setBusy("");
    }
  }

  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("save");
    setIsError(false);
    setMessage("Repricing the supplier catalogue...");

    try {
      const response = await fetch("/api/operator/pricing", {
        method: "POST",
        headers: buildHeaders(token, true),
        body: JSON.stringify(policy),
      });
      const result = (await response.json()) as PricingResponse;

      if (!response.ok || !result.ok || !result.policy) {
        setIsError(true);
        setMessage(result.message ?? "Pricing policy could not be updated.");
        return;
      }

      setPolicy(result.policy);
      setMessage(`${result.productsRepriced ?? 0} supplier product(s) repriced safely.`);
      await loadPricing(token);
    } catch {
      setIsError(true);
      setMessage("The pricing update could not reach the server.");
    } finally {
      setBusy("");
    }
  }

  async function syncSupplier() {
    setBusy("sync");
    setIsError(false);
    setMessage("Synchronizing supported FazerCards categories and offers...");

    try {
      const response = await fetch("/api/operator/suppliers/fazercards/sync", {
        method: "POST",
        headers: buildHeaders(token),
      });
      const result = (await response.json()) as SyncResponse;

      if (!response.ok || !result.ok) {
        setIsError(true);
        setMessage(result.message ?? "Supplier synchronization failed.");
        return;
      }

      setMessage(
        `${result.offersSynced ?? 0} offers synced across ${result.categoriesSynced ?? 0} categories; ${result.publishedOffers ?? 0} published. ${result.publicationMode ?? ""}`,
      );
      await loadPricing(token);
    } catch {
      setIsError(true);
      setMessage("The supplier synchronization service could not be reached.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
            Supplier and pricing cockpit
          </p>
          <h2 className="mt-2 text-2xl font-black">FazerCards catalogue economics</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            The API key remains server-side. Staff sessions control the retail policy and approved catalogue synchronization.
          </p>
          {access ? (
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-300">
              {access.role} · {access.mode}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-60 gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div className="flex justify-between gap-6"><span className="text-slate-500">Products synced</span><span className="font-bold text-white">{catalog?.productCount ?? "—"}</span></div>
          <div className="flex justify-between gap-6"><span className="text-slate-500">Published live</span><span className="font-bold text-emerald-300">{catalog?.publishedCount ?? "—"}</span></div>
          <div className="flex justify-between gap-6"><span className="text-slate-500">Last sync</span><span className="font-bold capitalize text-white">{catalog?.latestSync?.status?.toLowerCase() ?? "—"}</span></div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Optional emergency token"
          autoComplete="off"
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400"
        />
        <button type="button" onClick={useSavedToken} disabled={Boolean(busy)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-50">
          Use saved fallback
        </button>
        <button type="button" onClick={() => void loadPricing()} disabled={Boolean(busy)} className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400 disabled:opacity-50">
          {busy === "load" ? "Loading..." : "Load controls"}
        </button>
      </div>

      <form onSubmit={savePolicy} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {policyFields.map((field) => (
          <label key={field.key} className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm font-semibold text-slate-200">
            <span className="flex items-center justify-between gap-3">{field.label}<span className="text-[10px] uppercase tracking-wider text-slate-600">{field.suffix}</span></span>
            <input
              required
              type="number"
              inputMode="numeric"
              value={policy[field.key]}
              onChange={(event) => setPolicy((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-base font-bold text-white outline-none focus:border-violet-400"
            />
            <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">{field.helper}</span>
          </label>
        ))}

        <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4 sm:col-span-2 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">Readable policy</p>
          <p className="mt-3 text-sm leading-6 text-violet-100/80">
            USD/INR ₹{(policy.usdInrRatePaise / 100).toFixed(2)} · FX {(policy.fxBufferBps / 100).toFixed(2)}% · gateway {(policy.gatewayFeeBps / 100).toFixed(2)}% · base margin {(policy.targetMarginBps / 100).toFixed(2)}% · minimum profit {formatInr(policy.minimumMarginInPaise)} · overhead {formatInr(policy.overheadInPaise)}.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-4">
          <button type="submit" disabled={Boolean(busy)} className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
            {busy === "save" ? "Repricing..." : "Save and reprice"}
          </button>
          <button type="button" onClick={() => void syncSupplier()} disabled={Boolean(busy)} className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100 disabled:opacity-50">
            {busy === "sync" ? "Syncing FazerCards..." : "Sync FazerCards now"}
          </button>
        </div>
      </form>

      <p aria-live="polite" className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${isError ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-white/10 bg-black/15 text-slate-400"}`}>
        {message}
      </p>
    </section>
  );
}
