"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function OrderLookupForm() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [message, setMessage] = useState(
    "Enter the public Recharza order ID. The private token is optional here and can be entered on the next screen.",
  );
  const [isError, setIsError] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedOrderId = orderId.trim().toUpperCase();

    if (!/^RZ-[A-Z0-9]{8,20}$/.test(normalizedOrderId)) {
      setIsError(true);
      setMessage("Enter a valid Recharza order ID, for example RZ-12AB34CD56EF.");
      return;
    }

    if (accessToken.trim()) {
      sessionStorage.setItem(
        `recharza-order:${normalizedOrderId}`,
        accessToken.trim(),
      );
    }

    setIsError(false);
    setMessage("Opening the secure order console...");
    router.push(`/orders/${encodeURIComponent(normalizedOrderId)}`);
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-8"
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
        Secure order lookup
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
        Open your private timeline
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        The order ID locates the record. The private access token unlocks package details,
        masked receipt information and the persisted status timeline.
      </p>

      <label className="mt-7 block text-sm font-semibold text-slate-200">
        Order ID
        <input
          required
          autoComplete="off"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value.toUpperCase())}
          placeholder="RZ-12AB34CD56EF"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-base font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-slate-200">
        Private token <span className="font-normal text-slate-600">(optional)</span>
        <textarea
          rows={4}
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          placeholder="Paste the token issued after order creation"
          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
        />
      </label>

      <button
        type="submit"
        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_45px_rgba(139,92,246,0.28)] transition hover:-translate-y-0.5"
      >
        Open secure tracking
      </button>

      <p
        aria-live="polite"
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${
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
