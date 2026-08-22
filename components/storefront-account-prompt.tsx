"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";

type SessionState = "loading" | "authenticated" | "signed-out";

type SessionResponse = {
  authenticated?: boolean;
  customer?: {
    displayName?: string | null;
    username?: string | null;
  };
};

export function StorefrontAccountPrompt() {
  const [state, setState] = useState<SessionState>("loading");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store", credentials: "include" })
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((result) => {
        if (!active) return;
        const authenticated = Boolean(result.authenticated);
        setState(authenticated ? "authenticated" : "signed-out");
        setDisplayName(result.customer?.displayName?.trim() || result.customer?.username?.trim() || "there");
      })
      .catch(() => {
        if (active) setState("signed-out");
      });

    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <section className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8" aria-label="Checking account status">
        <div className="storefront-support-panel min-h-44 animate-pulse border border-slate-200 bg-white shadow-xl">
          <div className="space-y-3">
            <div className="h-3 w-32 rounded-full bg-slate-100" />
            <div className="h-8 w-full max-w-xl rounded-lg bg-slate-100" />
            <div className="h-4 w-full max-w-2xl rounded bg-slate-50" />
          </div>
          <div className="h-12 w-40 rounded-lg bg-slate-100" />
        </div>
      </section>
    );
  }

  const authenticated = state === "authenticated";

  return (
    <section id="offers" className="mx-auto max-w-[1240px] scroll-mt-32 px-4 py-12 sm:px-6 lg:px-8">
      <div className="storefront-support-panel border border-slate-200 bg-white shadow-xl">
        <div>
          <div className="storefront-section-label text-violet-600">{authenticated ? "Account ready" : "Ready when you are"}</div>
          <h2 className="mt-3 max-w-xl font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {authenticated ? `Welcome back, ${displayName}.` : "A cleaner way to keep every top-up in one place."}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 font-medium">
            {authenticated
              ? "Your account is active. Review orders, saved destinations, billing details, and support from one workspace."
              : "Open an account to keep order history together, or go straight to support if you already have a question."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link href={authenticated ? "/account" : "/account"} className="storefront-primary-cta shadow-md transition-shadow hover:shadow-lg">
            {authenticated ? "Go to account" : "Open account"} <StorefrontIcon name="arrow" className="h-4 w-4" />
          </Link>
          <Link href="/support" className="storefront-secondary-cta border-slate-200 text-slate-600 hover:bg-slate-50">Contact support</Link>
        </div>
      </div>
    </section>
  );
}
