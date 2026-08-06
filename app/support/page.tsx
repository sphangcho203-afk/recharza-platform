import type { Metadata } from "next";
import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";
import { SiteHeader } from "@/components/site-header";
import { StorefrontIcon } from "@/components/storefront-icon";

export const metadata: Metadata = {
  title: "Support | Recharza",
  description:
    "Get help with a Recharza order, account, payment, or player destination.",
};

const supportEmail = "recherzatopup@gmail.com";
const whatsappHref = "https://wa.me/916001921412";

const supportRoutes = [
  {
    eyebrow: "Existing order",
    title: "Track before escalating",
    description:
      "Review payment, fulfilment, failure, and completion events on the private order timeline.",
    href: "/orders/lookup",
    icon: "track" as const,
    tone: "violet",
  },
  {
    eyebrow: "Account access",
    title: "Recover your workspace",
    description:
      "Sign in, reset a password, review account-owned orders, or confirm which email owns a purchase.",
    href: "/account",
    icon: "account" as const,
    tone: "cyan",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--surface-0)] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/[0.08]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-[-18rem] h-[36rem] w-[36rem] rounded-full bg-violet-600/15 blur-[140px]" />
          <div className="absolute right-[5%] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[130px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Recharza support centre
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Get the right help without exposing sensitive information.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
              Begin with secure order tracking or account recovery. Contact a human when the product timeline does not explain the issue.
            </p>
          </div>
          <div className="hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 lg:block">
            <RecharzaMark />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-4 md:grid-cols-2">
          {supportRoutes.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0c0c14] p-6 transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-[#10101a]"
            >
              <div className="flex items-start justify-between gap-5">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                    item.tone === "violet"
                      ? "border-violet-300/20 bg-violet-300/10 text-violet-200"
                      : "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
                  }`}
                >
                  <StorefrontIcon name={item.icon} className="h-5 w-5" />
                </span>
                <StorefrontIcon name="arrow" className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-white" />
              </div>
              <p className="mt-7 text-[11px] font-black uppercase tracking-[0.18em] text-violet-300">
                {item.eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[1.75rem] border border-white/[0.09] bg-[#0c0c14] p-6 sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
              Human support
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
              Include the order ID and a clear description.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Screenshots are useful, but hide card numbers, UPI details, personal documents, OTPs, and passwords before sending them.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${supportEmail}?subject=Recharza%20support%20request`}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.035] px-4 text-sm font-black text-white transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.07]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                  <StorefrontIcon name="support" className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 break-all">{supportEmail}</span>
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] px-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/[0.13]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/10">
                  <StorefrontIcon name="support" className="h-[18px] w-[18px]" />
                </span>
                WhatsApp support
              </a>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-amber-300/20 bg-amber-300/[0.065] p-6 sm:p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-100">
              <StorefrontIcon name="shield" className="h-5 w-5" />
            </span>
            <p className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
              Never share
            </p>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-50/80">
              <li>Passwords or sign-in links</li>
              <li>OTP or verification codes</li>
              <li>UPI PIN or card PIN</li>
              <li>Remote-control access</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
