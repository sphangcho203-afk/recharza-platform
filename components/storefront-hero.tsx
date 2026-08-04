"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StorefrontArtwork } from "@/components/storefront-artwork";
import type { StorefrontArtworkKey } from "@/lib/storefront-artwork";
import type { StorefrontContent } from "@/lib/storefront-content";

type HeroSlide = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  artwork: StorefrontArtworkKey[];
};

const fallbackSources: string[] = [];

const extraSlides: HeroSlide[] = [
  {
    eyebrow: "One controlled checkout",
    title: "Choose the game.",
    accent: "Keep the whole flow together.",
    description:
      "Player details, billing, order creation, payment, and private tracking stay connected.",
    artwork: [
      "genshin-impact",
      "fortnite",
      "valorant",
      "mobile-legends-malaysia",
    ],
  },
  {
    eyebrow: "Regional catalogues",
    title: "The right product.",
    accent: "For the right account market.",
    description:
      "Regional Mobile Legends entries sit beside the rest of the catalogue instead of taking over the store.",
    artwork: [
      "bgmi",
      "pubg-mobile",
      "free-fire",
      "mobile-legends-philippines",
    ],
  },
];

function artworkClasses(index: number) {
  const base =
    "absolute overflow-hidden rounded-2xl border border-white/10 bg-[#101321] shadow-2xl shadow-black/30";

  if (index === 0) {
    return `${base} inset-y-5 right-[38%] w-[34%] rotate-[-2deg] sm:right-[36%]`;
  }
  if (index === 1) {
    return `${base} inset-y-0 right-[18%] w-[32%] rotate-[1.5deg]`;
  }
  if (index === 2) {
    return `${base} inset-y-7 right-[-1%] w-[31%] rotate-[3deg]`;
  }
  return `${base} bottom-[-9%] right-[22%] h-[52%] w-[29%] rotate-[-4deg] opacity-80`;
}

export function StorefrontHero({
  content,
}: {
  content: StorefrontContent["hero"];
}) {
  const slides: HeroSlide[] = [
    {
      eyebrow: content.eyebrow,
      title: content.title,
      accent: content.accent,
      description: content.description,
      artwork: [
        "mobile-legends-india",
        "free-fire",
        "pubg-mobile",
        "call-of-duty-mobile",
      ],
    },
    ...extraSlides,
  ];
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[activeSlide];

  function showPrevious() {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNext() {
    setActiveSlide((current) => (current + 1) % slides.length);
  }

  return (
    <section className="border-b border-white/10 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative isolate min-h-[27rem] overflow-hidden rounded-3xl border border-white/10 bg-[#090d18] shadow-[0_28px_90px_rgba(0,0,0,0.36)] sm:min-h-[25rem] lg:min-h-[27rem]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(84,79,255,0.24),transparent_36%),radial-gradient(circle_at_95%_80%,rgba(0,209,255,0.13),transparent_34%)]" />
            <div className="absolute inset-y-0 right-0 w-full opacity-45 sm:w-[72%] sm:opacity-90">
              {slide.artwork.map((artworkKey, index) => (
                <div key={`${activeSlide}-${artworkKey}`} className={artworkClasses(index)}>
                  <StorefrontArtwork
                    artworkKey={artworkKey}
                    sources={fallbackSources}
                    alt="Featured game artwork"
                    fallbackLabel="Game"
                    loading={index === 0 ? "eager" : "lazy"}
                    className="h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.04]" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,18,0.99)_0%,rgba(7,10,18,0.96)_38%,rgba(7,10,18,0.68)_62%,rgba(7,10,18,0.22)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,10,18,0.6),transparent_48%)] sm:hidden" />
          </div>

          <div className="relative z-10 flex min-h-[27rem] max-w-2xl flex-col justify-center px-5 py-14 sm:min-h-[25rem] sm:px-8 lg:min-h-[27rem] lg:px-12">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-cyan-100 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              {slide.eyebrow}
            </div>
            <h1 className="mt-5 max-w-xl text-3xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
              {slide.title}
              <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                {slide.accent}
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300/80 sm:text-base sm:leading-7">
              {slide.description}
            </p>
            <div className="mt-6 flex flex-col gap-2 min-[390px]:flex-row">
              <Link
                href={content.primaryCtaHref}
                className="min-h-11 rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {content.primaryCtaLabel}
              </Link>
              <Link
                href={content.secondaryCtaHref}
                className="min-h-11 rounded-xl border border-white/12 bg-black/25 px-4 py-3 text-center text-sm font-bold text-white backdrop-blur transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {content.secondaryCtaLabel}
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous promotion"
            className="absolute bottom-4 right-16 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/45 text-lg text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Next promotion"
            className="absolute bottom-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/45 text-lg text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            ›
          </button>

          <div className="absolute bottom-5 left-5 z-20 flex gap-1.5 sm:left-8 lg:left-12" aria-label="Promotion slides">
            {slides.map((item, index) => (
              <button
                key={item.eyebrow}
                type="button"
                aria-label={`Show promotion ${index + 1}`}
                aria-current={index === activeSlide ? "true" : undefined}
                onClick={() => setActiveSlide(index)}
                className={`h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                  index === activeSlide ? "w-7 bg-violet-300" : "w-2 bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link
            href="/account"
            className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 transition hover:border-violet-300/25 hover:bg-violet-300/[0.05]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">Account access</p>
            <p className="mt-1 text-sm font-black text-white">Create, sign in, and recover securely</p>
          </Link>
          <Link
            href="/games/mobile-legends/india"
            className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.05]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">Guest checkout</p>
            <p className="mt-1 text-sm font-black text-white">Buy without forcing an account detour</p>
          </Link>
          <Link
            href="/track-order"
            className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 transition hover:border-emerald-300/25 hover:bg-emerald-300/[0.05]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">Private tracking</p>
            <p className="mt-1 text-sm font-black text-white">Follow order and payment updates</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
