import Link from "next/link";

import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { StorefrontContent } from "@/lib/storefront-content";

const trustPoints = [
  { icon: "receipt" as const, label: "Published prices" },
  { icon: "shield" as const, label: "Account checkout" },
  { icon: "support" as const, label: "Order support" },
];

export function StorefrontHero({
  content,
}: {
  content: StorefrontContent["hero"];
}) {
  return (
    <section className="relative px-4 pb-7 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href={content.primaryCtaHref}
          className="group relative block min-h-[18rem] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0c14] shadow-[0_24px_70px_rgba(0,0,0,0.45)] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-h-0 sm:aspect-[3/1]"
        >
          <StorefrontArtwork
            artworkKey="mobile-legends-india"
            sources={[
              "https://play-lh.googleusercontent.com/D8r13ijO9c-0_1N-CP4d63mR1w6YhDuR2mBQUl27ELJAx0sKdaKtM5vCUnSLODKBVzUx7rZ9cW4Ir9jYiufsSQ=w960-h960",
              "https://upload.wikimedia.org/wikipedia/en/8/86/Mobile_Legends_Bang_Bang.jpg",
              "/assets/founder/mobile-legends.svg",
            ]}
            alt="Mobile Legends regional top-up catalogue"
            fallbackLabel="Mobile Legends"
            priority
            loading="eager"
            sizes="(max-width: 640px) 100vw, 1280px"
            className="absolute inset-0 h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.015]"
            fallbackClassName="absolute inset-0 h-full w-full"
            objectPosition="center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060b] via-[#05060b]/32 to-transparent sm:bg-gradient-to-r sm:from-[#05060b]/94 sm:via-[#05060b]/48 sm:to-transparent" />

          <div className="absolute inset-0 flex max-w-2xl flex-col justify-end p-5 sm:justify-center sm:p-8 lg:p-10">
            <h1 className="max-w-xl text-3xl font-black leading-[1] tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
              {content.title}
              <span className="mt-1 block text-cyan-100">{content.accent}</span>
            </h1>
            <p className="mt-3 max-w-lg text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
              {content.description}
            </p>
            <span className="mt-4 inline-flex min-h-10 w-fit items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-950 transition group-hover:bg-cyan-50">
              {content.primaryCtaLabel}
              <StorefrontIcon name="arrow" className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>

        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
          {trustPoints.map((point, index) => (
            <div
              key={point.label}
              className={`flex min-h-12 items-center justify-center gap-1.5 px-2 text-center text-[9px] font-black text-slate-400 sm:text-xs ${
                index > 0 ? "border-l border-white/[0.07]" : ""
              }`}
            >
              <StorefrontIcon
                name={point.icon}
                className="h-3.5 w-3.5 shrink-0 text-cyan-300"
              />
              <span>{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
