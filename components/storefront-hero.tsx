import Link from "next/link";

import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { StorefrontArtworkKey } from "@/lib/storefront-artwork";
import type { StorefrontContent } from "@/lib/storefront-content";

type PromoSlide = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  artworkKey: StorefrontArtworkKey;
  sources: string[];
  alt: string;
  accentClass: string;
};

const trustPoints = [
  { icon: "receipt" as const, label: "Fast fulfilment" },
  { icon: "shield" as const, label: "Protected payments" },
  { icon: "support" as const, label: "Customer support" },
];

export function StorefrontHero({
  content,
}: {
  content: StorefrontContent["hero"];
}) {
  const slides: PromoSlide[] = [
    {
      eyebrow: content.eyebrow,
      title: `${content.title} ${content.accent}`,
      description: content.description,
      href: content.primaryCtaHref,
      cta: content.primaryCtaLabel,
      artworkKey: "mobile-legends-india",
      sources: ["/assets/founder/mobile-legends.svg"],
      alt: "Mobile Legends regional top-up promotion",
      accentClass: "from-violet-700/90 via-indigo-700/45",
    },
    {
      eyebrow: "Featured top-up",
      title: "Free Fire MAX diamonds and memberships.",
      description: "Choose a published offer and review the exact player destination before payment.",
      href: "/games/free-fire",
      cta: "Browse Free Fire",
      artworkKey: "free-fire",
      sources: ["/assets/founder/free-fire.svg"],
      alt: "Free Fire MAX top-up promotion",
      accentClass: "from-amber-700/90 via-orange-700/40",
    },
    {
      eyebrow: "Curated catalogue",
      title: "PUBG Mobile UC through a recoverable order flow.",
      description: "Live offers, clear market labels, protected order creation and private tracking.",
      href: "/games/pubg-mobile",
      cta: "Browse PUBG Mobile",
      artworkKey: "pubg-mobile",
      sources: ["/assets/founder/pubg-mobile.svg"],
      alt: "PUBG Mobile UC top-up promotion",
      accentClass: "from-sky-800/90 via-cyan-700/35",
    },
  ];

  return (
    <section className="relative px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-7 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-[-10rem] -z-10 h-[32rem] overflow-hidden">
        <div className="storefront-ambient-grid absolute inset-0 opacity-35" />
        <div className="absolute left-[8%] top-12 h-72 w-72 rounded-full bg-violet-600/12 blur-[120px]" />
        <div className="absolute right-[4%] top-6 h-72 w-72 rounded-full bg-cyan-500/9 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div
          aria-label="Recharza promotions"
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, index) => (
            <Link
              key={slide.href}
              href={slide.href}
              className="group relative aspect-[16/9] w-[92%] min-w-[92%] snap-center overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b0d16] shadow-[0_24px_70px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:aspect-[3/1] sm:w-full sm:min-w-full"
            >
              <StorefrontArtwork
                artworkKey={slide.artworkKey}
                sources={slide.sources}
                alt={slide.alt}
                fallbackLabel={slide.title}
                loading={index === 0 ? "eager" : "lazy"}
                priority={index === 0}
                sizes="(max-width: 640px) 92vw, 1280px"
                className="absolute inset-0 h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
                fallbackClassName="absolute inset-0 h-full w-full"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.accentClass} to-transparent`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05060b]/90 via-[#05060b]/15 to-transparent sm:bg-gradient-to-r sm:from-[#05060b]/90 sm:via-[#05060b]/38 sm:to-transparent" />

              <div className="absolute inset-0 flex max-w-3xl flex-col justify-end p-5 sm:justify-center sm:p-8 lg:p-10">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200 sm:text-[10px]">
                  {slide.eyebrow}
                </p>
                <h1 className="mt-2 max-w-2xl text-2xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-3xl lg:text-4xl">
                  {slide.title}
                </h1>
                <p className="mt-2 hidden max-w-xl text-sm leading-6 text-slate-300/85 sm:line-clamp-2 sm:block">
                  {slide.description}
                </p>
                <span className="mt-4 inline-flex min-h-10 w-fit items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-950 transition group-hover:bg-cyan-50">
                  {slide.cta}
                  <StorefrontIcon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>

              <span className="absolute right-4 top-4 rounded-full border border-white/[0.12] bg-black/45 px-2.5 py-1 font-mono text-[9px] font-black text-white/75 backdrop-blur-xl">
                {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          {trustPoints.map((point, index) => (
            <div
              key={point.label}
              className={`flex min-h-16 items-center justify-center gap-2 px-2 text-center text-[10px] font-black text-slate-300 sm:min-h-14 sm:text-xs ${
                index > 0 ? "border-l border-white/[0.07]" : ""
              }`}
            >
              <StorefrontIcon name={point.icon} className="h-4 w-4 shrink-0 text-cyan-300" />
              <span>{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
