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
    <section className="mx-auto max-w-xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl" aria-labelledby="reset-password-heading">
      <div className="border-b border-slate-100 bg-slate-50/50 p-8 sm:p-10">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <RecharzaMark compact />
          </span>
          <p className="text-sm font-bold tracking-tight text-slate-900 uppercase tracking-widest">Recharza account recovery</p>
        </div>
        <p className="mt-10 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Security reset</p>
        <h1 id="reset-password-heading" className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Create a new password.</h1>
        <p className="mt-4 text-sm font-medium leading-relaxed text-slate-500">A successful reset revokes existing sessions and requires a fresh sign-in.</p>
      </div>

      <div className="p-8 sm:p-10">
        {!success ? (
          <form onSubmit={submit} className="grid gap-6">
            <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={!token} />
            <PasswordField id="confirm-new-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirm} onToggle={() => setShowConfirm((value) => !value)} disabled={!token} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Use at least 10 characters with a password you do not reuse elsewhere.</p>
            <button disabled={submitting || !token} className="min-h-14 rounded-2xl bg-emerald-600 px-6 text-sm font-bold uppercase tracking-widest text-white shadow-md transition-all hover:-translate-y-1 hover:bg-emerald-700 active:translate-y-0 disabled:cursor-wait disabled:opacity-50">{submitting ? "Resetting password…" : "Reset password"}</button>
          </form>
        ) : <Link href="/account" className="block min-h-14 rounded-2xl bg-emerald-600 px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-white shadow-md transition-all hover:-translate-y-1 hover:bg-emerald-700">Sign in with the new password</Link>}
        <p role={success ? "status" : "alert"} aria-live="polite" className={`mt-6 rounded-2xl border px-5 py-4 text-sm font-bold leading-relaxed ${success ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-100 bg-slate-50 text-slate-500"}`}>{message}</p>
      </div>
    </section>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle, disabled = false }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
      {label}
      <span className="relative block">
        <input
          id={id}
          required
          aria-required="true"
          disabled={disabled}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="10+ characters"
          className="mt-3 min-h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 pr-20 text-base font-bold text-slate-900 outline-none transition-all focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 placeholder:text-slate-400 shadow-inner disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 min-h-9 -translate-y-1/2 rounded-xl px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}
