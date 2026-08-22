"use client";

import { ResilientImage } from "@/components/resilient-image";
import type { MobileLegendsPackage } from "@/lib/mobile-legends";
import { getMerchandisingBadge, splitBonusQuantity } from "@/lib/commerce/merchandising";

type ProductOfferCardProps = {
  item: MobileLegendsPackage;
  selected: boolean;
  displayPrice: string;
  settlementPrice?: string;
  onSelect: () => void;
};

export function ProductOfferCard({
  item,
  selected,
  displayPrice,
  settlementPrice,
  onSelect,
}: ProductOfferCardProps) {
  const badge = getMerchandisingBadge(item);
  const quantity = splitBonusQuantity(item.name);
  const badgeClass = badge?.tone === "rose"
    ? "border-rose-100 bg-rose-50 text-rose-600"
    : badge?.tone === "emerald"
      ? "border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm"
      : "border-violet-100 bg-violet-50 text-violet-600 shadow-sm";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`recharza-bleed-card group relative min-h-[16rem] w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 transition-all duration-300 ${
        selected
          ? "border-violet-600 bg-violet-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg"
      }`}
    >
      {/* Artwork bleeds to the card edges — no inset padding. */}
      <span className="recharza-bleed-media block aspect-[16/10] bg-slate-100">
        <ResilientImage
          sources={item.media.sources}
          alt={item.media.alt}
          fallbackLabel="ML"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.045]"
          fallbackClassName="h-full w-full object-cover"
        />
        <span className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
          {badge ? (
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide backdrop-blur-sm ${badgeClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {badge.label}
            </span>
          ) : <span aria-hidden="true" className="grow" />}
          <span
            aria-hidden="true"
            className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] transition-all ${
              selected
                ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                : "border-white/40 bg-black/20 text-white backdrop-blur-md group-hover:bg-violet-600 group-hover:border-violet-600"
            }`}
          >
            {selected ? "✓" : "+"}
          </span>
        </span>
      </span>

      {/* Distinct lower strip: title on body tint, price + CTA on its own tinted base. */}
      <span className="recharza-bleed-strip flex min-h-[8.5rem] flex-col gap-1.5 p-4">
        <span className="line-clamp-2 min-h-10 text-[15px] font-semibold leading-5 tracking-[-0.015em] text-slate-900">
          {quantity.bonus ? <><span>{quantity.base}</span> <span className="font-semibold text-emerald-600">{quantity.plus} {quantity.bonus}</span></> : item.name}
        </span>
        <span className="line-clamp-2 text-[11px] leading-4 text-slate-500 font-medium">
          {item.deliveryLabel}
        </span>
        <span className="mt-auto flex items-end justify-between gap-3 pt-3">
          <span>
            <span className="block text-xl font-semibold tracking-[-0.03em] text-slate-900">{displayPrice}</span>
            {settlementPrice ? (
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Settlement {settlementPrice}
              </span>
            ) : null}
          </span>
          <span
            aria-hidden="true"
            className={`inline-flex min-h-9 items-center rounded-md px-3 text-xs font-semibold transition-all duration-200 ${
              selected 
                ? "bg-violet-600 text-white shadow-sm" 
                : "bg-slate-100 text-slate-600 group-hover:bg-violet-600 group-hover:text-white"
            }`}
          >
            Select
          </span>
        </span>
      </span>
    </button>
  );
}
