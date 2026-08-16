"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { RecharzaMark } from "@/components/recharza-mark";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState(token ? "Enter and confirm your new password." : "This reset link is missing its security token.");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setMessage("Securing your new password…");
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password, confirmPassword }) });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      setSuccess(Boolean(response.ok && result.ok));
      setMessage(result.message ?? "The password could not be reset.");
    } catch {
      setSuccess(false);
      setMessage("Password reset could not reach the account service. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl overflow-hidden rounded-lg border border-white/[0.1] bg-[#0b0d13] shadow-elevation-2" aria-labelledby="reset-password-heading">
      <div className="border-b border-white/[0.1] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_52%),rgba(255,255,255,0.025)] p-6 sm:p-8">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.1] bg-[#0b0d13]"><RecharzaMark compact /></span><p className="text-sm font-semibold text-white">Recharza account recovery</p></div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Security reset</p>
        <h1 id="reset-password-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Create a new password.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">A successful reset revokes existing sessions and requires a fresh sign-in.</p>
      </div>

      <div className="p-6 sm:p-8">
        {!success ? (
          <form onSubmit={submit} className="grid gap-5">
            <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={!token} />
            <PasswordField id="confirm-new-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirm} onToggle={() => setShowConfirm((value) => !value)} disabled={!token} />
            <p className="text-xs leading-5 text-slate-500">Use at least 10 characters with a password you do not reuse elsewhere.</p>
            <button disabled={submitting || !token} className="min-h-12 rounded-lg bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition duration-150 ease-out hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d13] active:scale-[0.99] disabled:cursor-wait disabled:opacity-50">{submitting ? "Resetting password…" : "Reset password"}</button>
          </form>
        ) : <Link href="/account" className="block min-h-12 rounded-lg bg-emerald-400 px-5 py-3.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70">Sign in with the new password</Link>}
        <p role={success ? "status" : "alert"} aria-live="polite" className={`mt-5 rounded-lg border px-4 py-3 text-sm leading-6 ${success ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-white/[0.1] bg-black/20 text-slate-400"}`}>{message}</p>
      </div>
    </section>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle, disabled = false }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; disabled?: boolean }) {
  return <label htmlFor={id} className="text-sm font-semibold text-slate-300">{label}<span className="relative block"><input id={id} required aria-required="true" disabled={disabled} type={visible ? "text" : "password"} autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} placeholder="10+ characters" className="mt-2 min-h-12 w-full rounded-lg border border-white/[0.12] bg-[#080a10] px-3.5 pr-20 text-sm text-white outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/15 placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50" /><button type="button" onClick={onToggle} disabled={disabled} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 disabled:opacity-50">{visible ? "Hide" : "Show"}</button></span></label>;
}
