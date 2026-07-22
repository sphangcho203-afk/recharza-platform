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
    <main className="grid min-h-screen place-items-center bg-[var(--surface-0)] px-4 py-16 text-white sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-rose-300/20 bg-rose-300/[0.07] p-6 shadow-2xl shadow-black/30 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-200">Something failed</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">The page could not finish loading.</h1>
        <p className="mt-4 text-sm leading-7 text-rose-100/75 sm:text-base">
          Your order and payment state are stored on the server, so retrying the page is safer than repeating an action blindly.
        </p>
        {error.digest ? <p className="mt-3 font-mono text-xs text-rose-200/60">Reference: {error.digest}</p> : null}
        <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
          <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-rose-100">
            Retry this page
          </button>
          <Link href="/" className="min-h-12 rounded-xl border border-white/15 bg-black/15 px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/[0.06]">
            Return to store
          </Link>
        </div>
      </section>
    </main>
  );
}
