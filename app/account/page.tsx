import type { Metadata } from "next";
import Link from "next/link";

import { CustomerDashboard } from "@/components/customer-dashboard";
import { SiteHeader } from "@/components/site-header";
import { sanitizeReturnPath } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Account | Recharza",
  description:
    "Sign in to view orders, saved player details, notifications, rewards, support, and account security.",
};

type AccountPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
    reason?: string | string[];
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const rawReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const rawReason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const returnTo = sanitizeReturnPath(rawReturnTo, "/account");
  const protectedWorkspace =
    returnTo === "/admin" || returnTo === "/staff" || returnTo === "/operator";

  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--surface-0)] text-white">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-[-16rem] h-[32rem] w-[32rem] rounded-full bg-violet-700/16 blur-[130px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link href="/" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
            ← Back to store
          </Link>

          {rawReason === "sign-in" && protectedWorkspace ? (
            <div className="mt-7 max-w-2xl rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-3 text-sm text-cyan-100">
              Verify your email to continue to the protected workspace. The sign-in link will return you to the requested page.
            </div>
          ) : null}

          {rawReason === "forbidden" ? (
            <div className="mt-7 max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-100">
              This verified account does not have permission to open that workspace. Customer features remain available here.
            </div>
          ) : null}

          <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-violet-300">
            Customer dashboard
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Orders, players, rewards, and support in one place.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
            Sign in with a secure email link to access your private order history and customer tools. Live, beta, and planned features are labelled clearly instead of pretending everything already works.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <CustomerDashboard />
      </section>
    </main>
  );
}
