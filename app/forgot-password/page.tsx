import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Forgot Password | Recharza",
  description: "Request a secure single-use Recharza password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] text-white">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
