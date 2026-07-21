import { createHash, timingSafeEqual } from "node:crypto";

import { getRequestSession, hasStaffRole } from "@/lib/auth";
import { requireEnvironmentVariable } from "@/lib/runtime-config";

function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization?.startsWith("Bearer ")) return "";
  return authorization.slice(7).trim();
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyOptionalBearerEnvironmentSecret(request: Request, variableName: string) {
  const expected = process.env[variableName]?.trim() ?? "";
  const provided = extractBearerToken(request);
  if (expected.length < 32 || !provided || !constantTimeEqual(provided, expected)) return null;

  return {
    actorFingerprint: createHash("sha256")
      .update(`${variableName}:${expected}`)
      .digest("hex")
      .slice(0, 24),
    actorCustomerId: null,
    role: "EMERGENCY_TOKEN" as const,
    mode: "bearer" as const,
  };
}

export async function verifyOperatorAccess(request: Request) {
  const bearer = verifyOptionalBearerEnvironmentSecret(request, "ADMIN_ACCESS_TOKEN");
  if (bearer) return bearer;

  const session = await getRequestSession(request);
  if (!session || !hasStaffRole(session.customer.role)) return null;

  return {
    actorFingerprint: createHash("sha256")
      .update(`staff:${session.customer.id}:${session.customer.role}`)
      .digest("hex")
      .slice(0, 24),
    actorCustomerId: session.customer.id,
    role: session.customer.role,
    mode: "session" as const,
  };
}

export function verifyMaintenanceAccess(request: Request) {
  const expected = requireEnvironmentVariable("CRON_SECRET", { minLength: 32 });
  const provided = extractBearerToken(request);
  if (!provided || !constantTimeEqual(provided, expected)) return null;

  return {
    actorFingerprint: createHash("sha256")
      .update(`CRON_SECRET:${expected}`)
      .digest("hex")
      .slice(0, 24),
  };
}
