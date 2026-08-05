"use client";

import { useEffect, useMemo, useState } from "react";

type GoogleOAuthPanelProps = {
  returnTo: string;
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

export function GoogleOAuthPanel({ returnTo }: GoogleOAuthPanelProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  const href = useMemo(
    () => `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`,
    [returnTo],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("authError");
    if (authError && errorMessages[authError]) {
      setMessage(errorMessages[authError]);
    }

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
    <section className="mx-auto mb-4 max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f19] p-5 shadow-2xl shadow-black/20 sm:p-7">
      <a
        href={href}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
      >
        <span
          aria-hidden="true"
          className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 bg-white text-base font-black text-blue-600"
        >
          G
        </span>
        Continue with Google
      </a>

      <div className="my-4 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
          or use Recharza credentials
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <p className="text-center text-xs leading-5 text-slate-500">
        Google verifies your email. Recharza creates the same secure account session used by email and password login.
      </p>

      {message ? (
        <p
          aria-live="assertive"
          className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
