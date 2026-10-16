import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL (port 5432) is used by Prisma CLI for migrations;
// the app runtime uses DATABASE_URL (pooler, port 6543) via the pg adapter.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
});
