import { hashAuthToken } from "@/lib/auth";
import {
  hashCustomerPassword,
  validateCustomerPassword,
} from "@/lib/customer-password";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { sendPasswordChangedEmail } from "@/lib/transactional-email";

export const runtime = "nodejs";

const RESET_LIMIT = 6;
const RESET_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/auth/reset-password",
      limit: RESET_LIMIT,
      windowMs: RESET_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          ok: false,
          message: "Too many reset attempts. Wait before trying again.",
        },
        { status: 429, headers: rateHeaders },
      );
    }

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "Reset details are required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const data = payload as Record<string, unknown>;
    const token = typeof data.token === "string" ? data.token.trim() : "";
    const passwordResult = validateCustomerPassword(data.password);

    if (token.length < 32 || token.length > 256) {
      return Response.json(
        {
          ok: false,
          message: "This password-reset link is invalid or expired.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!passwordResult.ok) {
      return Response.json(
        { ok: false, field: "password", message: passwordResult.message },
        { status: 400, headers: rateHeaders },
      );
    }

    if (data.password !== data.confirmPassword) {
      return Response.json(
        {
          ok: false,
          field: "confirmPassword",
          message: "The passwords do not match.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const prisma = getPrisma();
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashAuthToken(token) },
      include: { customer: true },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date()
    ) {
      return Response.json(
        {
          ok: false,
          message: "This password-reset link is invalid or expired.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const changedAt = new Date();
    const passwordHash = await hashCustomerPassword(passwordResult.password);

    const updated = await prisma.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: changedAt },
        },
        data: { usedAt: changedAt },
      });
      if (consumed.count !== 1) return null;

      const customer = await transaction.customer.update({
        where: { id: resetToken.customerId },
        data: {
          passwordHash,
          passwordUpdatedAt: changedAt,
        },
      });

      await Promise.all([
        transaction.passwordResetToken.updateMany({
          where: {
            customerId: resetToken.customerId,
            usedAt: null,
          },
          data: { usedAt: changedAt },
        }),
        transaction.authSession.updateMany({
          where: {
            customerId: resetToken.customerId,
            revokedAt: null,
          },
          data: { revokedAt: changedAt },
        }),
      ]);

      return customer;
    });

    if (!updated) {
      return Response.json(
        {
          ok: false,
          message: "This password-reset link was already used.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    try {
      await sendPasswordChangedEmail({
        customerId: updated.id,
        email: updated.email,
        changedAt,
      });
    } catch (error) {
      console.error("Password-changed email could not be recorded", error);
    }

    return Response.json(
      {
        ok: true,
        message:
          "Password reset successfully. Sign in with your new password.",
      },
      { headers: { ...rateHeaders, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Password reset failed", error);
    }

    return Response.json(
      { ok: false, message: "Password reset is temporarily unavailable." },
      { status: 503, headers: rateHeaders },
    );
  }
}
