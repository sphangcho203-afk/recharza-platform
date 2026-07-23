import { getRequestSession } from "@/lib/auth";
import {
  getAdminStorefrontSnapshot,
  sanitizeStorefrontContent,
  writeStorefrontVersion,
} from "@/lib/storefront-content";

export const runtime = "nodejs";

const ACTIONS = new Set(["save-draft", "publish", "restore-draft"]);

async function requireAdmin(request: Request) {
  const session = await getRequestSession(request);
  return session?.customer.role === "ADMIN" ? session : null;
}

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const snapshot = await getAdminStorefrontSnapshot();
  return Response.json(
    { ok: true, snapshot },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const reason =
    typeof body?.reason === "string" ? body.reason.trim().slice(0, 300) : "";

  if (!ACTIONS.has(action) || reason.length < 8) {
    return Response.json(
      {
        ok: false,
        message:
          "A valid storefront action and audit reason of at least 8 characters are required.",
      },
      { status: 400 },
    );
  }

  const snapshot = await getAdminStorefrontSnapshot();
  const nextRevision =
    Math.max(snapshot.draftRevision, snapshot.publishedRevision) + 1;

  if (action === "save-draft") {
    const content = sanitizeStorefrontContent(body?.content);
    await writeStorefrontVersion({
      action: "STOREFRONT_CONTENT_DRAFT_SAVED",
      content,
      revision: nextRevision,
      reason,
      actorCustomerId: session.customer.id,
      actorFingerprint: session.sessionId,
    });
  } else if (action === "publish") {
    await writeStorefrontVersion({
      action: "STOREFRONT_CONTENT_PUBLISHED",
      content: snapshot.draft,
      revision: snapshot.draftRevision,
      reason,
      actorCustomerId: session.customer.id,
      actorFingerprint: session.sessionId,
    });
  } else {
    await writeStorefrontVersion({
      action: "STOREFRONT_CONTENT_DRAFT_RESTORED",
      content: snapshot.published,
      revision: nextRevision,
      reason,
      actorCustomerId: session.customer.id,
      actorFingerprint: session.sessionId,
    });
  }

  const updated = await getAdminStorefrontSnapshot();
  return Response.json({ ok: true, snapshot: updated });
}
