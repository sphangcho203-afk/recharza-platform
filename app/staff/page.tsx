import type { Metadata } from "next";

import { InternalHeader } from "@/components/internal-header";
import { OperatorConsole } from "@/components/operator-console";

export const metadata: Metadata = {
  title: "Staff Workspace | Recharza",
  description: "Private staff queue for order review, validation, fulfilment updates, support, and escalation.",
  robots: { index: false, follow: false },
};

const queue = [
  { id: "RZ-DEMO123456", game: "Mobile Legends", task: "Validate player details", priority: "Normal", age: "4 min" },
  { id: "RZ-DEMO123421", game: "Mobile Legends", task: "Review payment reference", priority: "High", age: "11 min" },
  { id: "RZ-DEMO123377", game: "Mobile Legends", task: "Confirm fulfilment", priority: "Normal", age: "18 min" },
];

const support = [
  { customer: "Customer 1042", subject: "Wrong zone entered", status: "New" },
  { customer: "Customer 0981", subject: "Order still under review", status: "Waiting" },
];

export default function StaffPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#07070c] text-white">
      <InternalHeader workspace="Staff" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Private staff workspace</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Operations queue</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Review assigned orders, validate account details, update fulfilment progress, answer support requests, and escalate exceptions.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 text-sm font-bold text-emerald-200">
            STAFF or ADMIN session required
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Assigned", "3", "Current queue"],
            ["Completed today", "12", "Across all tasks"],
            ["Escalations", "1", "Needs admin review"],
            ["Average response", "6m", "Support and orders"],
          ].map(([label, value, note]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-black">{value}</p>
              <p className="mt-2 text-xs text-slate-600">{note}</p>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#10101a]">
            <div className="border-b border-white/8 p-5">
              <h2 className="text-lg font-black">Assigned work</h2>
              <p className="mt-1 text-sm text-slate-500">Work the oldest high-priority item first.</p>
            </div>
            <div className="divide-y divide-white/8">
              {queue.map((item) => (
                <article key={item.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-white">{item.game}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.priority === "High" ? "bg-amber-300/10 text-amber-200" : "bg-white/5 text-slate-400"}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{item.task}</p>
                    <p className="mt-2 font-mono text-[11px] text-slate-600">{item.id} · waiting {item.age}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="min-h-11 rounded-xl border border-white/10 px-3 text-xs font-bold text-slate-300 hover:bg-white/5">Escalate</button>
                    <button type="button" className="min-h-11 rounded-xl bg-white px-3 text-xs font-black text-slate-950 hover:bg-cyan-100">Open task</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="grid content-start gap-6">
            <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Support inbox</h2>
                  <p className="mt-1 text-sm text-slate-500">Customer conversations assigned to this shift.</p>
                </div>
                <span className="rounded-full bg-violet-300/10 px-2.5 py-1 text-[10px] font-bold text-violet-200">2 open</span>
              </div>
              <div className="mt-4 grid gap-3">
                {support.map((ticket) => (
                  <article key={ticket.subject} className="rounded-xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-500">{ticket.customer}</p>
                      <span className="text-[10px] font-bold text-cyan-300">{ticket.status}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-black text-white">{ticket.subject}</h3>
                    <button type="button" className="mt-4 min-h-11 w-full rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5">Open conversation</button>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
              <h2 className="text-lg font-black">Shift activity</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Orders validated</span><strong>7</strong></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Orders fulfilled</span><strong>5</strong></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Tickets answered</span><strong>4</strong></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Escalations raised</span><strong>1</strong></div>
              </div>
            </section>
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">Protected order records</p>
            <h2 className="mt-1 text-2xl font-black">Order operations</h2>
            <p className="mt-2 text-sm text-slate-500">The API accepts verified staff sessions and rejects unauthorized data access.</p>
          </div>
          <OperatorConsole />
        </section>
      </div>
    </main>
  );
}