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
    accent: "var(--color-warning)",
  },
  {
    eyebrow: "Recharza promise",
    title: "Fast delivery. Fewer surprises.",
    description: "See the market, package, and final display currency before you confirm your order.",
    href: "/#how-it-works",
    cta: "See how it works",
    image: "/assets/user-supplied-v2/1000166215.jpg",
    accent: "var(--color-info)",
  },
  {
    eyebrow: "Built for every region",
    title: "Your game, your market, your currency.",
    description: "Choose a regional tile once and continue through a checkout designed for that exact destination.",
    href: "/#games",
    cta: "Browse the catalogue",
    image: "/assets/user-supplied-v2/1000166213.jpg",
    accent: "var(--color-primary)",
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
    <section className="fable-elevation-2 relative overflow-hidden rounded-lg border border-border bg-surface" aria-label="Store promotions">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(139,92,246,0.18),transparent_38%),linear-gradient(120deg,rgba(9,9,17,0.98),rgba(16,16,24,0.94))]" />
      <div className="relative grid min-h-[22rem] grid-cols-1 lg:grid-cols-12">
        <div className="col-span-1 grid content-center gap-6 p-6 sm:p-8 lg:col-span-7 lg:p-12">
          <div className="grid gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slide.accent }} />
              {slide.eyebrow}
            </p>
            <h1 className="max-w-xl text-4xl font-heading font-semibold leading-tight tracking-tight text-text-primary md:text-5xl">{slide.title}</h1>
            <p className="max-w-lg text-base leading-relaxed text-text-secondary">{slide.description}</p>
          </div>
          <div className="grid gap-4 sm:flex sm:items-center">
            <Link href={slide.href} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              {slide.cta}<StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center gap-2" aria-label="Promotional slides">
            {slides.map((item, index) => (
              <button key={item.eyebrow} type="button" aria-label={`Show promotion ${index + 1}`} aria-current={index === active} onClick={() => setActive(index)} className={`h-2 rounded-lg transition-[background-color,width] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${index === active ? "w-8 bg-primary" : "w-2 bg-border hover:bg-text-muted"}`} />
            ))}
          </div>
        </div>
        <div className="grid grid-rows-[minmax(0,1fr)_auto] border-t border-border lg:col-span-5 lg:border-l lg:border-t-0">
          <div className="relative min-h-56 overflow-hidden lg:min-h-0">
            <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-200 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface/80 via-surface/20 to-transparent" />
          </div>
          <div className="fable-surface-raised grid gap-1 border-t border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><StorefrontIcon name="shield" className="h-4 w-4 text-success" /> Protected checkout</div>
            <p className="text-sm leading-relaxed text-text-secondary">Verify your destination before payment.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
