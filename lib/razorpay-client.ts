import { RuntimeConfigurationError } from "@/lib/runtime-config";

const DEFAULT_RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1";

type RazorpayOrderResponse = {
  id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
};

export type RazorpayTestConfiguration = {
  keyId: string;
  keySecret: string;
  apiBaseUrl: string;
};

export type CreatedRazorpayOrder = {
  id: string;
  amountInPaise: number;
  currency: "INR";
  status: string;
};

export function getRazorpayTestConfiguration(): RazorpayTestConfiguration | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";

  if (!keyId && !keySecret) {
    return null;
  }

  if (!keyId || !keySecret) {
    throw new RuntimeConfigurationError(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured together.",
    );
  }

  if (!keyId.startsWith("rzp_test_")) {
    throw new RuntimeConfigurationError(
      "Only Razorpay Test Mode keys are accepted by this build. Live charging is intentionally blocked.",
    );
  }

  if (keySecret.length < 16) {
    throw new RuntimeConfigurationError(
      "RAZORPAY_KEY_SECRET must contain at least 16 characters.",
    );
  }

  const apiBaseUrl =
    process.env.RAZORPAY_API_BASE_URL?.trim().replace(/\/$/, "") ||
    DEFAULT_RAZORPAY_API_BASE_URL;

  return { keyId, keySecret, apiBaseUrl };
}

export async function createRazorpayTestOrder(input: {
  recharzaOrderId: string;
  amountInPaise: number;
  currency: "INR";
  customerEmail: string;
}): Promise<CreatedRazorpayOrder> {
  const configuration = getRazorpayTestConfiguration();

  if (!configuration) {
    throw new RuntimeConfigurationError(
      "Razorpay Test Mode keys are required before a test payment session can be created.",
    );
  }

  const authorization = Buffer.from(
    `${configuration.keyId}:${configuration.keySecret}`,
  ).toString("base64");

  const response = await fetch(`${configuration.apiBaseUrl}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency: input.currency,
      receipt: input.recharzaOrderId,
      notes: {
        recharza_order_id: input.recharzaOrderId,
        customer_email: input.customerEmail,
        environment: "test",
      },
    }),
    cache: "no-store",
  });

  let payload: RazorpayOrderResponse | null = null;

  try {
    payload = (await response.json()) as RazorpayOrderResponse;
  } catch {
    payload = null;
  }

  if (
    !response.ok ||
    !payload ||
    typeof payload.id !== "string" ||
    typeof payload.amount !== "number" ||
    payload.amount !== input.amountInPaise ||
    payload.currency !== input.currency
  ) {
    throw new Error(`Razorpay Test Mode order creation failed with HTTP ${response.status}.`);
  }

  return {
    id: payload.id,
    amountInPaise: payload.amount,
    currency: "INR",
    status: typeof payload.status === "string" ? payload.status : "created",
  };
}

export function createRazorpayCheckoutConfiguration(input: {
  providerOrderId: string;
  amountInPaise: number;
  currency: "INR";
  packageName: string;
  customerEmail: string;
}) {
  const configuration = getRazorpayTestConfiguration();

  if (!configuration) {
    throw new RuntimeConfigurationError(
      "Razorpay Test Mode keys are required before Checkout can be opened.",
    );
  }

  return {
    keyId: configuration.keyId,
    providerOrderId: input.providerOrderId,
    amountInPaise: input.amountInPaise,
    currency: input.currency,
    businessName: "Recharza",
    description: input.packageName,
    customerEmail: input.customerEmail,
    testMode: true as const,
  };
}
