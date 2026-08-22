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
      className="mx-auto max-w-2xl rounded-[2.5rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/50 sm:p-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
        Secure order lookup
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        Open your private timeline
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500 font-medium">
        The order ID locates the record. The private access token unlocks package details,
        masked receipt information and the persisted status timeline.
      </p>

      <label className="mt-7 block text-sm font-bold text-slate-900">
        Order ID
        <input
          required
          autoComplete="off"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value.toUpperCase())}
          placeholder="RZ-12AB34CD56EF"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-base font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 shadow-sm"
        />
      </label>

      <label className="mt-4 block text-sm font-bold text-slate-900">
        Private token <span className="font-medium text-slate-400">(optional)</span>
        <textarea
          rows={4}
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          placeholder="Paste the token issued after order creation"
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 shadow-sm"
        />
      </label>

      <button
        type="submit"
        className="mt-5 w-full rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-xl"
      >
        Open secure tracking
      </button>

      <p
        aria-live="polite"
        className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 font-medium ${
          isError
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-slate-100 bg-slate-50 text-slate-500"
        }`}
      >
        {message}
      </p>
    </form>
  );
}
