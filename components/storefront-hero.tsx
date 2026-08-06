import Link from "next/link";

import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { StorefrontContent } from "@/lib/storefront-content";

const trustPoints = [
  {
    icon: "receipt" as const,
    title: "Clear pricing",
    detail: "See the order amount before payment.",
  },
  {
    icon: "shield" as const,
    title: "Protected checkout",
    detail: "Player and billing details are validated first.",
  },
  {
    icon: "support" as const,
    title: "Human support",
    detail: "Use your order ID when you need help.",
  },
];

export function StorefrontHero({ content }: { content: StorefrontContent["hero"] }) {
  return (
    <section className="relative px-4 pb-10 pt-5 sm:px-6 sm:pb-12 sm:pt-7 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-[-9rem] -z-10 h-[36rem] overflow-hidden">
        <div className="storefront-ambient-grid absolute inset-0 opacity-30" />
        <div className="absolute left-[4%] top-20 h-72 w-72 rounded-full bg-violet-600/14 blur-[120px]" />
        <div className="absolute right-[2%] top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <Link
          href={content.primaryCtaHref}
          className="group relative block min-h-[25rem] overflow-hidden rounded-[1.6rem] border border-white/[0.1] bg-[#0a0c14] shadow-[0_30px_90px_rgba(0,0,0,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-h-0 sm:aspect-[3/1]"
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
            className="absolute inset-0 h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.02]"
            fallbackClassName="absolute inset-0 h-full w-full"
            objectPosition="center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060b] via-[#05060b]/30 to-transparent sm:bg-gradient-to-r sm:from-[#05060b]/95 sm:via-[#05060b]/52 sm:to-transparent" />

          <div className="absolute inset-0 flex max-w-3xl flex-col justify-end p-6 sm:justify-center sm:p-9 lg:p-12">
            <h1 className="max-w-2xl text-[clamp(2rem,8vw,4rem)] font-black leading-[0.98] tracking-[-0.055em] text-white">
              {content.title}
              <span className="mt-1 block text-cyan-100">{content.accent}</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              {content.description}
            </p>
            <span className="mt-6 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition group-hover:bg-cyan-50">
              {content.primaryCtaLabel}
              <StorefrontIcon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200">
                <StorefrontIcon name={point.icon} className="h-[18px] w-[18px]" />
              </span>
              <span>
                <strong className="block text-sm text-white">{point.title}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{point.detail}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
