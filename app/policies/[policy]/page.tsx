import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import {
  getPublishedPolicy,
  getPublishedStorefrontContent,
  STOREFRONT_POLICY_KEYS,
  type StorefrontPolicyKey,
} from "@/lib/storefront-content";

export const dynamic = "force-dynamic";

function parsePolicyKey(value: string): StorefrontPolicyKey | null {
  return STOREFRONT_POLICY_KEYS.includes(value as StorefrontPolicyKey)
    ? (value as StorefrontPolicyKey)
    : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ policy: string }>;
}): Promise<Metadata> {
  const { policy: rawPolicy } = await params;
  const key = parsePolicyKey(rawPolicy);
  if (!key) return { title: "Policy not found | Recharza" };

  const content = await getPublishedStorefrontContent();
  const policy = getPublishedPolicy(content, key);
  if (!policy) return { title: "Policy not found | Recharza" };

  return {
    title: `${policy.title} | Recharza`,
    description: `${policy.title} for the Recharza game top-up platform.`,
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ policy: string }>;
}) {
  const { policy: rawPolicy } = await params;
  const key = parsePolicyKey(rawPolicy);
  if (!key) notFound();

  const content = await getPublishedStorefrontContent();
  const policy = getPublishedPolicy(content, key);
  if (!policy) notFound();

  const sections = policy.body
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-[var(--surface-0)] text-white">
      <SiteHeader content={content} />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
        >
          ← Back to Recharza
        </Link>

        <article className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
          <header className="border-b border-white/10 px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              Published Recharza policy
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              {policy.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              This page displays the latest reviewed version published through the protected storefront content system.
            </p>
          </header>

          <div className="grid gap-5 px-5 py-6 sm:px-8 sm:py-8">
            {sections.map((section, index) => {
              const lines = section.split("\n").map((line) => line.trim());
              const possibleHeading = lines[0] ?? "";
              const hasHeading =
                lines.length > 1 &&
                possibleHeading.length <= 100 &&
                !/[.!?]$/.test(possibleHeading);

              return (
                <section
                  key={`${index}-${possibleHeading}`}
                  className="rounded-2xl border border-white/8 bg-black/15 p-5"
                >
                  {hasHeading ? (
                    <h2 className="text-lg font-black text-white">
                      {possibleHeading}
                    </h2>
                  ) : null}
                  <div className={`${hasHeading ? "mt-3" : ""} grid gap-3`}>
                    {(hasHeading ? lines.slice(1) : lines).map((line, lineIndex) => (
                      <p
                        key={`${lineIndex}-${line.slice(0, 24)}`}
                        className="whitespace-pre-wrap text-sm leading-7 text-slate-400"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </article>
      </div>
    </main>
  );
}
