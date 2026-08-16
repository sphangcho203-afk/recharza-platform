"use client";

import { useEffect, useMemo, useState } from "react";

import { RecharzaMark } from "@/components/recharza-mark";

type GoogleOAuthPanelProps = {
  returnTo: string;
  authError?: string;
};

const errorMessages: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled. You can try again or use email.",
  google_state: "The Google sign-in request expired. Start again to continue securely.",
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
    <section className="rounded-lg border border-white/[0.1] bg-white/[0.035] p-4 shadow-elevation-1 sm:p-5" aria-labelledby="google-login-heading">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/[0.1] bg-[#0b0d13]">
          <RecharzaMark compact />
        </span>
        <div className="min-w-0">
          <h2 id="google-login-heading" className="text-sm font-semibold text-white">Fast, secure sign-in</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">Use your Google account to continue to Recharza.</p>
        </div>
      </div>

      <a
        href={href}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-white/[0.12] bg-white px-5 text-sm font-semibold text-slate-950 transition duration-150 ease-out hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11131b] active:scale-[0.99]"
      >
        <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full border border-slate-300 bg-white text-sm font-bold text-blue-600">G</span>
        Continue with Google
      </a>

      <div className="my-4 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/[0.1]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">or use email</span>
        <span className="h-px flex-1 bg-white/[0.1]" />
      </div>

      {message ? (
        <p role="alert" className="rounded-lg border border-rose-400/25 bg-rose-400/[0.08] px-3 py-2.5 text-sm leading-5 text-rose-100">{message}</p>
      ) : null}
    </section>
  );
}
