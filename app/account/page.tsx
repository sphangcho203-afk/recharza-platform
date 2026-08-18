import type { Metadata } from "next";
import Link from "next/link";

import { CustomerAccountShell } from "@/components/customer-account-shell";
import { RecharzaMark } from "@/components/recharza-mark";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { sanitizeReturnPath } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account access | Recharza",
  description: "Sign in or create a Recharza account to checkout, track orders, and manage support securely.",
};

  type AccountPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
    reason?: string | string[];
    authError?: string | string[];
    googleAuth?: string | string[];
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const rawReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const rawReason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const rawAuthError = Array.isArray(params.authError) ? params.authError[0] : params.authError;
  const rawGoogleAuth = Array.isArray(params.googleAuth) ? params.googleAuth[0] : params.googleAuth;
  const googleAuth = rawGoogleAuth === "signup" || rawGoogleAuth === "login" ? rawGoogleAuth : null;
  const returnTo = sanitizeReturnPath(rawReturnTo, "/account");
  const protectedWorkspace = returnTo === "/admin" || returnTo === "/staff" || returnTo === "/operator";

  return (
    <main className="storefront-page min-h-screen overflow-x-clip text-white">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">← Back to store</Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg border border-white/[0.1] bg-white/[0.035]"><RecharzaMark compact /></span>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Recharza account</p>
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Your top-ups, in one place.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">Sign in to checkout, follow deliveries, view receipts, and keep support connected to the right purchase.</p>
          </div>
          <p className="text-sm leading-6 text-slate-500 lg:pb-1 lg:text-right">Secure account access for every game, gift card, and digital delivery on Recharza.</p>
        </div>

        {rawReason === "sign-in" && protectedWorkspace ? <div role="status" className="mt-6 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-100">Sign in with an authorised account to continue to the protected workspace.</div> : null}
        {rawReason === "forbidden" ? <div role="alert" className="mt-6 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100">This account does not have permission to open that workspace.</div> : null}

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 lg:mt-10">
          <CustomerAccountShell returnTo={returnTo} googleAuth={googleAuth} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
