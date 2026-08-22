"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Recharza route error", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 py-16 text-slate-900 sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-rose-100 bg-rose-50 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600 font-bold">Something failed</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">The page could not finish loading.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base font-medium">
          Your order and payment state are stored on the server, so retrying the page is safer than repeating an action blindly.
        </p>
        {error.digest ? <p className="mt-3 font-mono text-xs text-rose-400 font-bold">Reference: {error.digest}</p> : null}
        <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
          <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-rose-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95">
            Retry this page
          </button>
          <Link href="/" className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95">
            Return to store
          </Link>
        </div>
      </section>
    </main>
  );
}
