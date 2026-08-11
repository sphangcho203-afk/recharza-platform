import type { Metadata } from "next";
import Link from "next/link";

import { CustomerAddresses } from "@/components/customer-addresses";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Saved Addresses | Recharza",
  description: "Manage saved billing addresses for faster Recharza checkout.",
};

export default function AddressesPage() {
  return (
    <main className="storefront-page min-h-screen overflow-x-clip text-white">
      <SiteHeader />
      <section className="mx-auto max-w-[980px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link href="/account" className="text-xs font-black text-slate-500 transition hover:text-white">← Back to account</Link>
        <div className="mt-5">
          <CustomerAddresses />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
