import {
  createStaffCsrfCookie,
  createStaffCsrfToken,
  requireStaffSession,
} from "@/lib/staff-auth";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await requireStaffSession(request);
    if (!session) {
      return Response.json(
        { ok: true, authenticated: false },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const csrfToken = createStaffCsrfToken();
    return Response.json(
      {
        ok: true,
        authenticated: true,
        staff: {
          id: session.account.id,
          email: session.account.email,
          displayName: session.account.displayName,
          role: session.role.toLowerCase(),
        },
        mustChangePassword: session.mustChangePassword,
        idleExpiresAt: session.idleExpiresAt.toISOString(),
        absoluteExpiresAt: session.absoluteExpiresAt.toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": createStaffCsrfCookie(
            csrfToken,
            session.absoluteExpiresAt,
          ),
        },
      },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Staff session lookup failed", error);
    }
    return Response.json(
      {
        ok: false,
        authenticated: false,
        message: "Staff session lookup is unavailable.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
