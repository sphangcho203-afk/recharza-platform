import type { Metadata } from "next";
import Link from "next/link";

import CartCheckoutPage from "@/components/cart-checkout-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Checkout All Items | Recharza",
  description: "Verify every game account and pay for the complete Recharza cart in one secure checkout.",
};

export const dynamic = "force-dynamic";

export default function CartCheckoutRoute() {
  return (
    <main className="storefront-page min-h-screen overflow-x-clip text-slate-900 bg-slate-50/50">
      <SiteHeader />
      <section className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8 shadow-sm">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span className="text-slate-200">/</span>
            <Link href="/cart" className="hover:text-slate-900">Cart</Link>
            <span className="text-slate-200">/</span>
            <span className="text-slate-600">Checkout</span>
          </div>
        </div>
      </section>
      <CartCheckoutPage />
      <SiteFooter />
    </main>
  );
}
