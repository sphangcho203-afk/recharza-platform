"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RecharzaMark } from "@/components/recharza-mark";

type GoogleOAuthPanelProps = {
  returnTo: string;
  authError?: string;
  googleAuth?: "signup" | "login" | null;
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

const googleOutcome = {
  signup: {
    badge: "Signed up via Google",
    title: "Welcome to Recharza.",
    message:
      "Your account was created automatically with your Google email. No password needed — just tap Continue with Google next time.",
  },
  login: {
    badge: "Signed in via Google",
    title: "Welcome back.",
    message:
      "You were signed in with your Google account and taken straight to your dashboard.",
  },
} as const;

export function GoogleOAuthPanel({ returnTo, authError, googleAuth }: GoogleOAuthPanelProps) {
  const [visible, setVisible] = useState(false);
  const message = authError ? (errorMessages[authError] ?? "") : "";
  const outcome = googleAuth ? googleOutcome[googleAuth] : null;
  const href = useMemo(() => `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`, [returnTo]);

  // When returning from Google OAuth, the outcome banner must render immediately
  // — the session cookie arrives with the redirect, so waiting for the session
  // fetch would skip the banner entirely (visible only when unauthenticated).
  const showOutcomeImmediately = Boolean(outcome);

  useEffect(() => {
    if (showOutcomeImmediately) return;
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
  }, [showOutcomeImmediately]);

  if (!showOutcomeImmediately && !visible) return null;
  if (outcome) {
    return (
      <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-4 shadow-elevation-1 sm:p-5" aria-labelledby="google-outcome-heading">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/[0.12] text-emerald-200" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">{outcome.badge}</p>
            <h2 id="google-outcome-heading" className="mt-1 text-sm font-semibold text-white">{outcome.title}</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-emerald-100/80">{outcome.message}</p>
        <Link
          href={returnTo === "/account" ? "/" : returnTo}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-400 px-5 text-sm font-semibold text-[#062c23] transition duration-150 ease-out hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 active:scale-[0.99]"
        >
          Continue →
        </Link>
      </section>
    );
  }

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
