"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { CustomerDashboard } from "@/components/customer-dashboard";
import { RecharzaMark } from "@/components/recharza-mark";
import { StorefrontIcon } from "@/components/storefront-icon";

type AuthMode = "login" | "signup";

type SignupSuccess = {
  name: string;
  username: string;
  email: string;
  createdAt: string;
  emailQueued: boolean;
};

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#08080f] px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15";

const accountBenefits = [
  ["track", "One place for every order"],
  ["games", "Save repeat game destinations"],
  ["shield", "Protected account and recovery"],
] as const;

export function CustomerAccountShell() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState<SignupSuccess | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated?: boolean }) => {
        if (active) setAuthenticated(Boolean(result.authenticated));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);
    setMessage("Signing in securely...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        setError(true);
        setMessage(result.message ?? "Sign-in failed.");
        return;
      }

      setMessage(result.message ?? "Signed in successfully.");
      setAuthenticated(true);
    } catch {
      setError(true);
      setMessage("The sign-in service could not be reached.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(false);
    setMessage("Creating your Recharza account...");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email: signupEmail,
          password: signupPassword,
          confirmPassword,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        emailQueued?: boolean;
        customer?: {
          name?: string | null;
          username?: string | null;
          email: string;
          createdAt: string;
        };
      };

      if (!response.ok || !result.ok || !result.customer) {
        setError(true);
        setMessage(result.message ?? "The account could not be created.");
        return;
      }

      setSignupSuccess({
        name: result.customer.name ?? name,
        username: result.customer.username ?? username,
        email: result.customer.email,
        createdAt: result.customer.createdAt,
        emailQueued: Boolean(result.emailQueued),
      });
      setMessage(result.message ?? "Account created successfully.");
    } catch {
      setError(true);
      setMessage("The account service could not be reached.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[0.8fr_1.2fr]" aria-label="Loading account">
        <div className="hidden min-h-[34rem] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.025] lg:block" />
        <div className="min-h-[34rem] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.035]" />
      </div>
    );
  }

  if (authenticated && !signupSuccess) {
    return <CustomerDashboard />;
  }

  if (signupSuccess) {
    return (
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[#0b1112] shadow-[0_34px_100px_rgba(0,0,0,0.4)]">
        <div className="grid gap-8 border-b border-emerald-400/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_48%)] p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <span className="grid h-20 w-20 place-items-center rounded-3xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
            <StorefrontIcon name="shield" className="h-9 w-9" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Account ready
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
              Welcome, {signupSuccess.name}.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your Recharza workspace is ready for orders, saved destinations, receipts, and support.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <dl className="grid overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-sm sm:grid-cols-2">
            {[
              ["Username", `@${signupSuccess.username}`],
              ["Email", signupSuccess.email],
              [
                "Created",
                new Date(signupSuccess.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              ],
              [
                "Welcome email",
                signupSuccess.emailQueued ? "Queued successfully" : "Retry scheduled",
              ],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-white/10 p-4 odd:sm:border-r last:border-b-0">
                <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {label}
                </dt>
                <dd className="mt-2 break-all font-bold text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <button
            type="button"
            onClick={() => {
              setSignupSuccess(null);
              setAuthenticated(true);
            }}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-emerald-200"
          >
            Open my account
            <StorefrontIcon name="arrow" className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b12] shadow-[0_34px_110px_rgba(0,0,0,0.42)] lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/[0.08] bg-[#08080e] p-8 lg:flex lg:min-h-[40rem] lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(124,58,237,0.28),transparent_42%),radial-gradient(circle_at_90%_85%,rgba(34,211,238,0.12),transparent_38%)]" />
        <div className="relative">
          <RecharzaMark />
          <p className="mt-10 text-xs font-black uppercase tracking-[0.2em] text-violet-300">
            Customer workspace
          </p>
          <h2 className="mt-4 max-w-sm text-4xl font-black tracking-[-0.06em] text-white">
            Your game purchases, organized properly.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
            Sign in once to recover carts, review receipts, track fulfilment, and keep support tied to the correct order.
          </p>

          <div className="mt-8 space-y-3">
            {accountBenefits.map(([icon, label]) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-300/10 text-violet-200">
                  <StorefrontIcon name={icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm font-bold text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs leading-5 text-slate-600">
          Recharza will never request your password, OTP, UPI PIN, or card PIN through support.
        </p>
      </aside>

      <div className="p-5 sm:p-7 lg:p-9">
        <div className="lg:hidden">
          <RecharzaMark />
        </div>

        <header className="mt-7 lg:mt-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            Account access
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
            {mode === "login" ? "Welcome back." : "Create your account."}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {mode === "login"
              ? "Open your orders, cart, saved game destinations, billing records, and security settings."
              : "Create one secure workspace for checkout, tracking, receipts, and support."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
            {(["login", "signup"] as AuthMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setMessage("");
                  setError(false);
                }}
                className={`min-h-11 rounded-lg px-4 py-2.5 text-sm font-black transition ${
                  mode === item
                    ? "bg-white text-slate-950 shadow-lg shadow-black/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        </header>

        <div className="mt-6">
          {mode === "login" ? (
            <form onSubmit={submitLogin} className="grid gap-4">
              <label className="text-sm font-semibold text-slate-200">
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className={inputClassName}
                  placeholder="you@example.com"
                />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className={inputClassName}
                  placeholder="Your password"
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-600">Secure password sign-in</span>
                <Link href="/forgot-password" className="text-sm font-bold text-violet-300 hover:text-violet-200">
                  Forgot password?
                </Link>
              </div>
              <button
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-violet-100 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Sign in to Recharza"}
                {!submitting ? <StorefrontIcon name="arrow" className="h-4 w-4" /> : null}
              </button>
            </form>
          ) : (
            <form onSubmit={submitSignup} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-200 sm:col-span-2">
                Full name
                <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} placeholder="Your full name" />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Username
                <input
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className={inputClassName}
                  placeholder="username"
                />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Email address
                <input required type="email" autoComplete="email" value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} className={inputClassName} placeholder="you@example.com" />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Password
                <input required type="password" autoComplete="new-password" value={signupPassword} onChange={(event) => setSignupPassword(event.target.value)} className={inputClassName} placeholder="10+ characters" />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Confirm password
                <input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClassName} placeholder="Repeat password" />
              </label>
              <p className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-3 text-xs leading-5 text-slate-500 sm:col-span-2">
                Use at least 10 characters with uppercase, lowercase, and a number. By creating an account you agree to Recharza&apos;s Terms and Privacy Policy.
              </p>
              <button
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-violet-100 disabled:cursor-wait disabled:opacity-60 sm:col-span-2"
              >
                {submitting ? "Creating account..." : "Create Recharza account"}
                {!submitting ? <StorefrontIcon name="arrow" className="h-4 w-4" /> : null}
              </button>
            </form>
          )}

          {message ? (
            <p
              aria-live={error ? "assertive" : "polite"}
              className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                error
                  ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                  : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
