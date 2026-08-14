export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    ""
  );
}

export function getDatabaseUrlSource() {
  if (process.env.DATABASE_URL?.trim()) return "DATABASE_URL";
  if (process.env.POSTGRES_PRISMA_URL?.trim()) return "POSTGRES_PRISMA_URL";
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
