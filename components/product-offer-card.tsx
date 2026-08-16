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
      className={`group relative min-h-[16rem] overflow-hidden rounded-[1.35rem] border text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
        selected
          ? "border-violet-300/80 bg-violet-400/[0.12] shadow-[0_0_0_1px_rgba(196,181,253,0.28),0_24px_70px_rgba(76,29,149,0.28)]"
          : "border-white/10 bg-[#0d0d16] hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_24px_70px_rgba(0,0,0,0.32)]"
      }`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_75%_0%,rgba(139,92,246,0.18),transparent_40%)]" />

      <span className="relative block aspect-[16/10] overflow-hidden border-b border-white/10 bg-black/30">
        <ResilientImage
          sources={item.media.sources}
          alt={item.media.alt}
          fallbackLabel="ML"
          className="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-[1.045]"
          fallbackClassName="h-full w-full"
        />
        <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0d0d16] to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/75 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-300 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.85)]" aria-hidden="true" />
          {item.media.source === "supplier" ? "Live offer" : "Official item"}
        </span>
        {badge ? (
          <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] backdrop-blur-md ${badgeClass}`}>
            <span aria-hidden="true">{badge.tone === "rose" ? "✦" : badge.tone === "emerald" ? "◆" : "↗"}</span>
            {badge.label}
          </span>
        ) : null}
      </span>

      <span className="relative flex min-h-[9.5rem] flex-col p-4">
        <span className="line-clamp-2 min-h-10 text-[15px] font-bold leading-5 tracking-[-0.015em] text-white">
          {quantity.bonus ? <><span>{quantity.base}</span> <span className="font-black text-emerald-300 drop-shadow-[0_0_12px_rgba(110,231,183,0.24)]">{quantity.bonus}</span></> : item.name}
        </span>
        <span className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
          {item.deliveryLabel}
        </span>
        <span className="mt-auto pt-4">
          <span className="block text-xl font-black tracking-[-0.03em] text-white">
            {displayPrice}
          </span>
          {settlementPrice ? (
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
              Settlement {settlementPrice}
            </span>
          ) : null}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`absolute bottom-3 right-3 grid h-7 w-7 place-items-center rounded-full border text-xs transition ${
          selected
            ? "border-violet-300/40 bg-violet-300 text-slate-950"
            : "border-white/10 bg-white/5 text-slate-500 group-hover:text-white"
        }`}
      >
        {selected ? "✓" : "+"}
      </span>
    </button>
  );
}
