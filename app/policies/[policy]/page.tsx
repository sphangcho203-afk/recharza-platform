import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RecharzaMark } from "@/components/recharza-mark";
import { SiteHeader } from "@/components/site-header";
import { StorefrontIcon } from "@/components/storefront-icon";
import {
  parsePublicPolicyKey,
  publicPolicies,
} from "@/lib/public-policies";

export function generateStaticParams() {
  return Object.keys(publicPolicies).map((policy) => ({ policy }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ policy: string }>;
}): Promise<Metadata> {
  const key = parsePublicPolicyKey((await params).policy);
  if (!key) return { title: "Policy not found | Recharza" };

  const policy = publicPolicies[key];
  return {
    title: `${policy.title} | Recharza`,
    description: policy.summary,
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ policy: string }>;
}) {
  const key = parsePublicPolicyKey((await params).policy);
  if (!key) notFound();

  const policy = publicPolicies[key];

  return (
    <main className="min-h-screen bg-[var(--surface-0)] text-white">
      <SiteHeader />

      <section className="border-b border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_32rem),radial-gradient(circle_at_top_right,rgba(124,58,237,0.11),transparent_28rem)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-black text-cyan-300 transition hover:text-cyan-200"
          >
            ← Back to Recharza
          </Link>

          <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
                Recharza legal centre
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
                {policy.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                {policy.summary}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.09] bg-black/20 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                Last updated
              </p>
              <p className="mt-2 text-sm font-black text-white">
                {policy.lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_17rem] lg:px-8">
        <article className="grid gap-4">
          {policy.sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6"
            >
              <h2 className="text-lg font-black tracking-[-0.025em] text-white sm:text-xl">
                {section.heading}
              </h2>
              <div className="mt-3 grid gap-3">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-7 text-slate-400 sm:text-[0.95rem]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#0b0d14] p-5 lg:sticky lg:top-24">
          <RecharzaMark />
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Need help applying a policy to an order? Start with private tracking,
            then contact support with the order ID.
          </p>
          <div className="mt-5 grid gap-2">
            <Link
              href="/orders/lookup"
              className="inline-flex min-h-11 items-center justify-between rounded-xl border border-white/[0.09] bg-white/[0.035] px-3.5 text-sm font-black text-white transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.05]"
            >
              Track order
              <StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-11 items-center justify-between rounded-xl border border-white/[0.09] bg-white/[0.035] px-3.5 text-sm font-black text-white transition hover:border-violet-300/20 hover:bg-violet-300/[0.05]"
            >
              Contact support
              <StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-5 border-t border-white/[0.07] pt-4 text-[11px] leading-5 text-slate-600">
            Game publishers are independent from Recharza. Their names and artwork
            remain the property of their respective owners.
          </p>
        </aside>
      </div>
    </main>
  );
}
