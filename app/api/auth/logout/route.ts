import {
  clearSessionCookie,
  getRequestSession,
  revokeRequestSession,
} from "@/lib/auth";
import { sendAccountSignOutEmail } from "@/lib/lifecycle-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signedOutAt = new Date();
  let session = null;

  try {
    session = await getRequestSession(request);
    await revokeRequestSession(request);
  } catch (error) {
    console.error("Session revocation failed", error);
  }

  if (session) {
    try {
      await sendAccountSignOutEmail({
        customerId: session.customer.id,
        email: session.customer.email,
        displayName: session.customer.displayName,
        request,
        signedOutAt,
        sessionId: session.sessionId,
      });
    } catch (error) {
      console.error("Sign-out security email failed", error);
    }
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
        "Cache-Control": "no-store",
      },
    },
  );
}
