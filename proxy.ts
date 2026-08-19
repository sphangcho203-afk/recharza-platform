import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/auth";

// Storefront game pages (like /games/:path*) are publicly browsable.
// Only checkout endpoints require a signed-in verified account; the
// /games/* matcher stays so guests can browse packs without an account.
function isProtectedStorefrontPath(pathname: string) {
  if (pathname.startsWith("/api/checkout/")) return true;
  return false;
}

function signInUrl(request: NextRequest) {
  const url = request.nextUrl.clone();
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/account";
  url.search = "";
  url.searchParams.set("returnTo", returnTo);
  url.searchParams.set("reason", "sign-in");
  return url;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isProtectedStorefrontPath(pathname)) {
    return NextResponse.next();
  }

  try {
    const session = await getRequestSession(request);
    if (session) return NextResponse.next();
  } catch (error) {
    console.error("Checkout session enforcement failed", error);

    if (request.nextUrl.pathname.startsWith("/api/checkout/")) {
      return NextResponse.json(
        {
          ok: false,
          code: "SESSION_CHECK_UNAVAILABLE",
          message: "Account verification is temporarily unavailable.",
        },
        { status: 503 },
      );
    }
  }

  if (request.nextUrl.pathname.startsWith("/api/checkout/")) {
    return NextResponse.json(
      {
        ok: false,
        code: "AUTH_REQUIRED",
        message: "Sign in to your verified Recharza account before checkout.",
      },
      { status: 401 },
    );
  }

  return NextResponse.redirect(signInUrl(request));
}

export const config = {
  matcher: ["/games/:path*", "/api/checkout/:path*"],
};
