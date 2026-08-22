import type { Metadata } from "next";

import { InternalHeader } from "@/components/internal-header";
import { ModuleStateBadge } from "@/components/module-state-badge";
import { OperatorConsole } from "@/components/operator-console";
import { StaffSupportInbox } from "@/components/staff-support-inbox";
import { WorkspaceNavigation } from "@/components/workspace-navigation";
import { getVisibleModules, staffModules } from "@/lib/product-system";
import { requireWorkspaceSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Workspace | Recharza",
  description:
    "Private staff queue for order review, validation, fulfilment updates, support, and escalation.",
  robots: { index: false, follow: false },
};

const queue = [
  {
    id: "RZ-DEMO123456",
    game: "Mobile Legends",
    task: "Validate player details",
    priority: "Normal",
    age: "4 min",
  },
  {
    id: "RZ-DEMO123421",
    game: "Mobile Legends",
    task: "Review payment reference",
    priority: "High",
    age: "11 min",
  },
  {
    id: "RZ-DEMO123377",
    game: "Mobile Legends",
    task: "Confirm fulfilment",
    priority: "Normal",
    age: "18 min",
  },
];

export default async function StaffPage() {
  const session = await requireWorkspaceSession("staff", "/staff");
  const modules = getVisibleModules(staffModules);

  return (
    <main className="min-h-screen w-full overflow-x-clip bg-white text-slate-900">
      <InternalHeader
        workspace="Staff"
        role={session.customer.role}
        email={session.customer.email}
      />

      <div className="grid min-h-[calc(100vh-4rem)] w-full min-w-0 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <WorkspaceNavigation workspace="staff" activeId="queue" />

        <div className="min-w-0 w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">
                Private staff workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Operations queue
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Live order operations and the support inbox are available. Queue metrics are beta. Escalation workflows stay planned until their data models exist.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm"
                >
                  {module.label}
                  <ModuleStateBadge state={module.state} />
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Assigned", "3", "Beta queue preview"],
              ["Completed today", "12", "Beta shift metric"],
              ["Escalations", "1", "Workflow planned"],
              ["Average response", "6m", "Beta performance metric"],
            ].map(([label, value, note]) => (
              <article key={label} className="system-card p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">{note}</p>
              </article>
            ))}
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <section id="queue" className="system-panel overflow-hidden scroll-mt-24 border border-slate-200 bg-white shadow-sm rounded-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Assigned work</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Preview queue until assignment persistence is implemented.
                  </p>
                </div>
                <ModuleStateBadge state="beta" />
              </div>
              <div className="divide-y divide-slate-100">
                {queue.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{item.game}</h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            item.priority === "High"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-600">{item.task}</p>
                      <p className="mt-2 font-mono text-[11px] font-bold text-slate-400">
                        {item.id} · waiting {item.age}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      title="Task assignment workflow is planned."
                      className="min-h-11 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-400"
                    >
                      Preview only
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <div className="grid content-start gap-6">
              <section id="activity" className="system-panel scroll-mt-24 p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-900">Shift activity</h2>
                  <ModuleStateBadge state="beta" />
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-medium">Orders validated</span>
                    <strong className="text-slate-900">7</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-medium">Orders fulfilled</span>
                    <strong className="text-slate-900">5</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-medium">Tickets answered</span>
                    <strong className="text-slate-900">0</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 font-medium">Escalations raised</span>
                    <strong className="text-slate-900">0</strong>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <section id="orders" className="mt-8 scroll-mt-24">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                  Protected order records
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">Order operations</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  This is the live operational module. API authorization still verifies every request.
                </p>
              </div>
              <ModuleStateBadge state="live" />
            </div>
            <OperatorConsole />
          </section>

          <div className="mt-8">
            <StaffSupportInbox />
          </div>
        </div>
      </div>
    </main>
  );
}
