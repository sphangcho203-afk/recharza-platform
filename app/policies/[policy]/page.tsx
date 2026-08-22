import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RecharzaMark } from "@/components/recharza-mark";
import { SiteHeader } from "@/components/site-header";
import { StorefrontIcon } from "@/components/storefront-icon";
import {
  getPublishedPolicy,
  getPublishedStorefrontContent,
  type StorefrontPolicyKey,
} from "@/lib/storefront-content";

export const dynamic = "force-dynamic";

const POLICY_SLUGS: StorefrontPolicyKey[] = ["terms", "privacy", "refunds", "cookies"];

function parsePolicyKey(value: string): StorefrontPolicyKey | null {
  return POLICY_SLUGS.includes(value as StorefrontPolicyKey)
    ? (value as StorefrontPolicyKey)
    : null;
}

function policyParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ policy: string }>;
}): Promise<Metadata> {
  const key = parsePolicyKey((await params).policy);
  if (!key) return { title: "Policy not found | Recharza" };

  const content = await getPublishedStorefrontContent();
  const policy = getPublishedPolicy(content, key);
  if (!policy) return { title: "Policy not found | Recharza" };

  return {
    title: `${policy.title} | Recharza`,
    description: policy.body.slice(0, 200),
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ policy: string }>;
}) {
  const key = parsePolicyKey((await params).policy);
  if (!key) notFound();

  const content = await getPublishedStorefrontContent();
  const policy = getPublishedPolicy(content, key);
  if (!policy) notFound();

  const paragraphs = policyParagraphs(policy.body);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      <section className="border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-bold text-violet-600 transition hover:text-violet-700"
          >
            ← Back to Recharza
          </Link>

          <div className="mt-8 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
              Recharza legal centre
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {policy.title}
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_17rem] lg:px-8">
        <article className="grid gap-4">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 64)}
              className="whitespace-pre-line rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600 sm:p-6 sm:text-[0.95rem] font-medium shadow-sm"
            >
              {paragraph}
            </p>
          ))}
        </article>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24 shadow-sm">
          <RecharzaMark />
          <p className="mt-4 text-sm leading-6 text-slate-500 font-medium">
            Need help applying a policy to an order? Start with private tracking,
            then contact support with the order ID.
          </p>
          <div className="mt-5 grid gap-2">
            <Link
              href="/orders/lookup"
              className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 shadow-sm"
            >
              Track order
              <StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 shadow-sm"
            >
              Contact support
              <StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-5 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500 font-medium">
            Game publishers are independent from Recharza. Their names and artwork
            remain the property of their respective owners.
          </p>
        </aside>
      </div>
    </main>
  );
}
