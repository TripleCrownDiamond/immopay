import {createHash} from "node:crypto";
import {readFile, readdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import pg from "pg";

const projectId = "morning-resonance-39210364";
const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../neon/migrations");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

export function assertTarget() {
  const branch = arg("--branch");
  if (arg("--project-id") !== projectId || !branch || branch !== process.env.NEON_BRANCH) {
    throw new Error("Explicit --project-id and --branch must match the loaded Neon environment");
  }
  if (!process.env.DATABASE_URL_UNPOOLED) throw new Error("DATABASE_URL_UNPOOLED is required");
}

export async function migrate(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    sha256 text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const files = (await readdir(migrationsDir)).filter(f => /^\d+_.*\.sql$/.test(f)).sort();
  for (const filename of files) {
    const sql = await readFile(path.join(migrationsDir, filename), "utf8");
    const sha256 = createHash("sha256").update(sql).digest("hex");
    await client.query("BEGIN");
    try {
      await client.query("SELECT pg_advisory_xact_lock(460211)");
      const prior = await client.query("SELECT sha256 FROM schema_migrations WHERE filename=$1", [filename]);
      if (prior.rows.length) {
        if (prior.rows[0].sha256 !== sha256) throw new Error(`Migration changed after apply: ${filename}`);
      } else {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(filename,sha256) VALUES($1,$2)", [filename, sha256]);
        process.stdout.write(`Applied ${filename}\n`);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assertTarget();
    const client = new pg.Client({connectionString: process.env.DATABASE_URL_UNPOOLED});
    await client.connect();
    try { await migrate(client); } finally { await client.end(); }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
