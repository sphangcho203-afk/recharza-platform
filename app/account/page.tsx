import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const recentOrders = [
  { id: "RZ-DEMO123456", game: "Mobile Legends", packageName: "86 Diamonds", status: "Review", amount: "₹130" },
  { id: "RZ-DEMO118204", game: "Mobile Legends", packageName: "Weekly Diamond Pass", status: "Completed", amount: "₹160" },
];

const savedPlayers = [
  { label: "Main MLBB", player: "123456789 (1234)", market: "India" },
  { label: "Indonesia account", player: "987654321 (4321)", market: "Indonesia" },
];

export const metadata = {
  title: "My Account | Recharza",
  description: "Customer orders, saved players, rewards, notifications, and support.",
};

export default function AccountPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#07070c] text-white">
      <SiteHeader />

      <section className="border-b border-white/8 bg-[radial-gradient(circle_at_15%_10%,rgba(124,58,237,0.16),transparent_38%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Customer account</p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Welcome back</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Keep player IDs, order updates, rewards, and support in one private customer space.
              </p>
            </div>
            <Link
              href="/games/mobile-legends"
              className="min-h-12 rounded-xl bg-white px-5 py-3.5 text-center text-sm font-black text-slate-950 transition hover:bg-violet-200"
            >
              Start a top-up
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-8 lg:py-12">
        <div className="grid min-w-0 gap-5">
          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Store credit</p>
              <p className="mt-3 text-3xl font-black">₹0</p>
              <p className="mt-2 text-xs text-slate-500">No refundable balance currently available.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Reward points</p>
              <p className="mt-3 text-3xl font-black">240</p>
              <p className="mt-2 text-xs text-slate-500">Progress toward the next reward tier.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Open tickets</p>
              <p className="mt-3 text-3xl font-black">1</p>
              <p className="mt-2 text-xs text-slate-500">One support conversation is awaiting review.</p>
            </article>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#10101a]">
            <div className="flex flex-col gap-3 border-b border-white/8 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black">Recent orders</h2>
                <p className="mt-1 text-sm text-slate-500">Your latest top-ups and their current status.</p>
              </div>
              <Link href="/orders/lookup" className="text-sm font-bold text-violet-300 hover:text-violet-200">
                Track another order →
              </Link>
            </div>
            <div className="divide-y divide-white/8">
              {recentOrders.map((order) => (
                <article key={order.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-white">{order.game}</h3>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{order.packageName}</p>
                    <p className="mt-2 font-mono text-[11px] text-slate-600">{order.id}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p className="font-black text-white">{order.amount}</p>
                    <Link href="/orders/lookup" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">
                      View
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Saved player accounts</h2>
                <p className="mt-1 text-sm text-slate-500">Reuse verified player details during checkout.</p>
              </div>
              <button type="button" className="min-h-11 rounded-xl border border-white/10 px-3 text-xs font-bold text-white hover:bg-white/5">
                Add player
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {savedPlayers.map((player) => (
                <article key={player.label} className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-white">{player.label}</h3>
                    <span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-[10px] font-bold text-violet-200">{player.market}</span>
                  </div>
                  <p className="mt-3 font-mono text-sm text-slate-300">{player.player}</p>
                  <div className="mt-4 flex gap-3 text-xs font-bold">
                    <button type="button" className="text-violet-300 hover:text-violet-200">Edit</button>
                    <button type="button" className="text-slate-500 hover:text-slate-300">Remove</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="text-lg font-black">Profile</h2>
            <div className="mt-4 grid gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-600">Display name</p>
                <p className="mt-1 font-bold text-white">Recharza Customer</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Email</p>
                <p className="mt-1 break-all text-slate-300">customer@example.com</p>
              </div>
              <button type="button" className="min-h-11 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5">
                Edit profile
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="text-lg font-black">Notifications</h2>
            <div className="mt-4 grid gap-3">
              <article className="rounded-xl border border-emerald-300/10 bg-emerald-300/[0.05] p-3">
                <p className="text-sm font-bold text-emerald-100">Order completed</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Your Weekly Diamond Pass order was completed.</p>
              </article>
              <article className="rounded-xl border border-white/8 bg-black/20 p-3">
                <p className="text-sm font-bold text-white">Reward progress</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">You are 260 points away from the next reward.</p>
              </article>
            </div>
          </section>

          <section id="support" className="scroll-mt-24 rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] p-5">
            <h2 className="text-lg font-black">Support</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Open a ticket for order, player ID, payment, or fulfilment problems.</p>
            <button type="button" className="mt-4 min-h-11 w-full rounded-xl bg-white px-4 text-xs font-black text-slate-950 hover:bg-violet-200">
              Create support ticket
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="text-lg font-black">Security</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Review active sessions and protect saved player accounts.</p>
            <button type="button" className="mt-4 min-h-11 w-full rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5">
              Manage sessions
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}