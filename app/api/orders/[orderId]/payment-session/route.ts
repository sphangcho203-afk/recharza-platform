import {
  createRazorpayCheckoutConfiguration,
  createRazorpayTestOrder,
  getRazorpayTestConfiguration,
} from "@/lib/razorpay-client";
import { verifyOrderAccessToken } from "@/lib/order-security";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const PAYMENT_SESSION_LIMIT = 8;
const PAYMENT_SESSION_WINDOW_MS = 10 * 60 * 1000;
const PAYABLE_STATUSES = [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_PENDING",
  "FAILED",
] as const;

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  return authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
}

function createSessionResponse(order: {
  publicId: string;
  paymentSessionId: string;
  amountInPaise: number;
  currency: string;
  packageName: string;
  customer: { email: string };
}) {
  const checkout = createRazorpayCheckoutConfiguration({
    providerOrderId: order.paymentSessionId,
    amountInPaise: order.amountInPaise,
    currency: order.currency === "INR" ? "INR" : "INR",
    packageName: order.packageName,
    customerEmail: order.customer.email,
  });

  return {
    ok: true,
    mode: "razorpay-test",
    orderId: order.publicId,
    checkout,
    message:
      "Razorpay Test Mode is ready. Test payments are simulated and do not move real money.",
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/orders/:orderId/payment-session",
      limit: PAYMENT_SESSION_LIMIT,
      windowMs: PAYMENT_SESSION_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many payment-session attempts. Try again later." },
        { status: 429, headers: rateHeaders },
      );
    }

    const accessToken = readBearerToken(request);

    if (!accessToken) {
      return Response.json(
        { ok: false, message: "An order access token is required." },
        { status: 401, headers: rateHeaders },
      );
    }

    if (!getRazorpayTestConfiguration()) {
      return Response.json(
        {
          ok: false,
          message:
            "Razorpay Test Mode is not configured yet. Add test API keys in the deployment secret store.",
        },
        { status: 503, headers: rateHeaders },
      );
    }

    const { orderId } = await context.params;
    const prisma = getPrisma();
    const order = await prisma.order.findUnique({
      where: { publicId: orderId },
      include: { customer: true },
    });

    if (!order) {
      return Response.json(
        { ok: false, message: "Order not found." },
        { status: 404, headers: rateHeaders },
      );
    }

    if (!verifyOrderAccessToken(accessToken, order.accessTokenHash)) {
      return Response.json(
        { ok: false, message: "The order access token is invalid." },
        { status: 401, headers: rateHeaders },
      );
    }

    if (!PAYABLE_STATUSES.includes(order.status as (typeof PAYABLE_STATUSES)[number])) {
      return Response.json(
        {
          ok: false,
          message: `This order cannot open Checkout while it is ${order.status.toLowerCase()}.`,
        },
        { status: 409, headers: rateHeaders },
      );
    }

    if (order.paymentProvider === "razorpay-test" && order.paymentSessionId) {
      return Response.json(createSessionResponse({
        ...order,
        paymentSessionId: order.paymentSessionId,
      }), { headers: rateHeaders });
    }

    if (order.paymentProvider === "razorpay-test-creating") {
      return Response.json(
        {
          ok: false,
          message: "A test payment session is already being created. Retry in a moment.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const previousProvider = order.paymentProvider;
    const previousSessionId = order.paymentSessionId;
    const claim = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentProvider: previousProvider,
        paymentSessionId: previousSessionId,
        status: { in: [...PAYABLE_STATUSES] },
      },
      data: {
        paymentProvider: "razorpay-test-creating",
        paymentSessionId: null,
      },
    });

    if (claim.count !== 1) {
      const latest = await prisma.order.findUnique({
        where: { id: order.id },
        include: { customer: true },
      });

      if (
        latest?.paymentProvider === "razorpay-test" &&
        latest.paymentSessionId
      ) {
        return Response.json(createSessionResponse({
          ...latest,
          paymentSessionId: latest.paymentSessionId,
        }), { headers: rateHeaders });
      }

      return Response.json(
        {
          ok: false,
          message: "The payment state changed while Checkout was opening. Refresh and retry.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    try {
      const providerOrder = await createRazorpayTestOrder({
        recharzaOrderId: order.publicId,
        amountInPaise: order.amountInPaise,
        currency: "INR",
        customerEmail: order.customer.email,
      });

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "AWAITING_PAYMENT",
          paymentProvider: "razorpay-test",
          paymentSessionId: providerOrder.id,
          events: {
            create: {
              type: "RAZORPAY_TEST_ORDER_CREATED",
              message:
                "A Razorpay Test Mode order was created for recoverable Checkout.",
              metadata: {
                providerOrderId: providerOrder.id,
                providerStatus: providerOrder.status,
                testMode: true,
              },
            },
          },
        },
        include: { customer: true },
      });

      return Response.json(createSessionResponse({
        ...updated,
        paymentSessionId: providerOrder.id,
      }), { status: 201, headers: rateHeaders });
    } catch (error) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentProvider: previousProvider,
          paymentSessionId: previousSessionId,
          events: {
            create: {
              type: "RAZORPAY_TEST_ORDER_FAILED",
              message:
                "Razorpay Test Mode order creation failed; the Recharza order remains recoverable.",
            },
          },
        },
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: error.message },
        { status: 503, headers: rateHeaders },
      );
    }

    console.error("Razorpay Test Mode payment-session creation failed", error);
    return Response.json(
      {
        ok: false,
        message:
          "The test payment provider could not create Checkout. Your Recharza order is safe; retry later.",
      },
      { status: 502, headers: rateHeaders },
    );
  }
}
