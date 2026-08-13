import { PromoCarousel } from "@/components/promo-carousel";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { StorefrontContent } from "@/lib/storefront-content";

const trustPoints = [
  { icon: "receipt" as const, label: "Transparent pricing" },
  { icon: "shield" as const, label: "Verified destinations" },
  { icon: "support" as const, label: "Human support" },
];

export function StorefrontHero({
  content: _content,
  imageUrl: _imageUrl,
  imageAlt: _imageAlt,
}: {
  content: StorefrontContent["hero"];
  imageUrl?: string | null;
  imageAlt?: string;
}) {
  return (
    <section className="px-4 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <PromoCarousel />
        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0d14] shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
          {trustPoints.map((point, index) => (
            <div key={point.label} className={`flex min-h-14 items-center justify-center gap-2 px-3 text-center text-[10px] font-black text-slate-400 sm:text-xs ${index > 0 ? "border-l border-white/[0.07]" : ""}`}>
              <StorefrontIcon name={point.icon} className="h-4 w-4 shrink-0 text-violet-300" />
              <span>{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
