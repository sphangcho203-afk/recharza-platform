import {
  createCustomerSession,
  createSessionCookie,
  normalizeAuthEmail,
} from "@/lib/auth";
import { isSignInAllowed } from "@/lib/access-control";
import { verifyCustomerPassword } from "@/lib/customer-password";
import {
  isKnownCustomerDevice,
  sendAccountSignInEmail,
} from "@/lib/lifecycle-email";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const INVALID_MESSAGE = "Incorrect email or password.";

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/auth/login",
      limit: LOGIN_LIMIT,
      windowMs: LOGIN_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          ok: false,
          message: "Too many sign-in attempts. Wait before retrying.",
        },
        { status: 429, headers: rateHeaders },
      );
    }

    const payload = await request.json().catch(() => null);
    const data =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : null;
    const email = normalizeAuthEmail(data?.email);
    const password = typeof data?.password === "string" ? data.password : "";

    if (!email || !password || password.length > 128) {
      return Response.json(
        { ok: false, message: INVALID_MESSAGE },
        { status: 401, headers: rateHeaders },
      );
    }

    const prisma = getPrisma();
    const customer = await prisma.customer.findUnique({ where: { email } });

    if (
      !customer?.passwordHash ||
      !(await verifyCustomerPassword(password, customer.passwordHash))
    ) {
      return Response.json(
        { ok: false, message: INVALID_MESSAGE },
        { status: 401, headers: rateHeaders },
      );
    }

    if (!isSignInAllowed(customer.accessStatus)) {
      return Response.json(
        {
          ok: false,
          message:
            "Sign-in is restricted for this account. Contact Recharza support.",
        },
        { status: 403, headers: rateHeaders },
      );
    }

    const signedInAt = new Date();
    const knownDevice = await isKnownCustomerDevice(customer.id, request);

    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: signedInAt },
    });

    const session = await createCustomerSession(customer.id, request);

    try {
      await sendAccountSignInEmail({
        customerId: customer.id,
        email: customer.email,
        displayName: customer.displayName,
        request,
        newDevice: !knownDevice,
        signedInAt,
        sessionId: session.sessionId,
        method: "password",
      });
    } catch (error) {
      console.error("Sign-in security email failed", error);
    }

    return Response.json(
      {
        ok: true,
        message: "Signed in successfully.",
        customer: {
          id: customer.id,
          name: customer.displayName,
          username: customer.username,
          email: customer.email,
          role: customer.role.toLowerCase(),
        },
      },
      {
        headers: {
          ...rateHeaders,
          "Cache-Control": "no-store",
          "Set-Cookie": createSessionCookie(
            session.sessionToken,
            session.expiresAt,
          ),
        },
      },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Customer password login failed", error);
    }

    return Response.json(
      { ok: false, message: "Sign-in is temporarily unavailable." },
      { status: 503, headers: rateHeaders },
    );
  }
}
