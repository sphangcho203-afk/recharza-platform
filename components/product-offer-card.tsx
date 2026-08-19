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
    ? "border-rose-300/30 bg-rose-400/[0.16] text-rose-100 shadow-[0_8px_24px_rgba(244,63,94,0.18)]"
    : badge?.tone === "emerald"
      ? "border-emerald-300/30 bg-emerald-400/[0.14] text-emerald-100 shadow-[0_8px_24px_rgba(16,185,129,0.16)]"
      : "border-violet-300/30 bg-violet-400/[0.16] text-violet-100 shadow-[0_8px_24px_rgba(139,92,246,0.18)]";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`recharza-bleed-card group relative min-h-[16rem] w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
        selected
          ? "border-violet-300/70 shadow-[0_0_0_1px_rgba(196,181,253,0.28),0_24px_70px_rgba(76,29,149,0.28)]"
          : ""
      }`}
    >
      {/* Artwork bleeds to the card edges — no inset padding. */}
      <span className="recharza-bleed-media block aspect-[16/10] bg-black/25">
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
            className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] transition ${
              selected
                ? "border-violet-300/50 bg-violet-400 text-slate-950 shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                : "border-white/15 bg-black/45 text-white/70 backdrop-blur-sm"
            }`}
          >
            {selected ? "✓" : "+"}
          </span>
        </span>
      </span>

      {/* Distinct lower strip: title on body tint, price + CTA on its own tinted base. */}
      <span className="recharza-bleed-strip flex min-h-[8.5rem] flex-col gap-1.5">
        <span className="line-clamp-2 min-h-10 text-[15px] font-semibold leading-5 tracking-[-0.015em] text-white">
          {quantity.bonus ? <><span>{quantity.base}</span> <span className="font-semibold text-emerald-300">{quantity.plus} {quantity.bonus}</span></> : item.name}
        </span>
        <span className="line-clamp-2 text-[11px] leading-4 text-slate-500">
          {item.deliveryLabel}
        </span>
        <span className="mt-auto flex items-end justify-between gap-3 pt-3">
          <span>
            <span className="block text-xl font-semibold tracking-[-0.03em] text-white">{displayPrice}</span>
            {settlementPrice ? (
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
                Settlement {settlementPrice}
              </span>
            ) : null}
          </span>
          <span
            aria-hidden="true"
            className="inline-flex min-h-9 items-center rounded-md bg-violet-500 px-3 text-xs font-semibold text-white transition-colors duration-200 group-hover:bg-violet-400"
          >
            Select
          </span>
        </span>
      </span>
    </button>
  );
}
