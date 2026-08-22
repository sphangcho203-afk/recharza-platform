import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RecharzaMark } from "@/components/recharza-mark";
import { StaffLoginForm } from "@/components/staff-login-form";
import { getServerStaffSession } from "@/lib/staff-server-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Sign In | Recharza",
  description: "Private password-protected access for Recharza staff.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    reason?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const session = await getServerStaffSession();
  if (session && !session.mustChangePassword) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[#06070d] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <RecharzaMark />
        </Link>
        <section className="system-panel mt-8 p-5 sm:p-7 border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md rounded-[2rem]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
            Private staff access
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Sign in with your staff credential.
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-400">
            Customer magic links do not authorize staff, operator, or administrator
            routes.
          </p>
          <StaffLoginForm forbidden={reason === "forbidden"} />
        </section>
        <p className="mt-5 text-center text-xs text-slate-600">
          Customer account access remains at{" "}
          <Link href="/account" className="text-violet-400 hover:text-white">
            /account
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
