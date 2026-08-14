import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { requireDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as typeof globalThis & {
  recharzaPrisma?: PrismaClient;
};

export function getPrisma() {
  if (!globalForPrisma.recharzaPrisma) {
    const connectionString = requireDatabaseUrl();
    const adapter = new PrismaPg({ connectionString });

    globalForPrisma.recharzaPrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.recharzaPrisma;
}
