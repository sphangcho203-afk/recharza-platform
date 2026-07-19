import { createClientFingerprint } from "@/lib/order-security";
import { getPrisma } from "@/lib/prisma";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
};

export async function consumeRateLimit({
  request,
  route,
  limit,
  windowMs,
}: {
  request: Request;
  route: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const resetAt = new Date(windowStart.getTime() + windowMs);
  const fingerprint = createClientFingerprint(request);
  const prisma = getPrisma();

  const bucket = await prisma.rateLimitBucket.upsert({
    where: {
      rate_limit_bucket: {
        fingerprint,
        route,
        windowStart,
      },
    },
    create: {
      fingerprint,
      route,
      windowStart,
      expiresAt: resetAt,
      count: 1,
    },
    update: {
      count: { increment: 1 },
      expiresAt: resetAt,
    },
  });

  return {
    allowed: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt,
  };
}

export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt.getTime() / 1000)),
  };
}
