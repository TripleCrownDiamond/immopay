import {randomUUID} from "node:crypto";
import {describe, expect, it} from "vitest";
import {Pool} from "pg";
import {createAgency, requireAgencyManager} from "../../src/lib/onboarding/agency";

describe("agency registration", () => {
  it.skipIf(process.env.NEON_BRANCH !== "auth-onboarding-rehearsal-20261008")("creates once and refuses an owner profile", async () => {
    const db = new Pool({connectionString: process.env.DATABASE_URL_UNPOOLED});
    const id = `test-agency-${randomUUID()}`;
    const ownerId = `test-owner-${randomUUID()}`;
    try {
      const user = {id, email: `${id}@example.test`, name: "Gestionnaire Test"};
      const first = await createAgency(user, "Agence Kora", db);
      expect(first.organizationId).toBeTruthy();
      expect((await createAgency(user, "Agence Kora", db)).organizationId).toBe(first.organizationId);
      const membership = await requireAgencyManager(id, first.organizationId, db);
      expect(membership.role).toBe("agency_manager");
      await db.query("INSERT INTO profiles(auth_user_id,full_name,kind,email) VALUES($1,'Owner Test','owner',$2)", [ownerId, `${ownerId}@example.test`]);
      await expect(createAgency({id: ownerId, email: `${ownerId}@example.test`, name: "Owner Test"}, "Intrus", db)).rejects.toMatchObject({code: "FORBIDDEN"});
      const count = await db.query("SELECT count(*)::int AS n FROM organizations WHERE created_by_auth_user_id=$1", [ownerId]);
      expect(count.rows[0].n).toBe(0);
    } finally {
      await db.query("DELETE FROM organizations WHERE created_by_auth_user_id=$1", [id]).catch(() => {});
      await db.query("DELETE FROM profiles WHERE auth_user_id=ANY($1::text[])", [[id, ownerId]]).catch(() => {});
      await db.end();
    }
  }, 60_000);
});
