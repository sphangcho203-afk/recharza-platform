"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { CustomerDashboard } from "@/components/customer-dashboard";
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
  "mt-2 min-h-12 w-full rounded-lg border border-white/[0.09] bg-[#080a10] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10";

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
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) {
        setError(true);
        setMessage(result.message ?? "Sign-in failed.");
        return;
      }
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
    setMessage("");
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
    } catch {
      setError(true);
      setMessage("The account service could not be reached.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-[30rem] animate-pulse rounded-xl border border-white/[0.08] bg-[#0b0d13]" aria-label="Loading account" />;
  }

  if (authenticated && !signupSuccess) return <CustomerDashboard />;

  if (signupSuccess) {
    return (
      <section className="rounded-xl border border-emerald-400/20 bg-[#0b1110] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
            <StorefrontIcon name="shield" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-white">Account created</h2>
            <p className="mt-1 text-sm text-slate-500">Welcome, {signupSuccess.name}. Your account is ready.</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
          <Info label="Username" value={`@${signupSuccess.username}`} />
          <Info label="Email" value={signupSuccess.email} />
          <Info label="Created" value={new Date(signupSuccess.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} />
          <Info label="Welcome email" value={signupSuccess.emailQueued ? "Queued" : "Delivery pending"} />
        </dl>
        <button
          type="button"
          onClick={() => {
            setSignupSuccess(null);
            setAuthenticated(true);
          }}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400"
        >
          Open my account
          <StorefrontIcon name="arrow" className="h-4 w-4" />
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0d13] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="hidden border-r border-white/[0.08] bg-[#090b10] p-7 lg:block">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-white">Everything tied to one account.</h2>
          <div className="mt-6 grid gap-4 text-sm text-slate-400">
            <Benefit icon="track" title="Order history" text="Recover and review account-owned orders." />
            <Benefit icon="shield" title="Protected access" text="Secure sessions, recovery and account controls." />
            <Benefit icon="support" title="Connected support" text="Keep support linked to the correct purchase." />
          </div>
          <p className="mt-8 text-xs leading-5 text-slate-600">Never share your password, OTP, UPI PIN or card PIN with support.</p>
        </aside>

        <div className="p-5 sm:p-7 lg:p-8">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/[0.08] bg-[#07090e] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(false);
                setMessage("");
              }}
              className={`min-h-10 rounded-md text-sm font-black transition ${mode === "login" ? "bg-white text-slate-950" : "text-slate-500 hover:text-white"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(false);
                setMessage("");
              }}
              className={`min-h-10 rounded-md text-sm font-black transition ${mode === "signup" ? "bg-white text-slate-950" : "text-slate-500 hover:text-white"}`}
            >
              Create account
            </button>
          </div>

          <div className="mt-6">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-white">{mode === "login" ? "Welcome back" : "Create your Recharza account"}</h2>
            <p className="mt-1.5 text-sm text-slate-500">{mode === "login" ? "Use the email and password attached to your account." : "One account for checkout, tracking, receipts and support."}</p>
          </div>

          {mode === "login" ? (
            <form onSubmit={submitLogin} className="mt-5 grid gap-4">
              <Field label="Email address">
                <input required type="email" autoComplete="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} className={inputClassName} placeholder="you@example.com" />
              </Field>
              <Field label="Password">
                <input required type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} className={inputClassName} placeholder="Your password" />
              </Field>
              <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-xs font-black text-violet-300 hover:text-violet-200">Forgot password?</Link>
              </div>
              <button disabled={submitting} className="min-h-12 rounded-lg bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60">
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitSignup} className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2">
                <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} placeholder="Your full name" />
              </Field>
              <Field label="Username">
                <input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className={inputClassName} placeholder="username" />
              </Field>
              <Field label="Email address">
                <input required type="email" autoComplete="email" value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} className={inputClassName} placeholder="you@example.com" />
              </Field>
              <Field label="Password">
                <input required type="password" autoComplete="new-password" value={signupPassword} onChange={(event) => setSignupPassword(event.target.value)} className={inputClassName} placeholder="10+ characters" />
              </Field>
              <Field label="Confirm password">
                <input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClassName} placeholder="Repeat password" />
              </Field>
              <p className="text-xs leading-5 text-slate-600 sm:col-span-2">Use at least 10 characters and a password you do not reuse elsewhere.</p>
              <button disabled={submitting} className="min-h-12 rounded-lg bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60 sm:col-span-2">
                {submitting ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          {message ? (
            <p className={`mt-4 rounded-lg border px-3 py-2.5 text-sm ${error ? "border-rose-300/20 bg-rose-300/[0.07] text-rose-100" : "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100"}`}>
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-xs font-black text-slate-400 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function Benefit({ icon, title, text }: { icon: Parameters<typeof StorefrontIcon>[0]["name"]; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-300">
        <StorefrontIcon name={icon} className="h-4 w-4" />
      </span>
      <div>
        <p className="font-black text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0c100f] p-3.5">
      <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">{label}</dt>
      <dd className="mt-1 break-all text-sm font-bold text-slate-200">{value}</dd>
    </div>
  );
}
