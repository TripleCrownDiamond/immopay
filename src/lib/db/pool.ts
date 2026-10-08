import {Pool} from "pg";

export type Queryable = Pick<Pool, "query">;

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required");
    pool = new Pool({connectionString, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000});
  }
  return pool;
}
