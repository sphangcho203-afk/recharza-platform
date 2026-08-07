"use client";

import { useEffect, useMemo, useState } from "react";

type GoogleOAuthPanelProps = {
  returnTo: string;
  authError?: string;
};

const errorMessages: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_state: "The Google sign-in request expired or could not be verified. Please try again.",
  google_response: "Google did not return a valid sign-in response. Please try again.",
  google_account: "Google could not provide a verified email address for this account.",
  google_restricted: "Sign-in is restricted for this Recharza account. Contact support.",
  google_conflict: "This email is already linked to another sign-in identity. Contact support before retrying.",
  google_unavailable: "Google sign-in is temporarily unavailable. Email and password access still works.",
};

export function GoogleOAuthPanel({ returnTo, authError }: GoogleOAuthPanelProps) {
  const [visible, setVisible] = useState(false);
  const message = authError ? (errorMessages[authError] ?? "") : "";
  const href = useMemo(() => `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`, [returnTo]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated?: boolean }) => {
        if (active) setVisible(!result.authenticated);
      })
      .catch(() => {
        if (active) setVisible(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!visible) return null;

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#0b0d13] p-4 sm:p-5">
      <a
        href={href}
        className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
      >
        <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full border border-slate-300 bg-white text-sm font-black text-blue-600">G</span>
        Continue with Google
      </a>
      <div className="my-3 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">or use email</span>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>
      {message ? (
        <p aria-live="assertive" className="rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-3 py-2.5 text-sm text-rose-200">{message}</p>
      ) : null}
    </section>
  );
}
