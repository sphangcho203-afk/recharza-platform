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
    <section className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md" aria-labelledby="forgot-password-heading">
      <div className="border-b border-white/5 bg-white/5 p-8 sm:p-10">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
            <RecharzaMark compact />
          </span>
          <p className="text-sm font-bold tracking-tight text-white uppercase tracking-widest">Recharza account recovery</p>
        </div>
        <p className="mt-10 text-[10px] font-bold uppercase tracking-widest text-violet-400">Reset access</p>
        <h1 id="forgot-password-heading" className="mt-2 text-4xl font-bold tracking-tight text-white">Get back into your account.</h1>
        <p className="mt-4 text-sm font-medium leading-relaxed text-slate-400">Enter the email connected to Recharza. If we find an account, we’ll send a single-use reset link that expires after 20 minutes.</p>
      </div>

      <form onSubmit={submit} className="p-8 sm:p-10">
        <label htmlFor="recovery-email" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email address
          <input id="recovery-email" required aria-required="true" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-3 min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-bold text-white outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 placeholder:text-slate-600" />
        </label>
        <button disabled={submitting} className="mt-8 min-h-14 w-full rounded-2xl bg-violet-600 px-6 text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:-translate-y-1 hover:bg-violet-700 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] active:translate-y-0 disabled:cursor-wait disabled:opacity-60">{submitting ? "Sending reset link…" : "Send reset link"}</button>
        {message ? <p role="status" aria-live="polite" className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold leading-relaxed text-emerald-400">{message}</p> : null}
        <Link href="/account" className="mt-8 block text-center text-xs font-bold uppercase tracking-widest text-violet-400 transition-all hover:text-violet-300">Return to account access</Link>
      </form>
    </section>
  );
}
