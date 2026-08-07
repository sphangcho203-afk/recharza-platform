import type { Metadata } from "next";
import Link from "next/link";

import { CustomerAccountShell } from "@/components/customer-account-shell";
import { GoogleOAuthPanel } from "@/components/google-oauth-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { sanitizeReturnPath } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Account | Recharza",
  description: "Create an account or sign in to view Recharza orders and manage account access.",
};

type AccountPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
    reason?: string | string[];
    authError?: string | string[];
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const rawReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const rawReason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const rawAuthError = Array.isArray(params.authError) ? params.authError[0] : params.authError;
  const returnTo = sanitizeReturnPath(rawReturnTo, "/account");
  const protectedWorkspace = returnTo === "/admin" || returnTo === "/staff" || returnTo === "/operator";

  return (
    <main className="storefront-page min-h-screen overflow-x-clip text-white">
      <SiteHeader />
      <section className="mx-auto max-w-[980px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link href="/" className="text-xs font-black text-slate-500 transition hover:text-white">← Back to store</Link>

        <div className="mt-5">
          <h1 className="text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">Account access</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Sign in to checkout, recover orders, view receipts and keep support linked to the right purchase.</p>
        </div>

        {rawReason === "sign-in" && protectedWorkspace ? (
          <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-100">
            Sign in with an authorised account to continue to the protected workspace.
          </div>
        ) : null}

        {rawReason === "forbidden" ? (
          <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100">
            This account does not have permission to open that workspace.
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          <GoogleOAuthPanel returnTo={returnTo} authError={rawAuthError} />
          <CustomerAccountShell />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
