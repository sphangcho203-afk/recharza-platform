"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";

const slides = [
  {
    eyebrow: "Golden Month · India",
    title: "Top up your squad before the next match.",
    description: "A focused India market experience with clear packs, verified player IDs, and fast delivery.",
    href: "/games/mobile-legends/india",
    cta: "Shop MLBB India",
    image: "/assets/user-supplied-v2/1000166202.jpg",
    accent: "from-amber-300/90 to-orange-500/90",
  },
  {
    eyebrow: "Recharza promise",
    title: "Fast delivery. Fewer surprises.",
    description: "See the market, package, and final display currency before you confirm your order.",
    href: "/#how-it-works",
    cta: "See how it works",
    image: "/assets/user-supplied-v2/1000166215.jpg",
    accent: "from-cyan-300/90 to-violet-400/90",
  },
  {
    eyebrow: "Built for every region",
    title: "Your game, your market, your currency.",
    description: "Choose a regional tile once and continue through a checkout designed for that exact destination.",
    href: "/#games",
    cta: "Browse the catalogue",
    image: "/assets/user-supplied-v2/1000166213.jpg",
    accent: "from-violet-300/90 to-fuchsia-400/90",
  },
];

export function PromoCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.1] bg-[#0d101a] shadow-[0_28px_90px_rgba(49,22,94,0.24)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(139,92,246,0.24),transparent_42%),linear-gradient(120deg,#090b13,#11152a)]" />
      <div className="relative grid min-h-[20rem] lg:grid-cols-[1.03fr_0.97fr]">
        <div className="relative z-10 flex flex-col justify-center px-6 py-9 sm:px-9 lg:px-12">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.055] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-slate-200">
            <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${slide.accent}`} />
            {slide.eyebrow}
          </div>
          <h1 className="max-w-xl text-4xl font-black leading-[0.97] tracking-[-0.06em] text-white sm:text-5xl lg:text-[3.6rem]">{slide.title}</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400 sm:text-[15px]">{slide.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href={slide.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#0b0d14] shadow-[0_14px_30px_rgba(255,255,255,0.1)] transition hover:-translate-y-0.5 hover:bg-slate-100">
              {slide.cta}<StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-200/80"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Systems online</span>
          </div>
          <div className="mt-7 flex items-center gap-2" aria-label="Promotional slides">
            {slides.map((item, index) => <button key={item.eyebrow} type="button" aria-label={`Show promotion ${index + 1}`} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? "w-9 bg-violet-300" : "w-2.5 bg-white/20 hover:bg-white/40"}`} />)}
          </div>
        </div>
        <div className="relative min-h-[14rem] overflow-hidden lg:min-h-0">
          <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-80 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e16] via-[#0c0e16]/35 to-transparent" />
          <div className="absolute inset-x-5 bottom-5 rounded-xl border border-white/[0.14] bg-[#080a12]/65 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:w-52">
            <div className="flex items-center gap-2 text-emerald-200"><StorefrontIcon name="shield" className="h-3.5 w-3.5" /> Protected checkout</div>
            <div className="mt-1.5 text-slate-300/70">Verify your destination before payment.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
