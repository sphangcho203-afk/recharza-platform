/**
 * Resolve the canonical PostgreSQL connection string for Prisma.
 *
 * Vercel's Neon integration exposes POSTGRES_PRISMA_URL alongside legacy or
 * manually-created DATABASE_URL values. The integration URL is the source of
 * truth for hosted deployments because it follows the connected Neon branch.
 * DATABASE_URL remains a fallback for local development and older deploys.
 */
export function getDatabaseUrl() {
  return (
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    ""
  );
}

export function getDatabaseUrlSource() {
  if (process.env.POSTGRES_PRISMA_URL?.trim()) return "POSTGRES_PRISMA_URL";
  if (process.env.DATABASE_URL?.trim()) return "DATABASE_URL";
  return null;
}

export function requireDatabaseUrl() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL or POSTGRES_PRISMA_URL is required before the database can be used.",
    );
  }
  return databaseUrl;
}
