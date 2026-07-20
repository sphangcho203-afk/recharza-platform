import { clearSessionCookie, revokeRequestSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await revokeRequestSession(request);
  } catch (error) {
    console.error("Session revocation failed", error);
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
