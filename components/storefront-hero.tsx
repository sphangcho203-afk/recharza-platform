import Link from "next/link";

import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { StorefrontContent } from "@/lib/storefront-content";

const trustPoints = [
  { icon: "receipt" as const, label: "Transparent pricing" },
  { icon: "shield" as const, label: "Secure checkout" },
  { icon: "support" as const, label: "24/7 support" },
];

export function StorefrontHero({
  content,
  imageUrl,
  imageAlt,
}: {
  content: StorefrontContent["hero"];
  imageUrl?: string | null;
  imageAlt?: string;
}) {
  const sources = imageUrl
    ? [imageUrl]
    : [
        "https://play-lh.googleusercontent.com/D8r13ijO9c-0_1N-CP4d63mR1w6YhDuR2mBQUl27ELJAx0sKdaKtM5vCUnSLODKBVzUx7rZ9cW4Ir9jYiufsSQ=w960-h960",
        "https://upload.wikimedia.org/wikipedia/en/8/86/Mobile_Legends_Bang_Bang.jpg",
        "/assets/founder/mobile-legends.svg",
      ];

  return (
    <section className="px-4 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-[#0b0d14] shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
          <div className="grid min-h-[22rem] lg:grid-cols-[0.92fr_1.08fr] lg:min-h-[24rem]">
            <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-9 lg:px-12">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/90">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]" /> Digital goods, delivered with confidence
              </div>
              <h1 className="max-w-xl text-4xl font-black leading-[0.96] tracking-[-0.06em] text-white sm:text-5xl lg:text-[3.8rem]">
                {content.title}
                <span className="block text-violet-400">{content.accent}</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400 sm:text-[15px]">
                {content.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={content.primaryCtaHref}
                  className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-400"
                >
                  {content.primaryCtaLabel}
                  <StorefrontIcon name="arrow" className="h-4 w-4" />
                </Link>
                <Link
                  href="/orders/lookup"
                  className="inline-flex min-h-12 items-center rounded-xl border border-white/[0.1] bg-white/[0.025] px-5 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
                >
                  Track order
                </Link>
              </div>
            </div>

            <Link
              href={content.primaryCtaHref}
              aria-label={content.primaryCtaLabel}
              className="relative min-h-[18rem] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-violet-400 lg:min-h-0"
            >
              <StorefrontArtwork
                artworkKey="mobile-legends-india"
                sources={sources}
                alt={imageAlt ?? "Recharza game top-up storefront"}
                fallbackLabel="Recharza"
                priority
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="absolute inset-0 h-full w-full"
                fallbackClassName="absolute inset-0 h-full w-full"
                objectPosition="center"
                objectFit="cover"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-32 bg-gradient-to-r from-[#0b0d14] to-transparent lg:block" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0b0d14]/80 to-transparent lg:hidden" />
            </Link>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0d14] shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
          {trustPoints.map((point, index) => (
            <div
              key={point.label}
              className={`flex min-h-14 items-center justify-center gap-2 px-3 text-center text-[10px] font-black text-slate-400 sm:text-xs ${
                index > 0 ? "border-l border-white/[0.07]" : ""
              }`}
            >
              <StorefrontIcon name={point.icon} className="h-4 w-4 shrink-0 text-violet-300" />
              <span>{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
