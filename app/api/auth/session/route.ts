import { getRequestSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return Response.json({ ok: true, authenticated: false }, { headers: { "Cache-Control": "no-store" } });
    }

    const identity = await getPrisma().customer.findUnique({
      where: { id: session.customer.id },
      select: { authSubject: true },
    });

    return Response.json(
      {
        ok: true,
        authenticated: true,
        customer: {
          id: session.customer.id,
          email: session.customer.email,
          displayName: session.customer.displayName,
          username: session.customer.username,
          role: session.customer.role.toLowerCase(),
          emailVerified: Boolean(session.customer.emailVerifiedAt),
          needsDisplayName: Boolean(identity?.authSubject?.startsWith("google:") && !session.customer.displayName),
        },
        expiresAt: session.expiresAt.toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Session lookup failed", error);
    }
    return Response.json({ ok: false, authenticated: false, message: "Session lookup is unavailable." }, { status: 503 });
  }
}
