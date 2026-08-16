import type { Metadata } from "next";
import Link from "next/link";

import { CustomerAccountShell } from "@/components/customer-account-shell";
import { RecharzaMark } from "@/components/recharza-mark";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Order history | Recharza",
  description: "Review Recharza purchases, delivery status, receipts, and tracking links.",
  robots: { index: false, follow: false },
};

export default function AccountOrdersPage() {
  return (
    <main className="storefront-page min-h-screen overflow-x-clip text-white">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
        >
          <span aria-hidden="true">←</span> Back to account
        </Link>
        <div className="mt-8 flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg border border-white/[0.1] bg-white/[0.035]">
            <RecharzaMark compact />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Order history</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Your purchases</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
              Review every account-owned order, player destination, payment state, and delivery timeline in one focused workspace.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-5xl lg:mt-10">
          <CustomerAccountShell showOrders />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
