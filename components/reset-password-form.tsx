"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState(
    token ? "Enter and confirm your new password." : "This reset link is missing its security token.",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setMessage("Securing your new password...");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      setSuccess(Boolean(response.ok && result.ok));
      setMessage(result.message ?? "The password could not be reset.");
    } catch {
      setSuccess(false);
      setMessage("Password reset could not reach the account service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f19] shadow-2xl shadow-black/30">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_50%),rgba(255,255,255,0.025)] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
          Security reset
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          Create a new password.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          A successful reset revokes existing sessions and requires a fresh login.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {!success ? (
          <form onSubmit={submit} className="grid gap-4">
            <label className="text-sm font-semibold text-slate-200">
              New password
              <input
                required
                disabled={!token}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="10+ characters"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-50"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Confirm new password
              <input
                required
                disabled={!token}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-50"
              />
            </label>
            <p className="text-xs leading-5 text-slate-500">
              Use at least 10 characters with uppercase, lowercase, and a number.
            </p>
            <button
              disabled={submitting || !token}
              className="min-h-12 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-50"
            >
              {submitting ? "Resetting password..." : "Reset password"}
            </button>
          </form>
        ) : (
          <Link
            href="/account"
            className="block min-h-12 rounded-xl bg-emerald-400 px-5 py-3.5 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300"
          >
            Sign in with the new password
          </Link>
        )}

        <p
          aria-live="polite"
          className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-6 ${
            success
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-black/20 text-slate-400"
          }`}
        >
          {message}
        </p>
      </div>
    </section>
  );
}
