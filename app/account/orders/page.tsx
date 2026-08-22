import type { Metadata } from "next";

import { CustomerAccountShell } from "@/components/customer-account-shell";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Order history | Recharza",
  description: "Review Recharza purchases, delivery status, receipts, and tracking links.",
  robots: { index: false, follow: false },
};

export default function AccountOrdersPage() {
  return (
    <main className="storefront-page min-h-screen overflow-x-clip bg-slate-50/50 text-slate-900">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-5xl">
          <CustomerAccountShell showOrders />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
