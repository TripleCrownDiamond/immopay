import {describe, expect, it} from "vitest";
import {Pool} from "pg";
// @ts-expect-error The CLI seed script is plain ESM.
import {seedDemo} from "../../scripts/seed-demo.mjs";

describe("Neon demo seed", () => {
  it.skipIf(process.env.NEON_BRANCH !== "auth-demo-rehearsal-20261008")("is repeatable without duplicating rows", async () => {
    const pool = new Pool({connectionString: process.env.DATABASE_URL_UNPOOLED});
    try {
      await seedDemo(pool);
      const first = await pool.query("select (select count(*) from organizations where is_demo) as orgs, (select count(*) from receipts) as receipts");
      await seedDemo(pool);
      const second = await pool.query("select (select count(*) from organizations where is_demo) as orgs, (select count(*) from receipts) as receipts");
      expect(second.rows).toEqual(first.rows);
    } finally {
      await pool.end();
    }
  }, 120_000);
});
