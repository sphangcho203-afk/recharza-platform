import type { Metadata } from "next";
import Link from "next/link";

import { OrderTracker } from "@/components/order-tracker";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Securely open a persisted Recharza order and view its event timeline.",
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <main className="min-h-screen overflow-x-clip bg-slate-50/50 text-slate-900">
      <SiteHeader />

      <section className="relative isolate border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14 lg:py-18">
          <Link
            href="/#games"
            className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 transition hover:text-slate-900"
          >
            <span aria-hidden="true">←</span>
            Back to games
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Secure order console
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Track an order without exposing customer data.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-500 font-medium">
            The public order ID locates the record. A separate private token
            unlocks the timeline, masked receipt address, package details, and
            status history.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12 lg:py-16">
        <OrderTracker orderId={orderId} />
      </section>
    </main>
  );
}
