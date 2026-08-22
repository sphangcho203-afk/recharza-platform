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
      className="mx-auto max-w-2xl rounded-[2.5rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md sm:p-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
        Secure order lookup
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
        Open your private timeline
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-400 font-medium">
        The order ID locates the record. The private access token unlocks package details,
        masked receipt information and the persisted status timeline.
      </p>

      <label className="mt-7 block text-sm font-bold text-white">
        Order ID
        <input
          required
          autoComplete="off"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value.toUpperCase())}
          placeholder="RZ-12AB34CD56EF"
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-base font-medium text-white outline-none transition-all placeholder:text-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 shadow-sm"
        />
      </label>

      <label className="mt-4 block text-sm font-bold text-white">
        Private token <span className="font-medium text-slate-500">(optional)</span>
        <textarea
          rows={4}
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          placeholder="Paste the token issued after order creation"
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm font-medium text-white outline-none transition-all placeholder:text-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 shadow-sm"
        />
      </label>

      <button
        type="submit"
        className="mt-5 w-full rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]"
      >
        Open secure tracking
      </button>

      <p
        aria-live="polite"
        className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 font-medium ${
          isError
            ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
            : "border-white/5 bg-white/5 text-slate-400"
        }`}
      >
        {message}
      </p>
    </form>
  );
}
