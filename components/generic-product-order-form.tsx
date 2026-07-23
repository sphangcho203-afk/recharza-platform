"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  BillingAddressFields,
  initialBillingForm,
  type BillingFormState,
} from "@/components/billing-address-fields";
import { ProductOfferCard } from "@/components/product-offer-card";
import {
  convertInrPaiseToCurrencyMinor,
  formatCurrencyMinor,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";
import type { StoreProduct } from "@/lib/generic-catalog";
import type { Game } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";

type FxSnapshot = {
  base: "INR";
  mode: "live" | "inr-only";
  source: string;
  quotedAt: string;
  ratesFromInrMicros: Record<SupportedCurrencyCode, number>;
};

type AccountState =
  | { status: "loading"; email: null }
  | { status: "guest"; email: null }
  | { status: "authenticated"; email: string };

type CreatedOrder = {
  id: string;
  status: string;
  gameSlug: string;
  package: { name: string; amountInPaise: number; currency: string };
  presentment?: { amountMinor: number; currency: SupportedCurrencyCode } | null;
  tracking: { path: string; accessToken: string };
};

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return `rz_${globalThis.crypto.randomUUID()}`;
  return `rz_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
}

export function GenericProductOrderForm({
  game,
  products,
  fxSnapshot,
}: {
  game: Game;
  products: StoreProduct[];
  fxSnapshot: FxSnapshot;
}) {
  const firstProduct = products.find((item) => item.featured) ?? products[0];
  const [productId, setProductId] = useState(firstProduct?.id ?? "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [billing, setBilling] = useState<BillingFormState>(initialBillingForm);
  const [account, setAccount] = useState<AccountState>({ status: "loading", email: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === productId) ?? products[0],
    [productId, products],
  );
  const selectedRate = fxSnapshot.ratesFromInrMicros[billing.presentmentCurrency] ?? 0;
  const canConvert = billing.presentmentCurrency === "INR" || selectedRate > 0;

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated?: boolean; customer?: { email?: string } }) => {
        if (!active) return;
        if (result.authenticated && result.customer?.email) {
          setAccount({ status: "authenticated", email: result.customer.email });
          setBilling((current) =>
            current.email ? current : { ...current, email: result.customer!.email! },
          );
        } else {
          setAccount({ status: "guest", email: null });
        }
      })
      .catch(() => {
        if (active) setAccount({ status: "guest", email: null });
      });

    return () => {
      active = false;
    };
  }, []);

  function formatPresentment(amountInPaise: number) {
    if (billing.presentmentCurrency === "INR" || !selectedRate) return formatInr(amountInPaise);
    return formatCurrencyMinor(
      convertInrPaiseToCurrencyMinor(
        amountInPaise,
        billing.presentmentCurrency,
        selectedRate,
      ),
      billing.presentmentCurrency,
    );
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOrder(null);

    if (account.status !== "authenticated") {
      setError("Sign in with a verified customer account before creating an order.");
      return;
    }
    if (!selectedProduct) {
      setError("Choose an available product.");
      return;
    }
    const missingField = game.inputFields.find(
      (field) => field.required !== false && !fields[field.id]?.trim(),
    );
    if (missingField) {
      setError(`${missingField.label} is required.`);
      return;
    }
    if (!canConvert) {
      setError("The selected currency quote is unavailable. Choose INR or refresh.");
      return;
    }

    setBusy(true);
    const requestKey = idempotencyKey.current ?? createIdempotencyKey();
    idempotencyKey.current = requestKey;

    try {
      const response = await fetch("/api/orders/generic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey,
        },
        body: JSON.stringify({
          gameSlug: game.slug,
          productId: selectedProduct.id,
          fulfilmentFields: fields,
          billing: {
            ...billing,
            presentmentCurrency:
              fxSnapshot.mode === "live" ? billing.presentmentCurrency : "INR",
          },
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        order?: CreatedOrder;
      };

      if (!response.ok || !result.ok || !result.order) {
        setError(result.message ?? "The order could not be created.");
        if (response.status === 401) setAccount({ status: "guest", email: null });
        return;
      }

      sessionStorage.setItem(
        `recharza-order:${result.order.id}`,
        result.order.tracking.accessToken,
      );
      setOrder(result.order);
    } catch {
      setError("The order service could not be reached. Retrying will not duplicate the order.");
    } finally {
      setBusy(false);
    }
  }

  if (!selectedProduct) {
    return (
      <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
        No approved products are available for this catalogue.
      </div>
    );
  }

  return (
    <form onSubmit={submitOrder} className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/20 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">01 · Product</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Choose a pack or code</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Live FazerCards offers replace indicative previews after an approved supplier sync. Final price and availability are resolved on the server.
            </p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${products.some((item) => item.source === "fazercards-live") ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
            {products.some((item) => item.source === "fazercards-live")
              ? "Live supplier catalogue"
              : "Indicative supplier preview"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {products.map((item) => (
            <ProductOfferCard
              key={item.id}
              item={item}
              selected={item.id === productId}
              displayPrice={formatPresentment(item.amountInPaise)}
              settlementPrice={billing.presentmentCurrency === "INR" ? undefined : formatInr(item.amountInPaise)}
              fallbackSources={[...game.logoSources, ...game.artworkSources]}
              fallbackLabel={game.title}
              onSelect={() => {
                setProductId(item.id);
                idempotencyKey.current = null;
                setOrder(null);
                setError("");
              }}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/20 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">02 · Delivery</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Delivery details</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Required fields are tied to this product type. Supplier validation runs again before fulfilment.
          </p>

          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${account.status === "authenticated" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
            {account.status === "loading" ? (
              "Checking customer session..."
            ) : account.status === "authenticated" ? (
              <>Signed in as <strong>{account.email}</strong>.</>
            ) : (
              <><strong>Customer sign-in required.</strong> <Link href="/account" className="underline underline-offset-4">Sign in by email</Link>.</>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {game.inputFields.map((field) => (
              <label key={field.id} className={game.inputFields.length === 1 ? "text-sm font-semibold text-slate-200 sm:col-span-2" : "text-sm font-semibold text-slate-200"}>
                {field.label}
                <input
                  required={field.required !== false}
                  type={field.inputMode === "email" ? "email" : "text"}
                  inputMode={field.inputMode ?? "text"}
                  autoComplete={field.inputMode === "email" ? "email" : "off"}
                  value={fields[field.id] ?? ""}
                  onChange={(event) => {
                    setFields((current) => ({ ...current, [field.id]: event.target.value }));
                    idempotencyKey.current = null;
                    setOrder(null);
                    setError("");
                  }}
                  placeholder={field.placeholder}
                  className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
                />
              </label>
            ))}
          </div>
        </section>

        <BillingAddressFields value={billing} onChange={setBilling} fxMode={fxSnapshot.mode} />
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(17,17,29,0.98),rgba(8,8,16,0.98))] shadow-2xl shadow-black/30">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">04 · Review</p>
            <h2 className="mt-2 text-2xl font-black">Confirm the protected order snapshot</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{game.title}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{selectedProduct.name}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Billing {billing.countryCode}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Display {billing.presentmentCurrency}</span>
            </div>
          </div>
          <div className="min-w-56 rounded-2xl border border-white/10 bg-black/25 p-4 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Displayed total</p>
            <p className="mt-1 text-3xl font-black text-white">{formatPresentment(selectedProduct.amountInPaise)}</p>
            {billing.presentmentCurrency !== "INR" ? (
              <p className="mt-1 text-xs text-slate-500">Settlement {formatInr(selectedProduct.amountInPaise)}</p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 p-4 sm:p-6">
          <button
            type="submit"
            disabled={busy || account.status !== "authenticated" || !canConvert}
            className="min-h-13 w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? "Creating protected order..." : `Continue with ${selectedProduct.name}`}
          </button>
          {error ? <p aria-live="assertive" className="mt-3 text-sm text-rose-300">{error}</p> : null}

          {order ? (
            <div aria-live="polite" className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Order created</p>
              <p className="mt-2 break-all text-xl font-black text-white">{order.id}</p>
              <p className="mt-2 text-sm text-emerald-100/80">{order.package.name} · {game.title}</p>
              <Link href={order.tracking.path} className="mt-4 block min-h-12 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-center text-sm font-black text-emerald-100">
                Open secure order tracking
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </form>
  );
}
