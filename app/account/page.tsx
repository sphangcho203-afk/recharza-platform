import type { Metadata } from "next";
import Link from "next/link";

import { AccountConsole } from "@/components/account-console";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "My Account | Recharza",
  description: "Sign in to view orders, saved player details, notifications, rewards, support, and account security.",
};

export default function AccountPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#07070c] text-white">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-[-16rem] h-[32rem] w-[32rem] rounded-full bg-violet-700/16 blur-[130px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link href="/" className="text-sm font-semibold text-violet-300 hover:text-violet-200">← Back to store</Link>
          <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-violet-300">Customer dashboard</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">Orders, players, rewards, and support in one place.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
            Sign in with a secure email link to access your private order history and customer tools. No password collection, because humanity has already invented enough forgotten passwords.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <AccountConsole />
      </section>
    </main>
  );
}