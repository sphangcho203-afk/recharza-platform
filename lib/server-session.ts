import "server-only";

import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AccountRole } from "@/generated/prisma/client";
import { getSessionCookieName, type AuthSessionResult } from "@/lib/auth";
import { canAccessWorkspace, type Workspace } from "@/lib/product-system";
import { getPrisma } from "@/lib/prisma";

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getServerSession(): Promise<AuthSessionResult | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token || token.length < 32 || token.length > 256) return null;

  const session = await getPrisma().authSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { customer: true },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  if (!session.customer.emailVerifiedAt) return null;

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    customer: {
      id: session.customer.id,
      email: session.customer.email,
      displayName: session.customer.displayName,
      username: session.customer.username,
      role: session.customer.role,
      emailVerifiedAt: session.customer.emailVerifiedAt,
    },
  };
}

function accountRedirect(returnTo: string, reason: "sign-in" | "forbidden") {
  const params = new URLSearchParams({ returnTo, reason });
  return `/account?${params.toString()}`;
}

export async function requireWorkspaceSession(
  workspace: Exclude<Workspace, "customer">,
  returnTo: string,
) {
  const session = await getServerSession();
  if (!session) redirect(accountRedirect(returnTo, "sign-in"));

  if (!canAccessWorkspace(session.customer.role, workspace)) {
    redirect(accountRedirect("/account", "forbidden"));
  }

  return session;
}

export function roleLabel(role: AccountRole) {
  if (role === "ADMIN") return "Administrator";
  if (role === "STAFF") return "Staff";
  return "Customer";
}
