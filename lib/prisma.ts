import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { requireEnvironmentVariable } from "@/lib/runtime-config";

const globalForPrisma = globalThis as typeof globalThis & {
  recharzaPrisma?: PrismaClient;
};

export function getPrisma() {
  if (!globalForPrisma.recharzaPrisma) {
    const connectionString = requireEnvironmentVariable("DATABASE_URL");
    const adapter = new PrismaPg({ connectionString });

    globalForPrisma.recharzaPrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.recharzaPrisma;
}
