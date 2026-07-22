import type { Metadata } from "next";

import { InternalHeader } from "@/components/internal-header";
import { ModuleStateBadge } from "@/components/module-state-badge";
import { OperatorConsole } from "@/components/operator-console";
import { OperatorHealthPanel } from "@/components/operator-health-panel";
import { SupplierPricingConsole } from "@/components/supplier-pricing-console";
import { WorkspaceNavigation } from "@/components/workspace-navigation";
import {
  adminModules,
  getVisibleModules,
  isInteractiveModule,
} from "@/lib/product-system";
import { requireWorkspaceSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Control | Recharza",
  description:
    "Private administration workspace for catalogue, pricing, suppliers, payments, staff, and orders.",
  robots: { index: false, follow: false },
};

const stats = [
  ["Orders awaiting review", "4", "Requires staff attention"],
  ["Published offers", "0", "Run a reviewed supplier sync"],
  ["Open support tickets", "3", "Support workflow is planned"],
  ["Reconciliation alerts", "0", "No unmatched events"],
];

export default async function AdminPage() {
  const session = await requireWorkspaceSession("admin", "/admin");
  const modules = getVisibleModules(adminModules);
  const liveCount = modules.filter((module) => module.state === "live").length;
  const betaCount = modules.filter((module) => module.state === "beta").length;
  const plannedCount = modules.filter((module) => module.state === "planned").length;

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--surface-0)] text-white">
      <InternalHeader
        workspace="Admin"
        role={session.customer.role}
        email={session.customer.email}
      />

      <div className="mx-auto grid max-w-[100rem] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <WorkspaceNavigation workspace="admin" activeId="overview" />

        <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                Private administration
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Admin control centre
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Live controls remain actionable. Beta modules are usable with caution. Planned modules are visible for roadmap context but cannot pretend to work.
              </p>
            </div>
            <div className="grid w-fit grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-2 text-center">
              <div className="rounded-xl bg-emerald-300/[0.06] px-3 py-2">
                <p className="text-lg font-black text-emerald-200">{liveCount}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/70">Live</p>
              </div>
              <div className="rounded-xl bg-cyan-300/[0.06] px-3 py-2">
                <p className="text-lg font-black text-cyan-200">{betaCount}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-300/70">Beta</p>
              </div>
              <div className="rounded-xl bg-amber-300/[0.06] px-3 py-2">
                <p className="text-lg font-black text-amber-100">{plannedCount}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300/70">Planned</p>
              </div>
            </div>
          </section>

          <section id="overview" className="mt-8 scroll-mt-24">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(([label, value, note]) => (
                <article key={label} className="system-card p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-white">{value}</p>
                  <p className="mt-2 text-xs text-slate-600">{note}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="system-panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">System readiness</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      One registry controls module state, navigation, and roadmap visibility.
                    </p>
                  </div>
                  <ModuleStateBadge state="live" />
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="rounded-xl border border-white/10 bg-black/15 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-white">{module.label}</p>
                        <ModuleStateBadge state={module.state} />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {module.description}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="system-panel p-5">
                <h2 className="text-lg font-black">Available controls</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Only live and beta modules expose actions.
                </p>
                <div className="mt-4 grid gap-2">
                  {modules.map((module) => {
                    const interactive = isInteractiveModule(module.state);
                    return (
                      <a
                        key={module.id}
                        href={interactive ? module.href : undefined}
                        aria-disabled={!interactive}
                        className={`grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold ${
                          interactive
                            ? "border-white/10 bg-black/20 text-slate-300 hover:bg-white/5 hover:text-white"
                            : "cursor-not-allowed border-white/5 bg-black/10 text-slate-600"
                        }`}
                      >
                        <span>{module.label}</span>
                        <ModuleStateBadge state={module.state} />
                      </a>
                    );
                  })}
                </div>
              </article>
            </div>
          </section>

          <section id="suppliers" className="mt-8 scroll-mt-24">
            <OperatorHealthPanel />
          </section>

          <section id="pricing" className="mt-8 scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                Catalogue and pricing
              </p>
              <h2 className="mt-1 text-2xl font-black">Supplier controls</h2>
            </div>
            <SupplierPricingConsole />
          </section>

          <section id="orders" className="mt-8 scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                Order operations
              </p>
              <h2 className="mt-1 text-2xl font-black">Order control</h2>
            </div>
            <OperatorConsole />
          </section>
        </div>
      </div>
    </main>
  );
}
