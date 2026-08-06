import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontIcon } from "@/components/storefront-icon";
import { SupportCenter } from "@/components/support-center";
import { getPublicSupportChannels } from "@/lib/support-config";

export const metadata: Metadata = {
  title: "Support | Recharza",
  description:
    "Create a Recharza support ticket or contact the team through Telegram, WhatsApp, Instagram, or Gmail.",
};

const quickActions = [
  {
    title: "Track an order",
    description: "Check payment and fulfilment updates first.",
    href: "/orders/lookup",
    icon: "track" as const,
  },
  {
    title: "Account help",
    description: "Sign in, recover access, or review account-owned orders.",
    href: "/account",
    icon: "account" as const,
  },
];

export default function SupportPage() {
  const channels = getPublicSupportChannels();

  return (
    <main className="storefront-page min-h-screen overflow-x-clip bg-[#05060b] text-white">
      <SiteHeader />

      <section className="border-b border-white/[0.08] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-4 sm:gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#090b14] shadow-[0_0_40px_rgba(34,211,238,0.12)] sm:h-24 sm:w-24">
            <Image
              src="/assets/support/recharza-support-bot.svg"
              alt="Recharza support bot"
              fill
              priority
              sizes="96px"
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              Recharza Support
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
              How can we help?
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Choose the problem, submit a ticket, or contact us directly.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#090b12] p-4 transition hover:border-white/[0.16] hover:bg-white/[0.035]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-300/20 bg-violet-300/[0.07] text-violet-200">
                <StorefrontIcon name={action.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-black text-white">
                  {action.title}
                </strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {action.description}
                </span>
              </span>
              <StorefrontIcon
                name="arrow"
                className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white"
              />
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <SupportCenter channels={channels} />
        </div>
      </section>

      <section className="border-y border-amber-300/15 bg-amber-300/[0.045] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-300/20 bg-amber-300/[0.08] text-amber-200">
            <StorefrontIcon name="shield" className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-black text-amber-50">
              Recharza support will never request sensitive codes
            </h2>
            <p className="mt-1 text-xs leading-5 text-amber-50/65">
              Never send a password, OTP, UPI PIN, card PIN, sign-in link, or remote-device access.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
