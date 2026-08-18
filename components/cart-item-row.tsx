"use client";

import { DisplayPrice } from "@/components/display-price";
import { ResilientImage } from "@/components/resilient-image";
import { resolveProductMedia } from "@/lib/catalog/product-media";
import {
  CART_MAX_QUANTITY,
  type CartItemView,
} from "@/lib/cart-snapshot";
import { mobileLegendsMarkets } from "@/lib/mobile-legends-market";

const supplierGameTitles: Record<string, string> = {
  "free-fire": "Free Fire",
  "pubg-mobile": "PUBG Mobile",
  valorant: "Valorant",
  "genshin-impact": "Genshin Impact",
  "mobile-legends": "Mobile Legends",
};

function itemContextLabel(item: CartItemView) {
  if (item.gameSlug === "mobile-legends") {
    const market = mobileLegendsMarkets.find(
      (entry) => entry.code === item.marketCode,
    );
    if (market) return `${market.flag} ${market.label}`;
    return "Mobile Legends";
  }
  const title = supplierGameTitles[item.gameSlug] ?? item.gameSlug;
  return item.marketCode ? `${title} · ${item.marketCode}` : title;
}

export function lineTotalInPaise(item: CartItemView) {
  return item.package.amountInPaise * Math.max(1, item.quantity);
}

function deliveredAmountLabel(packageName: string) {
  const match = packageName.match(/([\d,]+(?:\s*\+\s*[\d,]+)?)\s*(diamonds?|uc|vp|points?|crystals?|genesis crystals?)/i);
  if (match) return `${match[1]} ${match[2]}`;
  if (/pass|membership|prime|monthly|weekly/i.test(packageName)) return packageName;
  return "Package delivery";
}

export type CartItemRowProps = {
  item: CartItemView;
  busy: boolean;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
};

export function CartItemRow({
  item,
  busy,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const media = resolveProductMedia({
    gameSlug: item.gameSlug,
    productName: item.package.name,
  });

  return (
    <article
      className={`rounded-lg border border-white/[0.08] bg-[#0d0f16] p-4 sm:p-5 ${
        busy ? "opacity-60" : ""
      }`}
      aria-busy={busy}
    >
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#151923]">
          <ResilientImage
            sources={media.sources}
            alt={media.alt}
            fallbackLabel={item.package.name.slice(0, 2).toUpperCase()}
            fill
            sizes="80px"
            className="object-contain p-2"
            fallbackClassName="absolute inset-0 h-full w-full"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {itemContextLabel(item)}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white sm:text-[15px]">
                {item.package.name}
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                <DisplayPrice amountInrMinor={item.package.amountInPaise} />{" "}
                <span className="font-medium text-slate-600">each</span>
              </p>
              <p className="mt-2 text-[11px] font-semibold text-emerald-300">
                Delivers {deliveredAmountLabel(item.package.name)}
                {item.quantity > 1 ? ` · ${item.quantity} packages` : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.package.name} from cart`}
              className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 text-[11px] font-semibold text-slate-500 transition duration-150 ease-out hover:border-rose-400/25 hover:bg-rose-400/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 7.5h14M9.5 7.5V5.8A1.3 1.3 0 0 1 10.8 4.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M7 7.5l.8 11a1.6 1.6 0 0 0 1.6 1.5h5.2a1.6 1.6 0 0 0 1.6-1.5l.8-11" />
              </svg>
              Remove
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="sr-only" id={`qty-${item.id}`}>
                Quantity of {item.package.name}
              </label>
              <div
                aria-labelledby={`qty-${item.id}`}
                className="flex items-center rounded-lg border border-white/[0.08] bg-black/20"
              >
                <button
                  type="button"
                  disabled={busy || item.quantity <= 1}
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  aria-label={`Decrease quantity of ${item.package.name}`}
                  className="grid min-h-9 min-w-9 place-items-center rounded-l-lg text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M5.5 12h13" />
                  </svg>
                </button>
                <span className="min-w-8 text-center text-sm font-semibold text-white">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  disabled={busy || item.quantity >= CART_MAX_QUANTITY}
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  aria-label={`Increase quantity of ${item.package.name}`}
                  className="grid min-h-9 min-w-9 place-items-center rounded-r-lg text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5.5v13M5.5 12h13" />
                  </svg>
                </button>
              </div>
              <span className="text-[11px] text-slate-600">
                Max {CART_MAX_QUANTITY}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-right text-[11px] text-slate-600">
                Line total
                <strong
                  aria-live="polite"
                  className="block text-base font-semibold text-white"
                >
                  <DisplayPrice amountInrMinor={lineTotalInPaise(item)} />
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}