import Link from "next/link";

import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { StorefrontArtworkKey } from "@/lib/storefront-artwork";
import type { StorefrontContent } from "@/lib/storefront-content";

const mobileLegendsArtwork = [
  "https://play-lh.googleusercontent.com/D8r13ijO9c-0_1N-CP4d63mR1w6YhDuR2mBQUl27ELJAx0sKdaKtM5vCUnSLODKBVzUx7rZ9cW4Ir9jYiufsSQ=w960-h960",
  "https://upload.wikimedia.org/wikipedia/en/8/86/Mobile_Legends_Bang_Bang.jpg",
];

const supportingArtwork: Array<{
  key: StorefrontArtworkKey;
  label: string;
  detail: string;
  href: string;
  sources: string[];
}> = [
  {
    key: "free-fire",
    label: "Free Fire MAX",
    detail: "Diamonds & memberships",
    href: "/games/free-fire",
    sources: ["/assets/games/free-fire/cover.webp"],
  },
  {
    key: "pubg-mobile",
    label: "PUBG Mobile",
    detail: "UC & passes",
    href: "/games/pubg-mobile",
    sources: ["/assets/games/pubg-mobile/cover.webp"],
  },
  {
    key: "valorant",
    label: "VALORANT",
    detail: "Points catalogue",
    href: "/games/valorant",
    sources: ["https://upload.wikimedia.org/wikipedia/en/b/ba/Valorant_cover.jpg"],
  },
];

const trustPoints = [
  { icon: "globe" as const, label: "Correct market" },
  { icon: "receipt" as const, label: "Price before payment" },
  { icon: "shield" as const, label: "Private tracking" },
];

export function StorefrontHero({
  content,
}: {
  content: StorefrontContent["hero"];
}) {
  return (
    <section className="relative overflow-hidden px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8 lg:pb-16 lg:pt-14">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="storefront-ambient-grid absolute inset-x-0 top-[-6rem] h-[38rem] opacity-55" />
        <div className="storefront-orb absolute left-[-12rem] top-0 h-[25rem] w-[25rem] rounded-full bg-violet-600/14 blur-[120px]" />
        <div className="storefront-orb absolute right-[-10rem] top-[-2rem] h-[27rem] w-[27rem] rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(29rem,1.18fr)] lg:gap-12 xl:gap-16">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 sm:text-[11px]">
              <span className="h-px w-7 bg-gradient-to-r from-cyan-300 to-violet-400" />
              {content.eyebrow}
            </div>

            <h1 className="mt-5 text-[clamp(2.55rem,10vw,5.4rem)] font-black leading-[0.94] tracking-[-0.065em] text-white">
              <span className="block">{content.title}</span>
              <span className="mt-1 block bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
                {content.accent}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[0.95rem] leading-7 text-slate-400 sm:text-lg sm:leading-8">
              {content.description}
            </p>

            <div className="mt-7 grid gap-3 min-[430px]:grid-cols-2 lg:flex">
              <Link
                href={content.primaryCtaHref}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {content.primaryCtaLabel}
                <StorefrontIcon name="arrow" className="h-[17px] w-[17px] transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={content.secondaryCtaHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.11] bg-white/[0.035] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-violet-300/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <StorefrontIcon name="games" className="h-[17px] w-[17px] text-violet-300" />
                {content.secondaryCtaLabel}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/[0.08] pt-5">
              {trustPoints.map((point) => (
                <span key={point.label} className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 sm:text-xs">
                  <StorefrontIcon name={point.icon} className="h-4 w-4 text-cyan-300" />
                  {point.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
            <div className="storefront-panel relative aspect-[16/11] overflow-hidden rounded-[1.5rem] border border-white/[0.1] bg-[#0a0d17] shadow-[0_35px_90px_rgba(0,0,0,0.5)] sm:aspect-[16/9] lg:aspect-[5/4] lg:rounded-[2rem]">
              <StorefrontArtwork
                artworkKey="mobile-legends-india"
                sources={mobileLegendsArtwork}
                alt="Mobile Legends India storefront artwork"
                fallbackLabel="Mobile Legends"
                loading="eager"
                className="absolute inset-0 h-full w-full scale-[1.01]"
                fallbackClassName="absolute inset-0 h-full w-full"
                objectPosition="center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,13,0.02)_0%,rgba(3,6,13,0.16)_45%,rgba(3,6,13,0.96)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,13,0.22),transparent_58%)]" />

              <div className="absolute left-3 top-3 rounded-xl border border-white/[0.12] bg-black/55 px-3 py-2 backdrop-blur-xl sm:left-5 sm:top-5 sm:rounded-2xl sm:px-4 sm:py-3">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-cyan-200 sm:text-[9px]">
                  Featured checkout
                </p>
                <p className="mt-1 text-xs font-black text-white sm:text-sm">🇮🇳 Mobile Legends · India</p>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200 sm:text-[10px]">
                  Market → Player → Pack → Payment
                </p>
                <h2 className="mt-2 max-w-lg text-xl font-black tracking-[-0.035em] text-white sm:text-2xl lg:text-3xl">
                  One purchase path. No region guessing.
                </h2>
                <Link
                  href="/games/mobile-legends"
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.13] bg-black/50 px-3.5 text-xs font-black text-white backdrop-blur transition hover:bg-white hover:text-slate-950"
                >
                  View MLBB markets
                  <StorefrontIcon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:absolute lg:-bottom-8 lg:left-6 lg:right-6">
              {supportingArtwork.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group relative aspect-[16/10] w-[72%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0d101a] shadow-[0_14px_38px_rgba(0,0,0,0.42)] transition hover:-translate-y-1 hover:border-cyan-300/25 sm:w-auto"
                >
                  <StorefrontArtwork
                    artworkKey={item.key}
                    sources={item.sources}
                    alt={`${item.label} game artwork`}
                    fallbackLabel={item.label}
                    className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.04]"
                    fallbackClassName="absolute inset-0 h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="truncate text-xs font-black text-white">{item.label}</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">{item.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] sm:grid-cols-3 lg:mt-16">
          {[
            { href: "/games/mobile-legends", icon: "games" as const, eyebrow: "Top up", label: "Choose an MLBB market", tone: "text-violet-200" },
            { href: "/orders/lookup", icon: "track" as const, eyebrow: "Track", label: "Open a private order", tone: "text-cyan-200" },
            { href: "/account", icon: "account" as const, eyebrow: "Account", label: "Sign in and view orders", tone: "text-emerald-200" },
          ].map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-h-[5.25rem] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.04] ${index < 2 ? "border-b border-white/[0.07] sm:border-b-0 sm:border-r" : ""}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] ${item.tone}`}>
                <StorefrontIcon name={item.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-black uppercase tracking-[0.17em] text-slate-500">{item.eyebrow}</span>
                <span className="mt-1 block text-sm font-black text-white">{item.label}</span>
              </span>
              <StorefrontIcon name="arrow" className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
