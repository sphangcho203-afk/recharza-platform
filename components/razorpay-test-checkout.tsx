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
  on(eventName: "payment.failed", handler: (response: RazorpayFailureResponse) => void): void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

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
        () => reject(new Error("Razorpay Checkout could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded."));
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
    "Create or resume a Razorpay Test Mode session. No real money moves with test keys.",
  );

  if (!PAYABLE_STATUSES.has(orderStatus)) {
    return null;
  }

  async function verifyPayment(
    checkout: CheckoutConfiguration,
    response: RazorpaySuccessResponse,
  ) {
    setState("verifying");
    setMessage("Verifying the Checkout signature on the Recharza server...");

    const verificationResponse = await fetch("/api/payments/razorpay/verify", {
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
    });
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
        "Payment response verified. Waiting for the signed webhook before fulfilment.",
    );
    await onVerified();
  }

  async function openCheckout() {
    if (!accessToken.trim()) {
      setState("error");
      setMessage("Open the secure order with its private token before starting payment.");
      return;
    }

    setState("creating");
    setMessage("Creating or recovering the Razorpay Test Mode order...");

    try {
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
        setMessage(result.message ?? "Test Checkout is not available yet.");
        return;
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout did not initialise.");
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
        notes: { recharza_order_id: orderId, mode: "test" },
        theme: { color: "#8b5cf6" },
        handler: (paymentResponse: RazorpaySuccessResponse) => {
          void verifyPayment(checkout, paymentResponse);
        },
        modal: {
          ondismiss: () => {
            setState("idle");
            setMessage(
              "Test Checkout was closed. The order remains safe and the same payment session can be reopened.",
            );
          },
        },
      });

      razorpay.on("payment.failed", (failure) => {
        setState("error");
        setMessage(
          failure.error?.description ||
            failure.error?.reason ||
            "The simulated payment failed. You can retry the same order.",
        );
      });

      setState("open");
      setMessage("Razorpay Test Mode Checkout is open.");
      razorpay.open();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Test Checkout could not be opened. The order remains recoverable.",
      );
    }
  }

  const busy = ["creating", "open", "verifying"].includes(state);

  return (
    <section className="mt-6 rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">
            Razorpay Test Mode
          </p>
          <h3 className="mt-2 text-xl font-black text-white">Continue to simulated payment</h3>
          <p className="mt-2 text-sm leading-6 text-violet-100/75">
            {packageName} · {formatInr(amountInPaise)}. The server creates the provider order and verifies the callback signature.
          </p>
        </div>
        <span className="w-fit rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-100">
          No real charge
        </span>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void openCheckout()}
        className="mt-5 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-violet-100 disabled:cursor-wait disabled:opacity-60"
      >
        {state === "creating"
          ? "Preparing Test Checkout..."
          : state === "verifying"
            ? "Verifying payment response..."
            : state === "open"
              ? "Test Checkout open"
              : "Open Razorpay Test Checkout"}
      </button>

      <p
        aria-live="polite"
        className={`mt-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${
          state === "error"
            ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
            : state === "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-black/15 text-violet-100/75"
        }`}
      >
        {message}
      </p>
    </section>
  );
}
