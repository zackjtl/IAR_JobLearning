// Starts a throwaway local Postgres (embedded-postgres) for development/testing
// without Supabase, and applies prisma/migrations/*/migration.sql.
// Usage: node scripts/local-pg.mjs   (keeps running; Ctrl+C to stop)
// Then set DATABASE_URL=postgresql://postgres:postgres@localhost:54329/academy
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.env.LOCAL_PG_DIR ?? ".local-pg");
const fresh = !fs.existsSync(dir);
const server = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "postgres", port: 54329, persistent: true });
if (fresh) await server.initialise();
await server.start();
if (fresh) await server.createDatabase("academy");
const client = new pg.Client({ connectionString: "postgresql://postgres:postgres@localhost:54329/academy" });
await client.connect();
const { rows } = await client.query(`select to_regclass('public."Settings"') as t`);
if (!rows[0].t) {
  const migDir = path.resolve("prisma/migrations");
  for (const m of fs.readdirSync(migDir).filter((d) => fs.statSync(path.join(migDir, d)).isDirectory()).sort()) {
    await client.query(fs.readFileSync(path.join(migDir, m, "migration.sql"), "utf8"));
    console.log("applied", m);
  }
}
await client.end();
console.log("Local Postgres ready: postgresql://postgres:postgres@localhost:54329/academy");
process.on("SIGINT", async () => { await server.stop(); process.exit(0); });
setInterval(() => {}, 1 << 30);
