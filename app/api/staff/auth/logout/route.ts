import {
  clearStaffCsrfCookie,
  clearStaffSessionCookie,
  revokeStaffRequestSession,
  validateStaffMutationRequest,
} from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!validateStaffMutationRequest(request)) {
    return Response.json(
      { ok: false, message: "Invalid security token." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await revokeStaffRequestSession(request);
  } catch (error) {
    console.error("Staff session revocation failed", error);
    return Response.json(
      { ok: false, message: "Sign-out could not be completed safely." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", clearStaffSessionCookie());
  headers.append("Set-Cookie", clearStaffCsrfCookie());
  return Response.json({ ok: true }, { headers });
}
