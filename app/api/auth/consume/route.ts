import { consumeMagicLink, createSessionCookie, sanitizeReturnPath } from "@/lib/auth";
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
