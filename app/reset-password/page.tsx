import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Reset Password | Recharza",
  description: "Create a new password using a secure Recharza reset link.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <main className="min-h-screen bg-[var(--surface-0)] text-white">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <ResetPasswordForm token={token ?? ""} />
      </section>
    </main>
  );
}
