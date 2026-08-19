import type { Metadata } from "next";
import Link from "next/link";

import { CartPage } from "@/components/cart-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Your Cart | Recharza",
  description:
    "Review the top-ups in your cart before continuing to secure checkout.",
};

export const dynamic = "force-dynamic";

export default function CartRoute() {
  return (
    <main className="storefront-page recharza-atmo-v2 recharza-atmo-checkout min-h-screen overflow-x-clip text-white">
      <SiteHeader />

      <section className="border-b border-white/[0.08] bg-[#0a0c12] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-4 flex items-center gap-2 text-[11px] text-slate-600">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-slate-400">Cart</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              Your cart
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              Review your top-ups, adjust quantities, and continue to secure
              checkout.
            </p>
          </div>
        </div>
      </section>

      <CartPage />

      <SiteFooter />
    </main>
  );
}
