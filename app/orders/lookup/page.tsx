import type { Metadata } from "next";
import Link from "next/link";

import { OrderLookupForm } from "@/components/order-lookup-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Find Order",
  description: "Open a private Recharza order timeline using its public order ID and access token.",
  robots: { index: false, follow: false },
};

export default function OrderLookupPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50/50 text-slate-900">
      <SiteHeader />

      <section className="relative isolate border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 transition hover:text-slate-900"
          >
            <span aria-hidden="true">←</span>
            Back to storefront
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Customer order access
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Find the order without exposing the customer.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-500 font-medium">
            Recharza separates the public order reference from the private tracking credential. This
            launcher sends both to the existing secure tracking console without placing the token in
            the URL.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <OrderLookupForm />
      </section>
    </main>
  );
}
