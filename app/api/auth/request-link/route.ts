import { createHash } from "node:crypto";

import { createMagicLink, sanitizeReturnPath } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { createClientFingerprint } from "@/lib/order-security";
import { consumeRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const AUTH_LIMIT = 5;
const AUTH_WINDOW_MS = 15 * 60 * 1000;

function resolveReturnPath(request: Request, bodyReturnTo: unknown) {
  const bodyPath = sanitizeReturnPath(bodyReturnTo);
  const referer = request.headers.get("referer");

  if (!referer) return bodyPath;

  try {
    const refererUrl = new URL(referer);
    if (refererUrl.origin !== new URL(request.url).origin) return bodyPath;
    if (refererUrl.pathname !== "/account") return bodyPath;

    const guardedPath = refererUrl.searchParams.get("returnTo");
    return guardedPath ? sanitizeReturnPath(guardedPath, bodyPath) : bodyPath;
  } catch {
    return bodyPath;
  }
}

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/auth/request-link",
      limit: AUTH_LIMIT,
      windowMs: AUTH_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many sign-in requests. Wait before trying again." },
        { status: 429, headers: rateHeaders },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { email?: unknown; returnTo?: unknown }
      | null;
    const fingerprint = createClientFingerprint(request);
    const magicLink = await createMagicLink({
      email: body?.email,
      returnTo: resolveReturnPath(request, body?.returnTo),
      requestedFingerprint: fingerprint,
    });

    const genericMessage = "If that email is valid, a secure sign-in link has been prepared.";
    if (!magicLink) {
      return Response.json({ ok: true, message: genericMessage }, { headers: rateHeaders });
    }

    const idempotencyKey = createHash("sha256")
      .update(`${magicLink.customer.id}:${magicLink.expiresAt.toISOString()}`)
      .digest("hex");
    const delivery = await sendMagicLinkEmail({
      email: magicLink.email,
      url: magicLink.url,
      expiresAt: magicLink.expiresAt,
      idempotencyKey: `auth-${idempotencyKey}`,
    });

    return Response.json(
      {
        ok: true,
        message: genericMessage,
        ...(delivery.mode === "development-preview"
          ? { developmentPreviewUrl: delivery.previewUrl }
          : {}),
      },
      { headers: rateHeaders },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Account sign-in is not configured yet." },
        { status: 503, headers: rateHeaders },
      );
    }

    console.error("Magic-link request failed", error);
    return Response.json(
      { ok: false, message: "The sign-in link could not be prepared right now." },
      { status: 503, headers: rateHeaders },
    );
  }
}
