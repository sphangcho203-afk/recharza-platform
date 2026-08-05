import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Support | Recharza",
  description:
    "Get help with a Recharza order, account, payment, or player destination.",
};

const supportEmail = "novatopup9@gmail.com";
const whatsappHref = "https://wa.me/916001921412";

export default function SupportPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--surface-0)] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-[-16rem] h-[32rem] w-[32rem] rounded-full bg-cyan-600/14 blur-[130px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Recharza support
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Start with the order. Then contact a human.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Use secure order tracking for status and payment details. Contact
            support when the timeline does not explain what happened.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-12">
        <Link
          href="/orders/lookup"
          className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.08] p-6 transition hover:border-violet-300/35 hover:bg-violet-400/[0.12]"
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            Existing order
          </p>
          <h2 className="mt-3 text-2xl font-black">Open secure tracking</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Check payment, fulfilment, failure, and completion events before
            contacting support.
          </p>
        </Link>

        <Link
          href="/account"
          className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-white/20 hover:bg-white/[0.055]"
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
            Account help
          </p>
          <h2 className="mt-3 text-2xl font-black">Sign in or recover access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Open order history, reset a password, or confirm which account owns
            an order.
          </p>
        </Link>

        <a
          href={`mailto:${supportEmail}?subject=Recharza%20support%20request`}
          className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]"
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            Email
          </p>
          <h2 className="mt-3 break-all text-2xl font-black">{supportEmail}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Include the order ID, the issue, and a screenshot with sensitive
            payment details hidden.
          </p>
        </a>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.08] p-6 transition hover:border-emerald-300/35 hover:bg-emerald-400/[0.12]"
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
            WhatsApp
          </p>
          <h2 className="mt-3 text-2xl font-black">Message Recharza support</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use the official support conversation and keep the order ID ready.
          </p>
        </a>

        <div className="md:col-span-2 rounded-3xl border border-amber-300/20 bg-amber-300/[0.07] p-5 text-sm leading-6 text-amber-100">
          <strong className="text-white">Security:</strong> Recharza support will
          not ask for an OTP, UPI PIN, card PIN, password, or remote-control app.
          Never send those details to anyone.
        </div>
      </section>
    </main>
  );
}
