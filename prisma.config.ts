import "dotenv/config";

import { defineConfig } from "prisma/config";

const fallbackUrl =
  "postgresql://postgres:postgres@127.0.0.1:5432/recharza?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackUrl,
  },
});
