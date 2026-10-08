import {Pool} from "pg";

export type Queryable = Pick<Pool, "query">;

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required");
    pool = new Pool({connectionString, max: 3, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 30_000});
    // Neon can close idle pooled sockets; pg replaces them on the next query.
    pool.on("error", () => {});
  }
  return pool;
}
