"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { CustomerDashboard } from "@/components/customer-dashboard";

type AuthMode = "login" | "signup";

type SignupSuccess = {
  name: string;
  username: string;
  email: string;
  createdAt: string;
  emailQueued: boolean;
};

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15";

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
      <div className="mx-auto max-w-3xl space-y-3" aria-label="Loading account">
        <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.035]" />
        <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/[0.025]" />
      </div>
    );
  }

  if (authenticated && !signupSuccess) {
    return <CustomerDashboard />;
  }

  if (signupSuccess) {
    return (
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#10151a] shadow-2xl shadow-black/30">
        <div className="border-b border-emerald-400/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_48%),rgba(255,255,255,0.025)] p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
            Account created successfully
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Welcome to Recharza, {signupSuccess.name}.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your credentials are secured and your account workspace is ready.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <dl className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-sm">
            {[
              ["Username", `@${signupSuccess.username}`],
              ["Email", signupSuccess.email],
              [
                "Created",
                new Date(signupSuccess.createdAt).toLocaleString("en-IN", {
                  dateStyle: "full",
                  timeStyle: "short",
                }),
              ],
              [
                "Account email",
                signupSuccess.emailQueued
                  ? "Sent through Recharza mail"
                  : "Queued for retry",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 border-b border-white/10 px-4 py-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:items-center"
              >
                <dt className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {label}
                </dt>
                <dd className="break-all font-bold text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <button
            type="button"
            onClick={() => {
              setSignupSuccess(null);
              setAuthenticated(true);
            }}
            className="mt-5 min-h-12 w-full rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
          >
            Open my account
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f19] shadow-2xl shadow-black/30">
      <header className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_50%),rgba(255,255,255,0.025)] p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
          Recharza account access
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
          {mode === "login" ? "Welcome back." : "Create your account."}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {mode === "login"
            ? "Use your email and password to open orders, cart, saved players, billing, and security."
            : "One account for checkout, order history, cart recovery, and support."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
          {(["login", "signup"] as AuthMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setMessage("");
                setError(false);
              }}
              className={`min-h-11 rounded-lg px-4 py-2.5 text-sm font-black capitalize transition ${
                mode === item
                  ? "bg-violet-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {item === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>
      </header>

      <div className="p-5 sm:p-7">
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
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-bold text-violet-300 underline underline-offset-4 hover:text-violet-200"
              >
                Forgot password?
              </Link>
            </div>
            <button
              disabled={submitting}
              className="min-h-12 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitSignup} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-200 sm:col-span-2">
              Full name
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClassName}
                placeholder="Your full name"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Username
              <input
                required
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                className={inputClassName}
                placeholder="username"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={signupEmail}
                onChange={(event) => setSignupEmail(event.target.value)}
                className={inputClassName}
                placeholder="you@example.com"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                className={inputClassName}
                placeholder="10+ characters"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Confirm password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClassName}
                placeholder="Repeat password"
              />
            </label>
            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
              Passwords require at least 10 characters with uppercase, lowercase,
              and a number.
            </p>
            <button
              disabled={submitting}
              className="min-h-12 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60 sm:col-span-2"
            >
              {submitting ? "Creating account..." : "Create account"}
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
    </section>
  );
}
