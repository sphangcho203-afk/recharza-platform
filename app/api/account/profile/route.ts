import { getRequestSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeDisplayName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 80 ? name : null;
}

export async function PATCH(request: Request) {
  const session = await getRequestSession(request);
  if (!session) {
    return Response.json({ ok: false, message: "Sign in to update your profile." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const displayName = normalizeDisplayName(
    payload && typeof payload === "object" ? (payload as Record<string, unknown>).displayName : null,
  );

  if (!displayName) {
    return Response.json({ ok: false, message: "Enter a name between 2 and 80 characters." }, { status: 400 });
  }

  const customer = await getPrisma().customer.update({
    where: { id: session.customer.id },
    data: { displayName },
    select: { id: true, displayName: true },
  });

  return Response.json({ ok: true, customer }, { headers: { "Cache-Control": "no-store" } });
}
