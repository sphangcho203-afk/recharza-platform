import {
  authenticateStaffCredentials,
  createStaffCsrfCookie,
  createStaffSessionCookie,
  validateStaffRequestOrigin,
} from "@/lib/staff-auth";
import { createClientFingerprint } from "@/lib/order-security";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    if (!validateStaffRequestOrigin(request)) {
      return Response.json(
        { ok: false, message: "The sign-in request was rejected." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/staff/auth/login",
      limit: LOGIN_LIMIT,
      windowMs: LOGIN_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);
    if (!rateLimit.allowed) {
      return Response.json(
        {
          ok: false,
          message: "Sign-in is temporarily unavailable. Try again later.",
        },
        {
          status: 429,
          headers: { ...rateHeaders, "Cache-Control": "no-store" },
        },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { email?: unknown; password?: unknown }
      | null;
    const result = await authenticateStaffCredentials({
      request,
      email: body?.email,
      password: body?.password,
      actorFingerprint: createClientFingerprint(request),
    });
    if (!result) {
      return Response.json(
        { ok: false, message: INVALID_CREDENTIALS_MESSAGE },
        {
          status: 401,
          headers: { ...rateHeaders, "Cache-Control": "no-store" },
        },
      );
    }

    const headers = new Headers(rateHeaders);
    headers.set("Cache-Control", "no-store");
    headers.append(
      "Set-Cookie",
      createStaffSessionCookie(
        result.sessionToken,
        result.session.absoluteExpiresAt,
      ),
    );
    headers.append(
      "Set-Cookie",
      createStaffCsrfCookie(
        result.csrfToken,
        result.session.absoluteExpiresAt,
      ),
    );
    return Response.json(
      {
        ok: true,
        role: result.session.role.toLowerCase(),
        mustChangePassword: result.session.mustChangePassword,
      },
      { headers },
    );
  } catch (error) {
    console.error("STAFF_LOGIN_REAL_ERROR", error);
    return Response.json(
      {
        ok: false,
        message:
          process.env.NODE_ENV !== "production" && error instanceof Error
            ? error.message
            : "Staff sign-in is temporarily unavailable.",
      },
      {
        status: 503,
        headers: { ...rateHeaders, "Cache-Control": "no-store" },
      },
    );
  }
}
