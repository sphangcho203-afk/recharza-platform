"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { RecharzaMark } from "@/components/recharza-mark";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("Preparing a secure reset link…");

    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      setMessage(result.message ?? "If an account exists for that email, a reset link has been sent.");
    } catch {
      setMessage("If an account exists for that email, a reset link will be sent when delivery resumes.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl overflow-hidden rounded-lg border border-white/[0.1] bg-[#0b0d13] shadow-elevation-2" aria-labelledby="forgot-password-heading">
      <div className="border-b border-white/[0.1] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_52%),rgba(255,255,255,0.025)] p-6 sm:p-8">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.1] bg-[#0b0d13]"><RecharzaMark compact /></span><p className="text-sm font-semibold text-white">Recharza account recovery</p></div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">Reset access</p>
        <h1 id="forgot-password-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Get back into your account.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Enter the email connected to Recharza. If we find an account, we’ll send a single-use reset link that expires after 20 minutes.</p>
      </div>

      <form onSubmit={submit} className="p-6 sm:p-8">
        <label htmlFor="recovery-email" className="text-sm font-semibold text-slate-300">Email address
          <input id="recovery-email" required aria-required="true" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 min-h-12 w-full rounded-lg border border-white/[0.12] bg-[#080a10] px-3.5 text-sm text-white outline-none transition focus:border-violet-300/70 focus:ring-2 focus:ring-violet-300/15 placeholder:text-slate-600" />
        </label>
        <button disabled={submitting} className="mt-6 min-h-12 w-full rounded-lg bg-violet-500 px-5 text-sm font-semibold text-white transition duration-150 ease-out hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d13] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">{submitting ? "Sending reset link…" : "Send reset link"}</button>
        {message ? <p role="status" aria-live="polite" className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-200">{message}</p> : null}
        <Link href="/account" className="mt-6 block text-center text-sm font-semibold text-violet-300 underline-offset-4 transition hover:text-violet-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">Return to account access</Link>
      </form>
    </section>
  );
}
