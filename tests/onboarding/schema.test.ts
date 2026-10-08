import {describe, expect, it} from "vitest";
import {Pool} from "pg";

describe("onboarding schema", () => {
  it.skipIf(process.env.NEON_BRANCH !== "auth-onboarding-rehearsal-20261008")("adds invitation constraints without changing the demo agency", async () => {
    const db = new Pool({connectionString: process.env.DATABASE_URL_UNPOOLED});
    try {
      const column = await db.query("SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='kind'");
      expect(column.rowCount).toBe(1);
      const agency = await db.query(`SELECT o.id, o.kind, m.auth_user_id
        FROM organizations o JOIN organization_members m ON m.organization_id=o.id
        WHERE m.role='agency_manager' LIMIT 1`);
      expect(agency.rows[0]?.kind).toBe("agency");
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        await expect(client.query(`INSERT INTO account_invitations
          (organization_id,kind,email,token_hash,expires_at,created_by_auth_user_id)
          VALUES($1,'tenant','schema-probe@example.test',$2,now()+interval '7 days',$3)`,
          [agency.rows[0].id, "f".repeat(64), agency.rows[0].auth_user_id])).rejects.toMatchObject({code: "23514"});
      } finally {
        await client.query("ROLLBACK");
        client.release();
      }
    } finally {
      await db.end();
    }
  }, 60_000);
});
