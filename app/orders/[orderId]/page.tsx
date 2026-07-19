import type { Metadata } from "next";
import Link from "next/link";

import { OrderTracker } from "@/components/order-tracker";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Track Order",
  description: "Securely open a persisted Recharza order and view its event timeline.",
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <main className="min-h-screen overflow-hidden bg-[#070711] text-white">
      <SiteHeader />

      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/3 top-[-14rem] h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-18">
          <Link
            href="/games/mobile-legends"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 transition hover:text-violet-200"
          >
            <span aria-hidden="true">←</span>
            Back to Mobile Legends
          </Link>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-violet-300">
            Secure order console
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">
            Track an order without exposing customer data.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            The public order ID locates the record. A separate private token unlocks the timeline,
            masked receipt address, package details, and status history.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <OrderTracker orderId={orderId} />
      </section>
    </main>
  );
}
