import "dotenv/config";

import pg from "pg";

const { Client } = pg;
const requireRemote = process.argv.includes("--require-remote");
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(databaseUrl);
} catch {
  console.error("DATABASE_URL is not a valid PostgreSQL connection string.");
  process.exit(1);
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
if (requireRemote && localHosts.has(parsed.hostname)) {
  console.error(
    "DATABASE_URL still points to local PostgreSQL. Configure the Neon connection before continuing.",
  );
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();

  const identity = await client.query(`
    SELECT
      current_database() AS database_name,
      current_user AS role_name,
      version() AS postgres_version
  `);
  const checks = await client.query(`
    SELECT
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Customer'
          AND column_name = 'passwordHash'
      ) AS customer_password_hash,
      EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'PasswordResetToken'
      ) AS password_reset_table,
      EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'Cart'
      ) AS cart_table,
      EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'CartItem'
      ) AS cart_item_table,
      EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'EmailDelivery'
      ) AS email_delivery_table,
      EXISTS (
        SELECT 1
        FROM "_prisma_migrations"
        WHERE "migration_name" = '20260804144500_customer_auth_cart_email_foundation'
          AND "finished_at" IS NOT NULL
          AND "rolled_back_at" IS NULL
      ) AS prisma_history_recorded
  `);

  const result = checks.rows[0];
  const failures = Object.entries(result)
    .filter(([, passed]) => passed !== true)
    .map(([name]) => name);

  if (failures.length) {
    console.error(
      `Database foundation is incomplete: ${failures.join(", ")}.`,
    );
    process.exitCode = 1;
  } else {
    const info = identity.rows[0];
    console.log(
      `Database foundation verified on ${parsed.hostname}/${info.database_name} as ${info.role_name}.`,
    );
    console.log("Account, recovery, cart, order-email, and Prisma history checks passed.");
  }
} catch (error) {
  console.error(
    error instanceof Error
      ? `Database verification failed: ${error.message}`
      : "Database verification failed.",
  );
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
