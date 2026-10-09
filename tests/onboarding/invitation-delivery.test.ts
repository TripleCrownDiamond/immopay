import {describe,expect,it} from "vitest";
import {Pool} from "pg";

describe("invitation delivery schema",()=>{
  it.skipIf(process.env.NEON_BRANCH!=="auth-onboarding-rehearsal-20261008")("has a constrained delivery state",async()=>{
    const db=new Pool({connectionString:process.env.DATABASE_URL_UNPOOLED});
    try {
      const columns=await db.query(`SELECT column_name,column_default FROM information_schema.columns
        WHERE table_name='account_invitations' AND column_name IN ('email_delivery_status','email_accepted_at')`);
      expect(columns.rows).toHaveLength(2);
      expect(columns.rows.find(row=>row.column_name==="email_delivery_status")?.column_default).toContain("not_configured");
      const constraints=await db.query(`SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conname='account_invitations_email_delivery_check'`);
      expect(constraints.rows).toHaveLength(1);
      expect(constraints.rows[0].definition).toContain("email_delivery_status");
    } finally {await db.end();}
  },30_000);
});
