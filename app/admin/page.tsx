import type { Metadata } from "next";
import Link from "next/link";

import { OperatorConsole } from "@/components/operator-console";
import { RecharzaMark } from "@/components/recharza-mark";
import { SupplierPricingConsole } from "@/components/supplier-pricing-console";

export const metadata: Metadata = {
  title: "Admin Control | Recharza",
  description: "Private administration workspace for catalogue, pricing, suppliers, payments, and orders.",
  robots: { index: false, follow: false },
};

const modules = [
  "Overview",
  "Orders",
  "Games & products",
  "Regional catalogues",
  "Pricing rules",
  "Suppliers",
  "Payments",
  "Customers",
  "Staff & roles",
  "Promotions",
  "Support tickets",
  "Audit log",
  "Settings",
];

const stats = [
  ["Orders awaiting review", "4", "Needs staff attention"],
  ["Published offers", "0", "Supplier sync required"],
  ["Open support tickets", "3", "One marked urgent"],
  ["Reconciliation alerts", "0", "No unmatched events"],
];

export default function AdminPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#06060f] text-white">
      <div className="grid min-h-screen lg:grid-cols-[17rem_1fr]">
        <aside className="border-b border-white/10 bg-[#090911] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex h-16 items-center justify-between border-b border-white/8 px-4 lg:px-5">
            <RecharzaMark compact />
            <span className="rounded-full border border-violet-300/15 bg-violet-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-200">
              Admin
            </span>
          </div>

          <nav className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:overflow-visible lg:p-4" aria-label="Admin navigation">
            {modules.map((module, index) => (
              <a
                key={module}
                href={index === 0 ? "#overview" : index === 4 ? "#pricing" : index === 1 ? "#orders" : `#${module.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`}
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

          <div className="hidden border-t border-white/8 p-4 lg:block">
            <Link href="/" className="block rounded-xl border border-white/10 px-3 py-3 text-center text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white">
              Open customer store
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-white/8 bg-[#06060f]/92 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[100rem] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Private workspace</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Admin control centre</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-xs font-bold text-emerald-200">Systems normal</span>
                <Link href="/staff" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">Staff workspace</Link>
              </div>
            </div>
          </header>

          <div className="mx-auto grid max-w-[100rem] gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <section id="overview" className="scroll-mt-6">
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
                      <h2 className="text-lg font-black">Operations overview</h2>
                      <p className="mt-1 text-sm text-slate-500">Mock activity for the private admin dashboard.</p>
                    </div>
                    <span className="rounded-full bg-violet-300/10 px-2.5 py-1 text-[10px] font-bold text-violet-200">Today</span>
                  </div>
                  <div className="mt-5 grid h-48 place-items-center rounded-xl border border-dashed border-white/10 bg-black/20 text-center text-sm text-slate-600">
                    Revenue and order-volume chart placeholder
                  </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
                  <h2 className="text-lg font-black">Quick controls</h2>
                  <div className="mt-4 grid gap-2">
                    {[
                      "Sync approved supplier offers",
                      "Review pending orders",
                      "Create promotion",
                      "Invite staff member",
                    ].map((action) => (
                      <button key={action} type="button" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-left text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white">
                        {action}
                      </button>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <section id="pricing" className="scroll-mt-6">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Catalogue and pricing</p>
                <h2 className="mt-1 text-2xl font-black">Supplier controls</h2>
              </div>
              <SupplierPricingConsole />
            </section>

            <section id="orders" className="scroll-mt-6">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">Order operations</p>
                <h2 className="mt-1 text-2xl font-black">Order control</h2>
              </div>
              <OperatorConsole />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}