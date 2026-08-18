"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type StaffLoginFormProps = {
  forbidden: boolean;
};

export function StaffLoginForm({ forbidden }: StaffLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(
    forbidden
      ? "That staff account cannot open the requested workspace."
      : "Use the administrator credential created from the private bootstrap command.",
  );
  const [isError, setIsError] = useState(forbidden);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setIsError(false);
    setMessage("Verifying staff credentials...");

    try {
      const response = await fetch("/api/staff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        role?: "admin" | "operator";
        message?: string;
      };
      if (!response.ok || !result.ok || !result.role) {
        throw new Error(result.message ?? "Staff sign-in failed.");
      }

      router.push("/admin");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Staff sign-in failed.",
      );
    } finally {
      setPassword("");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 grid gap-4">
      <label className="text-sm font-semibold text-slate-200">
        Staff email
        <input
          required
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
        />
      </label>
      <label className="text-sm font-semibold text-slate-200">
        Password
        <input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
        />
      </label>
      <button
        disabled={submitting}
        className="min-h-12 rounded-lg bg-violet-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Sign in to staff workspace"}
      </button>
      <p
        aria-live="polite"
        className={`rounded-lg border px-4 py-3 text-sm ${
          isError
            ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
            : "border-white/10 bg-black/15 text-slate-400"
        }`}
      >
        {message}
      </p>
    </form>
  );
}
