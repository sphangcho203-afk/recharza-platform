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
    setMessage("Validating the player destination...");

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
        setMessage(result.message ?? "The player could not be validated.");
        return;
      }
      applyCart(result.cart);
      setMessage(result.message ?? "Account validated successfully.");
    } catch {
      setError(true);
      setMessage("Player validation could not reach the cart service.");
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
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f19] shadow-2xl shadow-black/25">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_50%),rgba(255,255,255,0.025)] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              Add Mobile Legends offer
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Build the order before checkout.
            </h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-6">
            <label className="text-sm font-semibold text-slate-200">
              Package
              <select
                value={selectedPackageId}
                onChange={(event) => setSelectedPackageId(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none focus:border-violet-400"
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
              className="min-h-12 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:opacity-50"
            >
              {busyItem === "add" ? "Adding..." : "Add to cart"}
            </button>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                Cart items
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Player destinations
              </h2>
            </div>
            {cart.items.length ? (
              <button
                type="button"
                disabled={busyItem === "clear"}
                onClick={() => void clearCart()}
                className="min-h-11 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs font-black text-rose-200"
              >
                Clear cart
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4">
            {loading ? (
              <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ) : null}

            {!loading && !cart.items.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <p className="font-black text-slate-300">Your cart is empty.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Choose a package above or return to the Mobile Legends store.
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
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                        {market.flag} {market.label}
                      </p>
                      <h3 className="mt-2 text-xl font-black text-white">
                        {item.package.name}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-emerald-200">
                        {formatInr(item.package.amountInPaise)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busyItem === item.id}
                      onClick={() => void removeItem(item.id)}
                      className="w-fit rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-slate-400 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-200">
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
                        className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none focus:border-violet-400"
                        placeholder="Player ID"
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-200">
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
                        className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none focus:border-violet-400"
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
                    className="mt-3 min-h-11 w-full rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm font-black text-violet-100 disabled:opacity-45"
                  >
                    {busyItem === item.id
                      ? "Validating..."
                      : validated
                        ? "Revalidate account"
                        : "Validate account"}
                  </button>

                  {validated ? (
                    <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                      <strong className="text-white">
                        {item.player.nickname}
                      </strong>{" "}
                      · Account validated successfully.
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-3xl border border-white/10 bg-[#0f0f19] p-5 shadow-2xl shadow-black/25 lg:sticky lg:top-24">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          Order summary
        </p>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Items</span>
            <strong className="text-white">{cart.itemCount}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Validated</span>
            <strong className="text-white">
              {validatedCount}/{cart.items.length}
            </strong>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <span className="font-bold text-slate-300">Total</span>
            <strong className="text-2xl text-white">
              {formatInr(cart.totalInPaise)}
            </strong>
          </div>
        </div>

        <Link
          href={`/games/mobile-legends/${market.code}`}
          className={`mt-5 block min-h-12 rounded-xl px-5 py-3.5 text-center text-sm font-black transition ${
            cart.items.length && validatedCount === cart.items.length
              ? "bg-white text-slate-950 hover:bg-violet-200"
              : "pointer-events-none bg-white/10 text-slate-600"
          }`}
        >
          Continue to checkout
        </Link>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Validate every player destination before continuing. Guest carts merge
          automatically after login.
        </p>

        {message ? (
          <p
            aria-live={error ? "assertive" : "polite"}
            className={`mt-4 rounded-xl border px-3 py-3 text-xs leading-5 ${
              error
                ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                : "border-white/10 bg-black/20 text-slate-400"
            }`}
          >
            {message}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
