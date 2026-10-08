import {describe, expect, it} from "vitest";
import {Pool} from "pg";
// @ts-expect-error The seed CLI is plain ESM.
import {demoIds} from "../../scripts/seed-demo.mjs";
import {requireOrganization, requireTenant} from "../../src/lib/db/access";
import {listProperties} from "../../src/lib/db/owner";
import {getTenantReceipts} from "../../src/lib/db/tenant";

describe("server-side data scope", () => {
  it.skipIf(process.env.NEON_BRANCH !== "auth-demo-rehearsal-20261008")("separates organizations and tenant history", async () => {
    const db = new Pool({connectionString: process.env.DATABASE_URL_UNPOOLED});
    try {
      const identities = await db.query('SELECT id,email FROM neon_auth."user" WHERE email=ANY($1::text[])', [[
        "proprietaire.demo@immopay.test", "agence.demo@immopay.test", "locataire.demo@immopay.test",
      ]]);
      const id = (email: string) => identities.rows.find(row => row.email === email)?.id as string;
      const owner = id("proprietaire.demo@immopay.test");
      const agency = id("agence.demo@immopay.test");
      const tenant = id("locataire.demo@immopay.test");

      expect((await requireOrganization(owner, demoIds.ownerOrg, db)).role).toBe("owner");
      await expect(requireOrganization(owner, demoIds.agencyOrg, db)).rejects.toMatchObject({code: "FORBIDDEN"});
      await expect(listProperties(owner, demoIds.agencyOrg, db)).rejects.toMatchObject({code: "FORBIDDEN"});
      expect((await requireOrganization(agency, demoIds.agencyOrg, db)).role).toBe("agency_manager");
      await expect(requireOrganization(tenant, demoIds.ownerOrg, db)).rejects.toMatchObject({code: "FORBIDDEN"});
      expect((await requireTenant(tenant, db)).authUserId).toBe(tenant);
      const receipts = await getTenantReceipts(tenant, db);
      expect(receipts.map(receipt => receipt.publicCode)).toEqual(["IMP-25-09S4"]);
      await expect(getTenantReceipts(owner, db)).rejects.toMatchObject({code: "FORBIDDEN"});

      await db.query("INSERT INTO profiles(auth_user_id,full_name,kind) VALUES('test-other-tenant','Autre locataire','tenant') ON CONFLICT DO NOTHING");
      try { expect(await getTenantReceipts("test-other-tenant", db)).toEqual([]); }
      finally { await db.query("DELETE FROM profiles WHERE auth_user_id='test-other-tenant'"); }
    } finally { await db.end(); }
  }, 60_000);
});
