import { createHash, timingSafeEqual } from "node:crypto";

import { requireEnvironmentVariable } from "@/lib/runtime-config";

function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization?.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyBearerEnvironmentSecret(request: Request, variableName: string) {
  const expected = requireEnvironmentVariable(variableName, { minLength: 32 });
  const provided = extractBearerToken(request);

  if (!provided || !constantTimeEqual(provided, expected)) {
    return null;
  }

  return {
    actorFingerprint: createHash("sha256")
      .update(`${variableName}:${expected}`)
      .digest("hex")
      .slice(0, 24),
  };
}

export function verifyOperatorAccess(request: Request) {
  return verifyBearerEnvironmentSecret(request, "ADMIN_ACCESS_TOKEN");
}

export function verifyMaintenanceAccess(request: Request) {
  return verifyBearerEnvironmentSecret(request, "CRON_SECRET");
}
