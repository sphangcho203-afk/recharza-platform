import {
  createOpaqueAuthToken,
  hashAuthToken,
  normalizeAuthEmail,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { sendPasswordResetEmail } from "@/lib/transactional-email";

export const runtime = "nodejs";

const RESET_REQUEST_LIMIT = 4;
const RESET_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 20 * 60 * 1000;
const SAFE_MESSAGE =
  "If an account exists for that email, a password-reset link has been sent.";

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/auth/forgot-password",
      limit: RESET_REQUEST_LIMIT,
      windowMs: RESET_REQUEST_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: true, message: SAFE_MESSAGE },
        { headers: rateHeaders },
      );
    }

    const payload = await request.json().catch(() => null);
    const email = normalizeAuthEmail(
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).email
        : null,
    );

    if (!email) {
      return Response.json(
        { ok: true, message: SAFE_MESSAGE },
        { headers: rateHeaders },
      );
    }

    const prisma = getPrisma();
    const customer = await prisma.customer.findUnique({ where: { email } });

    if (customer?.passwordHash) {
      const token = createOpaqueAuthToken();
      const requestedAt = new Date();
      const expiresAt = new Date(requestedAt.getTime() + RESET_TTL_MS);

      await prisma.$transaction([
        prisma.passwordResetToken.updateMany({
          where: { customerId: customer.id, usedAt: null },
          data: { usedAt: requestedAt },
        }),
        prisma.passwordResetToken.create({
          data: {
            tokenHash: hashAuthToken(token),
            customerId: customer.id,
            expiresAt,
          },
        }),
      ]);

      const appUrl = (
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      ).replace(/\/$/, "");
      const resetUrl = new URL("/reset-password", appUrl);
      resetUrl.searchParams.set("token", token);

      try {
        await sendPasswordResetEmail({
          customerId: customer.id,
          email: customer.email,
          resetUrl: resetUrl.toString(),
          requestedAt,
          expiresAt,
        });
      } catch (error) {
        console.error("Password-reset email could not be recorded", error);
      }
    }

    return Response.json(
      { ok: true, message: SAFE_MESSAGE },
      { headers: { ...rateHeaders, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Forgot-password request failed", error);
    }

    return Response.json(
      { ok: true, message: SAFE_MESSAGE },
      { headers: { ...rateHeaders, "Cache-Control": "no-store" } },
    );
  }
}
