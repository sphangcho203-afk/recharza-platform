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
    <main className="storefront-page recharza-atmo-v2 recharza-atmo-checkout min-h-screen overflow-x-clip text-white">
      <SiteHeader />
      <section className="border-b border-white/[0.08] bg-[#0a0c12] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-white">Cart</Link>
            <span>/</span>
            <span className="text-slate-400">Checkout</span>
          </div>
        </div>
      </section>
      <CartCheckoutPage />
      <SiteFooter />
    </main>
  );
}
