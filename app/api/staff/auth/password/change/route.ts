import {
  changeStaffPassword,
  clearStaffCsrfCookie,
  clearStaffSessionCookie,
  requireStaffSession,
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

  const session = await requireStaffSession(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Staff authentication is required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        currentPassword?: unknown;
        newPassword?: unknown;
        confirmation?: unknown;
      }
    | null;
  if (
    typeof body?.newPassword !== "string" ||
    body.newPassword !== body.confirmation
  ) {
    return Response.json(
      { ok: false, message: "Password change was rejected." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const changed = await changeStaffPassword({
      session,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    if (!changed) {
      return Response.json(
        { ok: false, message: "Password change was rejected." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const headers = new Headers({ "Cache-Control": "no-store" });
    headers.append("Set-Cookie", clearStaffSessionCookie());
    headers.append("Set-Cookie", clearStaffCsrfCookie());
    return Response.json(
      {
        ok: true,
        message: "Password changed. Sign in again on every staff device.",
      },
      { headers },
    );
  } catch (error) {
    console.error("Staff password change failed", error);
    return Response.json(
      { ok: false, message: "Password change is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
