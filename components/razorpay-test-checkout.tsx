"use client";

import { useState } from "react";

import { formatInr } from "@/lib/mobile-legends";

type CheckoutConfiguration = {
  keyId: string;
  providerOrderId: string;
  amountInPaise: number;
  currency: "INR";
  businessName: string;
  description: string;
  customerEmail: string;
  testMode: true;
};

type PaymentSessionResponse = {
  ok: boolean;
  message?: string;
  checkout?: CheckoutConfiguration;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
  };
};

type RazorpayInstance = {
  open(): void;
  on(
    eventName: "payment.failed",
    handler: (response: RazorpayFailureResponse) => void,
  ): void;
};

type RazorpayConstructor = new (
  options: Record<string, unknown>,
) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Checkout requires a browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Secure Checkout could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Secure Checkout could not be loaded."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

const PAYABLE_STATUSES = new Set([
  "created",
  "awaiting_payment",
  "payment_pending",
  "failed",
]);

export function RazorpayTestCheckout({
  orderId,
  orderStatus,
  accessToken,
  amountInPaise,
  packageName,
  onVerified,
}: {
  orderId: string;
  orderStatus: string;
  accessToken: string;
  amountInPaise: number;
  packageName: string;
  onVerified: () => void | Promise<void>;
}) {
  const [state, setState] = useState<
    "idle" | "creating" | "open" | "verifying" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState(
    "Complete payment securely. The order remains recoverable if Checkout is closed.",
  );

  if (!PAYABLE_STATUSES.has(orderStatus)) {
    return null;
  }

  async function verifyPayment(
    checkout: CheckoutConfiguration,
    response: RazorpaySuccessResponse,
  ) {
    setState("verifying");
    setMessage("Verifying the payment response on the Recharza server...");

    const verificationResponse = await fetch(
      "/api/payments/razorpay/verify",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          providerOrderId: checkout.providerOrderId,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      },
    );
    const result = (await verificationResponse.json()) as {
      ok: boolean;
      message?: string;
    };

    if (!verificationResponse.ok || !result.ok) {
      setState("error");
      setMessage(result.message ?? "The payment response could not be verified.");
      return;
    }

    setState("success");
    setMessage(
      result.message ??
        "Payment response verified. Order processing has started.",
    );
    await onVerified();
  }

  async function tryInternalPayment() {
    const response = await fetch(
      `/api/orders/${encodeURIComponent(orderId)}/payment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ outcome: "completed" }),
      },
    );
    const result = (await response.json()) as {
      ok?: boolean;
      code?: string;
      message?: string;
    };

    if (response.status === 409 && result.code === "EXTERNAL_PAYMENT_REQUIRED") {
      return false;
    }

    if (!response.ok || !result.ok) {
      throw new Error(result.message ?? "Payment could not be completed.");
    }

    setState("success");
    setMessage(result.message ?? "Payment received. Order completed successfully.");
    await onVerified();
    return true;
  }

  async function openCheckout() {
    if (!accessToken.trim()) {
      setState("error");
      setMessage("Open the secure order before starting payment.");
      return;
    }

    setState("creating");
    setMessage("Preparing secure payment...");

    try {
      if (await tryInternalPayment()) {
        return;
      }

      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}/payment-session`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken.trim()}` },
        },
      );
      const result = (await response.json()) as PaymentSessionResponse;

      if (!response.ok || !result.ok || !result.checkout) {
        setState("error");
        setMessage(result.message ?? "Secure Checkout is not available yet.");
        return;
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Secure Checkout did not initialise.");
      }

      const checkout = result.checkout;
      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amountInPaise,
        currency: checkout.currency,
        name: checkout.businessName,
        description: checkout.description,
        order_id: checkout.providerOrderId,
        prefill: { email: checkout.customerEmail },
        notes: { recharza_order_id: orderId },
        theme: { color: "#8b5cf6" },
        handler: (paymentResponse: RazorpaySuccessResponse) => {
          void verifyPayment(checkout, paymentResponse);
        },
        modal: {
          ondismiss: () => {
            setState("idle");
            setMessage(
              "Checkout was closed. The order remains safe and payment can be reopened.",
            );
          },
        },
      });

      razorpay.on("payment.failed", (failure) => {
        setState("error");
        setMessage(
          failure.error?.description ||
            failure.error?.reason ||
            "Payment failed. You can retry the same order.",
        );
      });

      setState("open");
      setMessage("Secure Checkout is open.");
      razorpay.open();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Checkout could not be opened. The order remains recoverable.",
      );
    }
  }

  const busy = ["creating", "open", "verifying"].includes(state);

  return (
    <section className="mt-6 mb-20 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 sm:mb-4">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-6 sm:px-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-violet-200 bg-violet-600 text-base font-bold text-white shadow-lg shadow-violet-200">RZ</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Secure payment</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">Protected</span>
            </div>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Complete your order</h3>
            <p className="mt-1.5 text-sm font-medium text-slate-500">Your payment opens in a secure checkout and stays linked to this Recharza order.</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6">
        <div className="flex items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-inner">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected package</p>
            <p className="mt-1 truncate text-base font-bold text-slate-900">{packageName}</p>
          </div>
          <p className="shrink-0 text-2xl font-bold text-violet-600">{formatInr(amountInPaise)}</p>
        </div>

        <button
          type="button"
          disabled={busy || state === "success"}
          onClick={() => void openCheckout()}
          className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl bg-violet-600 px-6 text-base font-bold text-white shadow-xl shadow-violet-200 transition-all duration-300 hover:-translate-y-1 hover:bg-violet-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50 disabled:translate-y-0"
        >
          {state === "creating"
            ? "Preparing secure payment…"
            : state === "verifying"
              ? "Verifying payment…"
              : state === "open"
                ? "Checkout open"
                : state === "success"
                  ? "Payment completed"
                  : "Pay securely"}
        </button>

        <div className="mt-6 grid gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:grid-cols-3">
          <span className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-2.5">✓ Encrypted</span>
          <span className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-2.5">✓ Verified</span>
          <span className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-2.5">✓ Safe</span>
        </div>

        <p
          aria-live="polite"
          className={`mt-6 rounded-2xl border px-5 py-4 text-sm font-bold ${
            state === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : state === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-100 bg-slate-50 text-slate-500"
          }`}
        >
          {message}
        </p>
      </div>
    </section>
  );
}
