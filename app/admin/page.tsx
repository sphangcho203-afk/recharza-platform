import type { Metadata } from "next";

import { InternalHeader } from "@/components/internal-header";
import { OperatorConsole } from "@/components/operator-console";
import { OperatorHealthPanel } from "@/components/operator-health-panel";
import { SupplierPricingConsole } from "@/components/supplier-pricing-console";

export const metadata: Metadata = {
  title: "Admin Control | Recharza",
  description: "Private administration workspace for catalogue, pricing, suppliers, payments, staff, and orders.",
  robots: { index: false, follow: false },
};

const modules = [
  "Overview",
  "Orders",
  "Products",
  "Regional catalogues",
  "Pricing rules",
  "Suppliers",
  "Payments",
  "Customers",
  "Staff and roles",
  "Promotions",
  "Support tickets",
  "Audit log",
  "Settings",
];

const stats = [
  ["Orders awaiting review", "4", "Requires staff attention"],
  ["Published offers", "0", "Run a reviewed supplier sync"],
  ["Open support tickets", "3", "One marked urgent"],
  ["Reconciliation alerts", "0", "No unmatched events"],
];

export default function AdminPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#06060f] text-white">
      <InternalHeader workspace="Admin" />

      <div className="mx-auto grid max-w-[100rem] lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#090911] lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r">
          <nav className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:overflow-y-auto lg:p-4" aria-label="Admin modules">
            {modules.map((module, index) => (
              <a
                key={module}
                href={index === 0 ? "#overview" : index === 1 ? "#orders" : index === 4 ? "#pricing" : `#${module.toLowerCase().replaceAll(" ", "-").replaceAll("and", "")}`}
                className={`min-h-11 shrink-0 rounded-xl px-3.5 py-3 text-sm font-bold transition lg:w-full ${
                  index === 0
                    ? "bg-white text-slate-950"
                    : "border border-white/8 bg-white/[0.025] text-slate-400 hover:bg-white/[0.055] hover:text-white"
                }`}
              >
                {module}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Private administration</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Admin control centre</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Catalogue, pricing, supplier, payment, customer, staff, promotion, support, and audit controls live here, away from the customer store.
              </p>
            </div>
            <span className="w-fit rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-xs font-bold text-amber-100">
              Verified ADMIN session required for protected data and actions
            </span>
          </section>

          <section id="overview" className="mt-8 scroll-mt-24">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(([label, value, note]) => (
                <article key={label} className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-black text-white">{value}</p>
                  <p className="mt-2 text-xs text-slate-600">{note}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">Business overview</h2>
                    <p className="mt-1 text-sm text-slate-500">Order volume, fulfilment health, payment state, and support load.</p>
                  </div>
                  <span className="rounded-full bg-violet-300/10 px-2.5 py-1 text-[10px] font-bold text-violet-200">Today</span>
                </div>
                <div className="mt-5 grid h-48 place-items-center rounded-xl border border-dashed border-white/10 bg-black/20 px-6 text-center text-sm text-slate-600">
                  Analytics will populate from verified order and payment records.
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
                <h2 className="text-lg font-black">Quick controls</h2>
                <div className="mt-4 grid gap-2">
                  {[
                    "Synchronize approved supplier offers",
                    "Review pending orders",
                    "Create promotion",
                    "Manage staff roles",
                  ].map((action) => (
                    <button key={action} type="button" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-left text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white">
                      {action}
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="mt-8">
            <OperatorHealthPanel />
          </section>

          <section id="pricing" className="mt-8 scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Catalogue and pricing</p>
              <h2 className="mt-1 text-2xl font-black">Supplier controls</h2>
            </div>
            <SupplierPricingConsole />
          </section>

          <section id="orders" className="mt-8 scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">Order operations</p>
              <h2 className="mt-1 text-2xl font-black">Order control</h2>
            </div>
            <OperatorConsole />
          </section>
        </div>
      </div>
    </main>
  );
}