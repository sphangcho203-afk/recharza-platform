"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("Preparing a secure reset link...");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };
      setMessage(
        result.message ??
          "If an account exists for that email, a reset link has been sent.",
      );
    } catch {
      setMessage(
        "If an account exists for that email, a reset link will be sent when delivery resumes.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f19] shadow-2xl shadow-black/30">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_50%),rgba(255,255,255,0.025)] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
          Account recovery
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          Reset your password.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Enter the email connected to your Recharza account. The reset link is
          single-use and expires after 20 minutes.
        </p>
      </div>

      <form onSubmit={submit} className="p-6 sm:p-8">
        <label className="text-sm font-semibold text-slate-200">
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
          />
        </label>
        <button
          disabled={submitting}
          className="mt-5 min-h-12 w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Sending reset link..." : "Send reset link"}
        </button>

        {message ? (
          <p
            aria-live="polite"
            className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-200"
          >
            {message}
          </p>
        ) : null}

        <Link
          href="/account"
          className="mt-5 block text-center text-sm font-bold text-violet-300 underline underline-offset-4"
        >
          Return to login
        </Link>
      </form>
    </section>
  );
}
