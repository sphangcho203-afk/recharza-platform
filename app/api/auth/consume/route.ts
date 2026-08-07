import { createHash } from "node:crypto";

import { consumeMagicLink, createSessionCookie, sanitizeReturnPath } from "@/lib/auth";
import {
  getRequestDeviceFingerprint,
  sendAccountSignInEmail,
} from "@/lib/lifecycle-email";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const returnTo = sanitizeReturnPath(url.searchParams.get("returnTo"));
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || url.origin).replace(/\/$/, "");

  try {
    const result = await consumeMagicLink(token, request);
    if (!result) {
      return Response.redirect(`${appUrl}/account?auth=invalid`, 303);
    }

    try {
      const matchingDeviceSessions = await getPrisma().authSession.count({
        where: {
          customerId: result.customer.id,
          userAgentHash: getRequestDeviceFingerprint(request),
        },
      });

      await sendAccountSignInEmail({
        customerId: result.customer.id,
        email: result.customer.email,
        displayName: result.customer.displayName,
        request,
        newDevice: matchingDeviceSessions <= 1,
        signedInAt: new Date(),
        sessionId: createHash("sha256")
          .update(result.sessionToken)
          .digest("hex")
          .slice(0, 20),
        method: "magic-link",
      });
    } catch (error) {
      console.error("Magic-link sign-in email failed", error);
    }

    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL(returnTo, appUrl).toString(),
        "Set-Cookie": createSessionCookie(result.sessionToken, result.expiresAt),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Magic-link consumption failed", error);
    }
    return Response.redirect(`${appUrl}/account?auth=error`, 303);
  }
}
