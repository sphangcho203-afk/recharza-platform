"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatInr, type MobileLegendsPackage } from "@/lib/mobile-legends";
import type { MobileLegendsMarket } from "@/lib/mobile-legends-market";

type CartItem = {
  id: string;
  gameSlug: string;
  marketCode: string | null;
  package: {
    id: string;
    name: string;
    amountInPaise: number;
    currency: string;
  };
  quantity: number;
  player: {
    playerId: string | null;
    zoneId: string | null;
    nickname: string | null;
    verificationMode: string | null;
  };
};

type CartSnapshot = {
  id: string | null;
  itemCount: number;
  totalInPaise: number;
  currency: string;
  items: CartItem[];
};

const emptyCart: CartSnapshot = {
  id: null,
  itemCount: 0,
  totalInPaise: 0,
  currency: "INR",
  items: [],
};

function createDraftPlayers(cart: CartSnapshot) {
  return Object.fromEntries(
    cart.items.map((item) => [
      item.id,
      {
        playerId: item.player.playerId ?? "",
        zoneId: item.player.zoneId ?? "",
      },
    ]),
  );
}

export function CartWorkspace({
  packages,
  market,
}: {
  packages: MobileLegendsPackage[];
  market: MobileLegendsMarket;
}) {
  const firstPackage = packages.find((item) => item.featured) ?? packages[0];
  const [cart, setCart] = useState<CartSnapshot>(emptyCart);
  const [selectedPackageId, setSelectedPackageId] = useState(firstPackage?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState("");
  const [message, setMessage] = useState("Loading your cart...");
  const [error, setError] = useState(false);
  const [draftPlayers, setDraftPlayers] = useState<
    Record<string, { playerId: string; zoneId: string }>
  >({});

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId) ?? packages[0],
    [packages, selectedPackageId],
  );

  function applyCart(next: CartSnapshot) {
    setCart(next);
    setDraftPlayers(createDraftPlayers(next));
  }

  useEffect(() => {
    let active = true;

    fetch("/api/cart", { cache: "no-store" })
      .then(async (response) => ({
        response,
        result: (await response.json()) as {
          ok?: boolean;
          message?: string;
          cart?: CartSnapshot;
        },
      }))
      .then(({ response, result }) => {
        if (!active) return;

        if (!response.ok || !result.ok || !result.cart) {
          setError(true);
          setMessage(result.message ?? "The cart could not be loaded.");
          return;
        }

        setCart(result.cart);
        setDraftPlayers(createDraftPlayers(result.cart));
        setMessage(
          result.cart.itemCount
            ? `${result.cart.itemCount} item(s) ready in your cart.`
            : "Your cart is ready for an offer.",
        );
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setMessage("The cart service could not be reached.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function addSelectedPackage() {
    if (!selectedPackage) return;
    setBusyItem("add");
    setError(false);
    setMessage(`Adding ${selectedPackage.name}...`);

    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: "mobile-legends",
          marketCode: market.code,
          packageId: selectedPackage.id,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        cart?: CartSnapshot;
      };
      if (!response.ok || !result.ok || !result.cart) {
        setError(true);
        setMessage(result.message ?? "The package could not be added.");
        return;
      }
      applyCart(result.cart);
      setMessage(result.message ?? "Package added to cart.");
    } catch {
      setError(true);
      setMessage("The package could not reach the cart service.");
    } finally {
      setBusyItem("");
    }
  }

  async function validateItem(itemId: string) {
    const draft = draftPlayers[itemId];
    if (!draft) return;
    setBusyItem(itemId);
    setError(false);
    setMessage("Checking account details...");

    try {
      const response = await fetch(
        `/api/cart/items/${encodeURIComponent(itemId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        cart?: CartSnapshot;
      };
      if (!response.ok || !result.ok || !result.cart) {
        setError(true);
        setMessage(result.message ?? "We could not find a game account with those details. Double-check the IDs.");
        return;
      }
      applyCart(result.cart);
      setMessage(result.message ?? "Account confirmed successfully.");
    } catch {
      setError(true);
      setMessage("The verification service is temporarily unavailable. Please retry shortly.");
    } finally {
      setBusyItem("");
    }
  }

  async function removeItem(itemId: string) {
    setBusyItem(itemId);
    setError(false);
    try {
      const response = await fetch(
        `/api/cart/items/${encodeURIComponent(itemId)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        cart?: CartSnapshot;
      };
      if (!response.ok || !result.ok || !result.cart) {
        setError(true);
        setMessage(result.message ?? "The item could not be removed.");
        return;
      }
      applyCart(result.cart);
      setMessage(result.message ?? "Item removed.");
    } catch {
      setError(true);
      setMessage("The item could not reach the cart service.");
    } finally {
      setBusyItem("");
    }
  }

  async function clearCart() {
    setBusyItem("clear");
    setError(false);
    try {
      const response = await fetch("/api/cart", { method: "DELETE" });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        cart?: CartSnapshot;
      };
      if (!response.ok || !result.ok || !result.cart) {
        setError(true);
        setMessage(result.message ?? "The cart could not be cleared.");
        return;
      }
      applyCart(result.cart);
      setMessage(result.message ?? "Cart cleared.");
    } catch {
      setError(true);
      setMessage("The cart could not be cleared.");
    } finally {
      setBusyItem("");
    }
  }

  const validatedCount = cart.items.filter(
    (item) => item.player.playerId && item.player.zoneId && item.player.nickname,
  ).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid min-w-0 gap-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
              Add Mobile Legends offer
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Build the order before checkout.
            </h2>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-8">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Package
              <select
                value={selectedPackageId}
                onChange={(event) => setSelectedPackageId(event.target.value)}
                className="mt-3 min-h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-base font-bold text-slate-900 outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
              >
                {packages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {formatInr(item.amountInPaise)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedPackage || busyItem === "add"}
              onClick={() => void addSelectedPackage()}
              className="min-h-14 rounded-2xl bg-violet-600 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-violet-200 transition-all hover:-translate-y-1 hover:bg-violet-700 disabled:opacity-50 disabled:translate-y-0"
            >
              {busyItem === "add" ? "Adding..." : "Add to cart"}
            </button>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
                Cart items
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Account Confirmation
              </h2>
            </div>
            {cart.items.length ? (
              <button
                type="button"
                disabled={busyItem === "clear"}
                onClick={() => void clearCart()}
                className="min-h-11 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-rose-700 hover:bg-rose-100 transition-colors"
              >
                Clear cart
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-5">
            {loading ? (
              <div className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-slate-50" />
            ) : null}

            {!loading && !cart.items.length ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                <p className="text-lg font-bold text-slate-900">Your cart is empty.</p>
                <p className="mt-3 text-sm font-medium text-slate-500">
                  Choose a package from any game in the store to get started.
                </p>
              </div>
            ) : null}

            {cart.items.map((item) => {
              const draft = draftPlayers[item.id] ?? {
                playerId: "",
                zoneId: "",
              };
              const validated = Boolean(item.player.nickname);

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
                        {market.flag} {market.label}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {item.package.name}
                      </h3>
                      <p className="mt-1 text-lg font-bold text-emerald-600">
                        {formatInr(item.package.amountInPaise)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busyItem === item.id}
                      onClick={() => void removeItem(item.id)}
                      className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Player ID
                      <input
                        inputMode="numeric"
                        value={draft.playerId}
                        onChange={(event) =>
                          setDraftPlayers((current) => ({
                            ...current,
                            [item.id]: {
                              ...draft,
                              playerId: event.target.value.replace(/\D/g, ""),
                            },
                          }))
                        }
                        className="mt-3 min-h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-base font-bold text-slate-900 outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
                        placeholder="Player ID"
                      />
                    </label>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Zone ID
                      <input
                        inputMode="numeric"
                        value={draft.zoneId}
                        onChange={(event) =>
                          setDraftPlayers((current) => ({
                            ...current,
                            [item.id]: {
                              ...draft,
                              zoneId: event.target.value.replace(/\D/g, ""),
                            },
                          }))
                        }
                        className="mt-3 min-h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-base font-bold text-slate-900 outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
                        placeholder="Zone ID"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={
                      busyItem === item.id || !draft.playerId || !draft.zoneId
                    }
                    onClick={() => void validateItem(item.id)}
                    className="mt-6 min-h-12 w-full rounded-2xl border border-violet-200 bg-violet-50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-violet-700 shadow-sm transition-all hover:bg-violet-600 hover:text-white disabled:opacity-50"
                  >
                    {busyItem === item.id
                      ? "Validating..."
                      : validated
                        ? "Reconfirm account"
                        : "Confirm account"}
                  </button>

                  {validated ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 shadow-sm">
                      <span className="text-emerald-900">
                        {item.player.nickname}
                      </span>{" "}
                      · Account confirmed successfully.
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>

<aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 lg:sticky lg:top-24">
	        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
	          Order summary
	        </p>
        <div className="mt-5 grid gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-500">Items</span>
            <strong className="font-bold text-slate-900">{cart.itemCount}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-500">Confirmed</span>
            <strong className="font-bold text-slate-900">
              {validatedCount}/{cart.items.length}
            </strong>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Total</span>
            <strong className="text-3xl font-bold text-slate-900 tracking-tight">
              {formatInr(cart.totalInPaise)}
            </strong>
          </div>
        </div>

<Link
	          href={`/games/mobile-legends/${market.code}`}
	          className={`mt-6 block min-h-14 rounded-2xl px-6 py-4 text-center text-sm font-bold uppercase tracking-widest transition duration-300 shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${
	            cart.items.length && validatedCount === cart.items.length
	              ? "bg-violet-600 text-white shadow-violet-200 hover:-translate-y-0.5 hover:bg-violet-700"
	              : "pointer-events-none bg-slate-100 text-slate-400 shadow-none"
	          }`}
	        >
	          Continue to checkout
	        </Link>
        <p className="mt-4 text-[11px] font-medium leading-relaxed text-slate-400">
          Please confirm all account details before continuing. Guest carts merge
          automatically after login.
        </p>

        {message ? (
          <p
            aria-live={error ? "assertive" : "polite"}
            className={`mt-5 rounded-xl border px-4 py-3 text-[11px] font-bold leading-relaxed ${
              error
                ? "border-rose-100 bg-rose-50 text-rose-600"
                : "border-slate-100 bg-slate-50 text-slate-500"
            }`}
          >
            {message}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
