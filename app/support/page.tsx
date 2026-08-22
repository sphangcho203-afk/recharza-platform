import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontIcon } from "@/components/storefront-icon";
import { LiveSupportChat } from "@/components/live-support-chat";
import { TelegramGroupLauncher } from "@/components/telegram-group-launcher";
import { SupportCenter } from "@/components/support-center";
import { SupportExplainer } from "@/components/support-explainer";
import { getPublicSupportChannels } from "@/lib/support-config";

export const metadata: Metadata = {
  title: "Support | Recharza",
  description: "Create a Recharza support ticket or contact the team through the connected support channels.",
};

export default function SupportPage() {
  const channels = getPublicSupportChannels();

  return (
    <main className="storefront-page min-h-screen overflow-x-clip text-slate-900 bg-white">
      <SiteHeader />

      <section className="border-b border-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1100px]">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-slate-900">
            ← Back to store
          </Link>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Recharza Support</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 font-medium">Choose the issue, create a ticket, or jump directly into one of the connected support apps.</p>
            </div>
            <Link href="/orders/lookup" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-900 transition hover:bg-slate-50 shadow-sm">
              <StorefrontIcon name="track" className="h-4 w-4" />
              Track order
            </Link>
          </div>
        </div>
      </section>

      <section id="live-chat" className="border-b border-slate-100 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto grid max-w-[1100px] gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Instant help</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Chat with Recharza support</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 font-medium">Ask about games, top-ups, player verification, checkout, delivery, or the safest next step for your order.</p>
            <p className="mt-4 text-xs leading-5 text-slate-400 font-medium">For order access, never share passwords, OTPs, card details, UPI PINs, or private access tokens.</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <TelegramGroupLauncher className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-cyan-700 hover:-translate-y-0.5 hover:shadow-lg">Open live support in Telegram</TelegramGroupLauncher>
              <a href="https://t.me/supprtrz" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-900 shadow-sm transition-all duration-300 hover:bg-slate-50">Use Telegram Web <span className="ml-2" aria-hidden="true">↗</span></a>
            </div>
          </div>
          <LiveSupportChat embedded />
        </div>
      </section>

      <section id="how-support-works" className="border-b border-slate-100 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-[1100px]">
          <SupportExplainer />
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <SupportCenter channels={channels} />
      </section>

      <section className="border-y border-amber-200 bg-amber-50 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1100px] items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-200 bg-white text-amber-600 shadow-sm">
            <StorefrontIcon name="shield" className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-amber-900">Support will never request sensitive security codes.</h2>
            <p className="mt-1 text-xs leading-5 text-amber-800/70 font-medium">Never send a password, OTP, UPI PIN, card PIN, sign-in link or remote-device access code.</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
