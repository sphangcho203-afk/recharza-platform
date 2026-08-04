"use client";

import { useState } from "react";

import { formatInr } from "@/lib/mobile-legends";

type InternalPaymentCheckoutProps = {
  orderId: string;
  accessToken: string;
  amountInPaise: number;
  packageName: string;
  onVerified: () => void;
};

type PaymentResponse = {
  ok?: boolean;
  status?: string;
  message?: string;
};

export function InternalPaymentCheckout({
  orderId,
  accessToken,
  amountInPaise,
  packageName,
  onVerified,
}: InternalPaymentCheckoutProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function completePayment() {
    setStatus("loading");
    setMessage("Completing payment and recording the order...");

    try {
      const response = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ outcome: "completed" }),
      });
      const result = (await response.json()) as PaymentResponse;

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(
          result.message ??
            "Payment could not be completed. The saved order can be retried.",
        );
        return;
      }

      setStatus("success");
      setMessage(
        result.message ?? "Payment received. Order completed successfully.",
      );
      onVerified();
    } catch {
      setStatus("error");
      setMessage(
        "The payment service could not be reached. The order remains saved.",
      );
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
            Secure payment
          </p>
          <p className="mt-1 truncate text-sm font-black text-white">
            {packageName}
          </p>
          <p className="mt-1 text-lg font-black text-emerald-200">
            {formatInr(amountInPaise)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void completePayment()}
          disabled={status === "loading" || status === "success"}
          className="min-h-12 shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading"
            ? "Completing payment..."
            : status === "success"
              ? "Payment completed"
              : "Complete payment"}
        </button>
      </div>

      {message ? (
        <p
          aria-live={status === "error" ? "assertive" : "polite"}
          className={`mt-3 rounded-xl border px-3 py-2.5 text-sm leading-6 ${
            status === "error"
              ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
              : status === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                : "border-white/10 bg-white/[0.03] text-slate-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
