"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  "mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm text-white outline-none transition duration-150 placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50";

type GoogleAuthOutcome = "signup" | "login";

const GOOGLE_RETURN_TO = "/account";

function GoogleContinue({ className = "" }: { className?: string }) {
  return (
    <a
      href={`/api/auth/google?returnTo=${encodeURIComponent(GOOGLE_RETURN_TO)}`}
      className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 px-5 text-sm font-bold text-white shadow-2xl transition duration-150 ease-out hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 active:scale-[0.99] ${className}`}
    >
      <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-white text-xs font-bold text-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]">G</span>
      Continue with Google
    </a>
  );
}

function Divider({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`relative flex items-center ${className}`} aria-hidden="true">
      <span className="flex-1 border-t border-white/10" />
      <span className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className="flex-1 border-t border-white/10" />
    </div>
  );
}

function GoogleOutcomeBanner({ outcome, returnTo }: { outcome: GoogleAuthOutcome; returnTo: string }) {
  const content =
    outcome === "signup"
      ? {
          badge: "Signed up via Google",
          title: "Welcome to Recharza.",
          message: "Your account was created automatically with your Google email. No password needed — just tap Continue with Google next time.",
        }
      : {
          badge: "Signed in via Google",
          title: "Welcome back.",
          message: "You were signed in with your Google account. Your dashboard is ready.",
        };
  return (
    <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3.5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-500/30 bg-white text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">{content.badge}</p>
          <p className="text-sm font-bold text-white">{content.title}</p>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-emerald-400/80">{content.message}</p>
    </div>
  );
}

export function CustomerAccountShell({ showOrders = false, returnTo = "/account", googleAuth = null }: { showOrders?: boolean; returnTo?: string; googleAuth?: GoogleAuthOutcome | null }) {
  const router = useRouter();
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

  useEffect(() => {
    if (!loading && authenticated && !signupSuccess && !showOrders && returnTo !== "/account") {
      router.replace(returnTo);
    }
  }, [authenticated, loading, returnTo, router, showOrders, signupSuccess]);

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
      if (returnTo !== "/account") router.replace(returnTo);
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
    return <div className="min-h-[30rem] animate-pulse rounded-2xl border border-slate-200 bg-slate-50" aria-label="Loading account" />;
  }

  if (authenticated && !signupSuccess) return <CustomerDashboard showOrders={showOrders} />;

  if (signupSuccess) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8" aria-labelledby="account-created-heading">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <StorefrontIcon name="shield" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">Your account is ready</p>
            <h2 id="account-created-heading" className="mt-2 text-2xl font-bold tracking-tight text-white">Welcome to Recharza, {signupSuccess.name}.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Your account is ready for checkout, order tracking, receipts, and support.</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-2 shadow-2xl">
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
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] transition duration-150 ease-out hover:bg-violet-700 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 active:scale-[0.99]"
        >
          Open my account
          <StorefrontIcon name="arrow" className="h-4 w-4" />
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
      <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="relative hidden overflow-hidden border-r border-white/5 bg-white/5 p-8 lg:block">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <RecharzaMark />
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-violet-400">{showOrders ? "Secure order history" : "Your top-up workspace"}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">{showOrders ? "Sign in to view your purchases." : "Everything tied to one account."}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{showOrders ? "Only the signed-in customer can access order history, player destinations, and delivery status." : "Keep checkout, orders, receipts, and support together wherever you play."}</p>
            <div className="mt-8 grid gap-5">
              {showOrders ? <Benefit icon="track" title="Private purchase timeline" text="Review your purchases and delivery status after sign-in." /> : <Benefit icon="track" title="Order history" text="Review purchases and recover receipts in one place." />}
              <Benefit icon="shield" title="Protected access" text="Secure sessions and recovery controls for your account." />
              <Benefit icon="support" title="Connected support" text="Keep support linked to the right order when you need help." />
            </div>
            <p className="mt-10 text-xs leading-5 text-slate-500">Never share your password, OTP, UPI PIN, or card PIN with support.</p>
          </div>
        </aside>

        <div className="p-5 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3 lg:hidden">
            <RecharzaMark compact />
            <div>
              <p className="text-sm font-bold text-white">Recharza</p>
              <p className="text-xs text-slate-400">Top-up, track, play.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1 lg:mt-0 shadow-2xl" role="tablist" aria-label="Account access mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={`min-h-11 rounded-lg px-3 text-sm font-bold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mode === "login" ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-white"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => switchMode("signup")}
              className={`min-h-11 rounded-lg px-3 text-sm font-bold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mode === "signup" ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-white"}`}
            >
              Create account
            </button>
          </div>

          {googleAuth ? (
            <div className="mt-6">
              <GoogleOutcomeBanner outcome={googleAuth} returnTo={returnTo} />
            </div>
          ) : null}

          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-400">{showOrders ? "Order history access" : mode === "login" ? "Welcome back" : "Start with Recharza"}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">{showOrders ? "Open your purchases." : mode === "login" ? "Pick up where you left off." : "Create your account."}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{showOrders ? "Sign in to see your account-owned orders. Guest orders remain available through secure order lookup." : mode === "login" ? "Sign in to checkout, track orders, and keep support connected." : "One account for checkout, tracking, receipts, and support."}</p>
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
                <span className="text-xs text-slate-500">Secure sign-in for your Recharza account.</span>
                <Link href="/forgot-password" className="shrink-0 text-sm font-bold text-violet-400 underline-offset-4 transition hover:text-violet-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Forgot password?</Link>
              </div>
              <button disabled={submitting} className="min-h-12 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] transition duration-150 ease-out hover:bg-violet-700 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-wait disabled:opacity-60">
                {submitting ? "Signing in…" : "Sign in"}
              </button>
              <Divider label="or continue with" />
              <GoogleContinue />
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
              <p className="text-xs leading-5 text-slate-500 sm:col-span-2">Use at least 10 characters and a password you do not reuse elsewhere.</p>
              <button disabled={submitting} className="min-h-12 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] transition duration-150 ease-out hover:bg-violet-700 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-wait disabled:opacity-60 sm:col-span-2">
                {submitting ? "Creating account…" : "Create account"}
              </button>
              <Divider label="or continue with" className="sm:col-span-2" />
              <GoogleContinue className="sm:col-span-2" />
            </form>
          )}

          {message ? (
            <p role={error ? "alert" : "status"} aria-live="polite" className={`mt-5 rounded-xl border px-3.5 py-3 text-sm leading-5 shadow-2xl backdrop-blur-md ${error ? "border-rose-500/20 bg-rose-500/10 text-rose-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"}`}>
              {message}
            </p>
          ) : null}

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">By continuing, you agree to Recharza’s <Link href="/policies/terms" className="text-slate-400 underline underline-offset-4 hover:text-white">Terms</Link> and <Link href="/policies/privacy" className="text-slate-400 underline underline-offset-4 hover:text-white">Privacy Policy</Link>.</p>
        </div>
      </div>
    </section>
  );
}

function Field({ id, label, children, className = "" }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={id} className={`text-sm font-bold text-white ${className}`}>
      {label}
      {children}
    </label>
  );
}

function PasswordInput({ id, value, onChange, visible, onToggle, autoComplete, placeholder = "Your password" }: { id: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; autoComplete: string; placeholder?: string }) {
  return (
    <span className="relative block">
      <input id={id} required aria-required="true" type={visible ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClassName} pr-20`} placeholder={placeholder} />
      <button type="button" onClick={onToggle} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-lg px-2.5 text-xs font-bold text-slate-500 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
        {visible ? "Hide" : "Show"}
      </button>
    </span>
  );
}

function Benefit({ icon, title, text }: { icon: Parameters<typeof StorefrontIcon>[0]["name"]; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(124,58,237,0.2)]"><StorefrontIcon name={icon} className="h-4 w-4" /></span>
      <div><p className="font-bold text-white">{title}</p><p className="mt-0.5 text-xs leading-5 text-slate-400">{text}</p></div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="bg-white/5 p-3.5 border-r border-white/5 last:border-r-0"><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</dt><dd className="mt-1 break-all text-sm font-bold text-white">{value}</dd></div>;
}
