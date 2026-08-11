"use client";

import { type FormEvent, useEffect, useState } from "react";

const inputClassName =
  "mt-2 min-h-12 w-full rounded-lg border border-white/[0.09] bg-[#080a10] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10";

type Props = { children: React.ReactNode };

type SessionResult = {
  authenticated?: boolean;
  customer?: { displayName?: string | null; needsDisplayName?: boolean };
};

export function GoogleOAuthNameGate({ children }: Props) {
  const [checking, setChecking] = useState(true);
  const [needsName, setNeedsName] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json() as Promise<SessionResult>)
      .then((result) => {
        if (!active) return;
        setNeedsName(Boolean(result.authenticated && result.customer?.needsDisplayName));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) {
        setError(result.message ?? "We couldn't save your name.");
        return;
      }
      setNeedsName(false);
      window.location.reload();
    } catch {
      setError("The account service could not be reached.");
    } finally {
      setSaving(false);
    }
  }

  if (checking || !needsName) return <>{children}</>;

  return (
    <section className="rounded-xl border border-violet-400/20 bg-[#0b0d13] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">One quick thing</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">What should we call you?</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Choose the name you want to see on your Recharza account. Your Google account stays connected separately.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <label className="text-xs font-black text-slate-400">
          Your name
          <input
            required
            minLength={2}
            maxLength={80}
            autoFocus
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClassName}
            placeholder="e.g. Alex"
          />
        </label>
        {error ? <p className="rounded-lg border border-rose-300/20 bg-rose-300/[0.07] px-3 py-2.5 text-sm text-rose-100">{error}</p> : null}
        <button disabled={saving} className="min-h-12 rounded-lg bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60">
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>
    </section>
  );
}
