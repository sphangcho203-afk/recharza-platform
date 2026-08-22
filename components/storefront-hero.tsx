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
        <div className="mt-4 grid grid-cols-3 gap-3">
          {trustPoints.map((point) => (
            <div key={point.label} className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 text-center shadow-sm transition-all duration-300 hover:border-violet-200 hover:shadow-md sm:flex-row sm:gap-2.5 sm:p-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-50 text-violet-600 shadow-sm ring-1 ring-violet-100/50">
                <StorefrontIcon name={point.icon} className="h-4 w-4 shrink-0" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 sm:text-[11px]">{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
