import { isSignInAllowed } from "@/lib/access-control";
import {
  createCustomerSession,
  createSessionCookie,
  normalizeAuthEmail,
  resolveBootstrapRole,
} from "@/lib/auth";
import {
  clearGoogleOAuthCookie,
  consumeGoogleOAuthState,
  createGoogleOAuthClient,
} from "@/lib/google-oauth";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

function redirectResponse(location: URL, cookies: string[]) {
  const headers = new Headers({
    Location: location.toString(),
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
  });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function accountError(request: Request, code: string) {
  const location = new URL("/account", request.url);
  location.searchParams.set("authError", code);
  return redirectResponse(location, [clearGoogleOAuthCookie()]);
}

function safeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  if (requestUrl.searchParams.get("error")) {
    return accountError(request, "google_cancelled");
  }

  try {
    const state = consumeGoogleOAuthState(
      requestUrl.searchParams.get("state"),
      request,
    );
    if (!state) return accountError(request, "google_state");

    const code = requestUrl.searchParams.get("code");
    if (!code || code.length > 2048) {
      return accountError(request, "google_response");
    }

    const { client, configuration } = createGoogleOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) return accountError(request, "google_response");

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: configuration.clientId,
    });
    const payload = ticket.getPayload();
    const email = normalizeAuthEmail(payload?.email);

    if (
      !payload?.sub ||
      !email ||
      payload.email_verified !== true ||
      payload.sub.length > 255
    ) {
      return accountError(request, "google_account");
    }

    const authSubject = `google:${payload.sub}`;
    const displayName =
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim().slice(0, 120)
        : null;
    const now = new Date();
    const prisma = getPrisma();

    const linked = await prisma.$transaction(async (transaction) => {
      const subjectCustomer = await transaction.customer.findUnique({
        where: { authSubject },
      });

      if (subjectCustomer) {
        if (!isSignInAllowed(subjectCustomer.accessStatus)) {
          return { kind: "restricted" as const };
        }

        const customer = await transaction.customer.update({
          where: { id: subjectCustomer.id },
          data: {
            displayName: subjectCustomer.displayName ?? displayName,
            emailVerifiedAt: subjectCustomer.emailVerifiedAt ?? now,
            lastLoginAt: now,
          },
        });
        return { kind: "ok" as const, customerId: customer.id };
      }

      const emailCustomer = await transaction.customer.findUnique({
        where: { email },
      });

      if (emailCustomer) {
        if (
          emailCustomer.authSubject &&
          emailCustomer.authSubject !== authSubject
        ) {
          return { kind: "conflict" as const };
        }
        if (!isSignInAllowed(emailCustomer.accessStatus)) {
          return { kind: "restricted" as const };
        }

        const customer = await transaction.customer.update({
          where: { id: emailCustomer.id },
          data: {
            authSubject,
            displayName: emailCustomer.displayName ?? displayName,
            emailVerifiedAt: emailCustomer.emailVerifiedAt ?? now,
            lastLoginAt: now,
          },
        });
        return { kind: "ok" as const, customerId: customer.id };
      }

      const customer = await transaction.customer.create({
        data: {
          email,
          displayName,
          authSubject,
          role: resolveBootstrapRole(email),
          emailVerifiedAt: now,
          lastLoginAt: now,
        },
      });
      return { kind: "ok" as const, customerId: customer.id };
    });

    if (linked.kind === "restricted") {
      return accountError(request, "google_restricted");
    }
    if (linked.kind === "conflict") {
      return accountError(request, "google_conflict");
    }

    const session = await createCustomerSession(linked.customerId, request);
    const destination = new URL(state.returnTo, request.url);

    return redirectResponse(destination, [
      createSessionCookie(session.sessionToken, session.expiresAt),
      clearGoogleOAuthCookie(),
    ]);
  } catch (error) {
    console.error("Google OAuth callback failed", safeErrorName(error));
    return accountError(request, "google_unavailable");
  }
}
