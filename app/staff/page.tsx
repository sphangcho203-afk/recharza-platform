import type { Metadata } from "next";

import { InternalHeader } from "@/components/internal-header";
import { ModuleStateBadge } from "@/components/module-state-badge";
import { OperatorConsole } from "@/components/operator-console";
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
    <main className="min-h-screen overflow-x-clip bg-[var(--surface-0)] text-white">
      <InternalHeader
        workspace="Staff"
        role={session.customer.role}
        email={session.customer.email}
      />

      <div className="mx-auto grid max-w-[100rem] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <WorkspaceNavigation workspace="staff" activeId="queue" />

        <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Private staff workspace
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Operations queue
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Live order operations remain available. Queue metrics are beta. Support and escalation workflows stay visibly planned until their data models exist.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-bold text-slate-300"
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
              <article key={label} className="system-card p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-black">{value}</p>
                <p className="mt-2 text-xs text-slate-600">{note}</p>
              </article>
            ))}
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <section id="queue" className="system-panel overflow-hidden scroll-mt-24">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                <div>
                  <h2 className="text-lg font-black">Assigned work</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Preview queue until assignment persistence is implemented.
                  </p>
                </div>
                <ModuleStateBadge state="beta" />
              </div>
              <div className="divide-y divide-white/8">
                {queue.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-white">{item.game}</h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            item.priority === "High"
                              ? "bg-amber-300/10 text-amber-200"
                              : "bg-white/5 text-slate-400"
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{item.task}</p>
                      <p className="mt-2 font-mono text-[11px] text-slate-600">
                        {item.id} · waiting {item.age}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      title="Task assignment workflow is planned."
                      className="min-h-11 cursor-not-allowed rounded-xl border border-white/8 bg-black/10 px-3 text-xs font-bold text-slate-600"
                    >
                      Preview only
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <div className="grid content-start gap-6">
              <section id="support" className="system-panel scroll-mt-24 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">Support inbox</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Customer conversation workflow is not active yet.
                    </p>
                  </div>
                  <ModuleStateBadge state="planned" />
                </div>
                <div className="system-empty-state mt-4 min-h-40">
                  <div>
                    <p className="font-black text-slate-300">Support module planned</p>
                    <p className="mt-2 text-sm leading-6">
                      Tickets, assignment, replies, and escalation need persistent models before controls become active.
                    </p>
                  </div>
                </div>
              </section>

              <section id="activity" className="system-panel scroll-mt-24 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black">Shift activity</h2>
                  <ModuleStateBadge state="beta" />
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Orders validated</span>
                    <strong>7</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Orders fulfilled</span>
                    <strong>5</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Tickets answered</span>
                    <strong>0</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Escalations raised</span>
                    <strong>0</strong>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <section id="orders" className="mt-8 scroll-mt-24">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  Protected order records
                </p>
                <h2 className="mt-1 text-2xl font-black">Order operations</h2>
                <p className="mt-2 text-sm text-slate-500">
                  This is the live operational module. API authorization still verifies every request.
                </p>
              </div>
              <ModuleStateBadge state="live" />
            </div>
            <OperatorConsole />
          </section>
        </div>
      </div>
    </main>
  );
}
