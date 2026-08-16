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
  "mt-2 min-h-12 w-full rounded-lg border border-white/[0.12] bg-[#080a10] px-3.5 text-sm text-white outline-none transition duration-150 placeholder:text-slate-600 focus:border-violet-300/70 focus:ring-2 focus:ring-violet-300/15 disabled:cursor-not-allowed disabled:opacity-50";

export function CustomerAccountShell() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState<SignupSuccess | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(false);
    setMessage("");
  }

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
        setMessage(result.message ?? "Sign-in failed. Check your details and try again.");
        return;
      }
      setAuthenticated(true);
    } catch {
      setError(true);
      setMessage("The sign-in service could not be reached. Try again in a moment.");
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
        body: JSON.stringify({ name, username, email: signupEmail, password: signupPassword, confirmPassword }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        emailQueued?: boolean;
        customer?: { name?: string | null; username?: string | null; email: string; createdAt: string };
      };
      if (!response.ok || !result.ok || !result.customer) {
        setError(true);
        setMessage(result.message ?? "The account could not be created. Check the details and try again.");
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
      setMessage("The account service could not be reached. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-[30rem] animate-pulse rounded-lg border border-white/[0.1] bg-[#0b0d13]" aria-label="Loading account" />;
  }

  if (authenticated && !signupSuccess) return <CustomerDashboard />;

  if (signupSuccess) {
    return (
      <section className="mx-auto max-w-2xl rounded-lg border border-emerald-300/20 bg-[#0b1110] p-6 shadow-elevation-1 sm:p-8" aria-labelledby="account-created-heading">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
            <StorefrontIcon name="shield" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Your account is ready</p>
            <h2 id="account-created-heading" className="mt-2 text-2xl font-semibold tracking-tight text-white">Welcome to Recharza, {signupSuccess.name}.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Your account is ready for checkout, order tracking, receipts, and support.</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-lg border border-white/[0.1] bg-white/[0.1] sm:grid-cols-2">
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
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-semibold text-white transition duration-150 ease-out hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1110] active:scale-[0.99]"
        >
          Open my account
          <StorefrontIcon name="arrow" className="h-4 w-4" />
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-white/[0.1] bg-[#0b0d13] shadow-elevation-2">
      <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="relative hidden overflow-hidden border-r border-white/[0.1] bg-[#090b10] p-8 lg:block">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <RecharzaMark />
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Your top-up workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Everything tied to one account.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Keep checkout, orders, receipts, and support together wherever you play.</p>
            <div className="mt-8 grid gap-5">
              <Benefit icon="track" title="Order history" text="Review purchases and recover receipts in one place." />
              <Benefit icon="shield" title="Protected access" text="Secure sessions and recovery controls for your account." />
              <Benefit icon="support" title="Connected support" text="Keep support linked to the right order when you need help." />
            </div>
            <p className="mt-10 text-xs leading-5 text-slate-600">Never share your password, OTP, UPI PIN, or card PIN with support.</p>
          </div>
        </aside>

        <div className="p-5 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3 lg:hidden">
            <RecharzaMark compact />
            <div>
              <p className="text-sm font-semibold text-white">Recharza</p>
              <p className="text-xs text-slate-500">Top-up, track, play.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-white/[0.1] bg-[#07090e] p-1 lg:mt-0" role="tablist" aria-label="Account access mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 ${mode === "login" ? "bg-white text-slate-950 shadow-elevation-1" : "text-slate-500 hover:text-white"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => switchMode("signup")}
              className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 ${mode === "signup" ? "bg-white text-slate-950 shadow-elevation-1" : "text-slate-500 hover:text-white"}`}
            >
              Create account
            </button>
          </div>

          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">{mode === "login" ? "Welcome back" : "Start with Recharza"}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{mode === "login" ? "Pick up where you left off." : "Create your account."}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{mode === "login" ? "Sign in to checkout, track orders, and keep support connected." : "One account for checkout, tracking, receipts, and support."}</p>
          </div>

          {mode === "login" ? (
            <form onSubmit={submitLogin} className="mt-7 grid gap-5" noValidate>
              <Field id="login-email" label="Email address">
                <input id="login-email" required aria-required="true" type="email" autoComplete="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} className={inputClassName} placeholder="you@example.com" />
              </Field>
              <Field id="login-password" label="Password">
                <PasswordInput id="login-password" value={loginPassword} onChange={setLoginPassword} visible={showLoginPassword} onToggle={() => setShowLoginPassword((value) => !value)} autoComplete="current-password" />
              </Field>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-600">Secure sign-in for your Recharza account.</span>
                <Link href="/forgot-password" className="shrink-0 text-sm font-semibold text-violet-300 underline-offset-4 transition hover:text-violet-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">Forgot password?</Link>
              </div>
              <button disabled={submitting} className="min-h-12 rounded-lg bg-violet-500 px-5 text-sm font-semibold text-white transition duration-150 ease-out hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d13] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitSignup} className="mt-7 grid gap-5 sm:grid-cols-2" noValidate>
              <Field id="signup-name" label="Full name" className="sm:col-span-2">
                <input id="signup-name" required aria-required="true" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} placeholder="Your full name" />
              </Field>
              <Field id="signup-username" label="Username">
                <input id="signup-username" required aria-required="true" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className={inputClassName} placeholder="username" />
              </Field>
              <Field id="signup-email" label="Email address">
                <input id="signup-email" required aria-required="true" type="email" autoComplete="email" value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} className={inputClassName} placeholder="you@example.com" />
              </Field>
              <Field id="signup-password" label="Password">
                <PasswordInput id="signup-password" value={signupPassword} onChange={setSignupPassword} visible={showSignupPassword} onToggle={() => setShowSignupPassword((value) => !value)} autoComplete="new-password" placeholder="10+ characters" />
              </Field>
              <Field id="confirm-password" label="Confirm password">
                <PasswordInput id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} autoComplete="new-password" placeholder="Repeat password" />
              </Field>
              <p className="text-xs leading-5 text-slate-600 sm:col-span-2">Use at least 10 characters and a password you do not reuse elsewhere.</p>
              <button disabled={submitting} className="min-h-12 rounded-lg bg-violet-500 px-5 text-sm font-semibold text-white transition duration-150 ease-out hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d13] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 sm:col-span-2">
                {submitting ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          {message ? (
            <p role={error ? "alert" : "status"} aria-live="polite" className={`mt-5 rounded-lg border px-3.5 py-3 text-sm leading-5 ${error ? "border-rose-300/25 bg-rose-300/[0.07] text-rose-100" : "border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-100"}`}>
              {message}
            </p>
          ) : null}

          <p className="mt-6 text-center text-xs leading-5 text-slate-600">By continuing, you agree to Recharza’s <Link href="/policies/terms" className="text-slate-400 underline underline-offset-4 hover:text-white">Terms</Link> and <Link href="/policies/privacy" className="text-slate-400 underline underline-offset-4 hover:text-white">Privacy Policy</Link>.</p>
        </div>
      </div>
    </section>
  );
}

function Field({ id, label, children, className = "" }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={id} className={`text-sm font-semibold text-slate-300 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function PasswordInput({ id, value, onChange, visible, onToggle, autoComplete, placeholder = "Your password" }: { id: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; autoComplete: string; placeholder?: string }) {
  return (
    <span className="relative block">
      <input id={id} required aria-required="true" type={visible ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClassName} pr-20`} placeholder={placeholder} />
      <button type="button" onClick={onToggle} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">
        {visible ? "Hide" : "Show"}
      </button>
    </span>
  );
}

function Benefit({ icon, title, text }: { icon: Parameters<typeof StorefrontIcon>[0]["name"]; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-300"><StorefrontIcon name={icon} className="h-4 w-4" /></span>
      <div><p className="font-semibold text-white">{title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{text}</p></div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#0c100f] p-3.5"><dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">{label}</dt><dd className="mt-1 break-all text-sm font-semibold text-slate-200">{value}</dd></div>;
}
