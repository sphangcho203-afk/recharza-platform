import { verifyOrderAccessToken } from "@/lib/order-security";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { verifyRazorpayCheckoutSignature } from "@/lib/razorpay-webhook";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const VERIFY_LIMIT = 15;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  return authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
}

function readRequiredString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/payments/razorpay/verify",
      limit: VERIFY_LIMIT,
      windowMs: VERIFY_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many payment verification attempts. Try again later." },
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

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { ok: false, message: "The payment response must be valid JSON." },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "Payment verification details are required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const data = payload as Record<string, unknown>;
    const orderId = readRequiredString(data.orderId);
    const providerOrderId = readRequiredString(data.providerOrderId);
    const paymentId = readRequiredString(data.paymentId);
    const signature = readRequiredString(data.signature);

    if (!orderId || !providerOrderId || !paymentId || !signature) {
      return Response.json(
        { ok: false, message: "The complete Razorpay payment response is required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const prisma = getPrisma();
    const order = await prisma.order.findUnique({
      where: { publicId: orderId },
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

    if (
      order.paymentProvider !== "razorpay-test" ||
      !order.paymentSessionId ||
      providerOrderId !== order.paymentSessionId
    ) {
      return Response.json(
        {
          ok: false,
          message: "The provider order does not match the Recharza order.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    if (
      !verifyRazorpayCheckoutSignature({
        providerOrderId: order.paymentSessionId,
        paymentId,
        receivedSignature: signature,
      })
    ) {
      return Response.json(
        { ok: false, message: "Razorpay payment signature verification failed." },
        { status: 401, headers: rateHeaders },
      );
    }

    const mayMoveToPending = [
      "CREATED",
      "AWAITING_PAYMENT",
      "FAILED",
    ].includes(order.status);
    const targetStatus = mayMoveToPending ? "PAYMENT_PENDING" : order.status;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: targetStatus,
        events: {
          create: {
            type: "RAZORPAY_CHECKOUT_SIGNATURE_VERIFIED",
            message:
              targetStatus === order.status
                ? "The verified Checkout callback was recorded without changing the current order state."
                : "The verified Checkout callback moved the order to payment pending while the webhook is awaited.",
            metadata: {
              providerOrderId: order.paymentSessionId,
              paymentId,
              testMode: true,
            },
          },
        },
      },
    });

    return Response.json(
      {
        ok: true,
        orderId: updated.publicId,
        status: updated.status.toLowerCase(),
        message:
          "Payment response verified. Recharza is waiting for the signed webhook before treating the order as paid.",
      },
      { headers: rateHeaders },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: error.message },
        { status: 503, headers: rateHeaders },
      );
    }

    console.error("Razorpay Checkout verification failed", error);
    return Response.json(
      { ok: false, message: "Payment verification temporarily failed." },
      { status: 500, headers: rateHeaders },
    );
  }
}
