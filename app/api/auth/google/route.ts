import { createGoogleAuthorizationRequest } from "@/lib/google-oauth";

export const runtime = "nodejs";

function accountErrorUrl(request: Request, returnTo: string) {
  const url = new URL("/account", request.url);
  url.searchParams.set("authError", "google_unavailable");
  url.searchParams.set("returnTo", returnTo);
  return url;
}

function safeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = requestUrl.searchParams.get("returnTo") ?? "/account";

  try {
    const { authorizationUrl, cookie } =
      createGoogleAuthorizationRequest(returnTo);
    const headers = new Headers({
      Location: authorizationUrl,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    });
    headers.append("Set-Cookie", cookie);

    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error("Google OAuth could not start", safeErrorName(error));
    return Response.redirect(accountErrorUrl(request, returnTo), 302);
  }
}
