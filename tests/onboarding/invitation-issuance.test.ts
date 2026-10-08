import {randomUUID} from "node:crypto";
import {describe, expect, it} from "vitest";
import {Pool} from "pg";
import {createTenant, updateTenantEmail} from "../../src/lib/onboarding/tenants";
import {issueInvitation, listInvitations, revokeInvitation} from "../../src/lib/onboarding/invitations";

describe("invitation issuance", () => {
  it.skipIf(process.env.NEON_BRANCH !== "auth-onboarding-rehearsal-20261008")("scopes tenants and keeps one live invitation", async () => {
    const db = new Pool({connectionString: process.env.DATABASE_URL_UNPOOLED});
    const owner = `test-owner-${randomUUID()}`;
    const manager = `test-manager-${randomUUID()}`;
    let ownerOrg = "";
    let agencyOrg = "";
    try {
      await db.query(`INSERT INTO profiles(auth_user_id,full_name,kind,email) VALUES
        ($1,'Owner','owner',$2),($3,'Manager','agency_manager',$4)`, [owner, `${owner}@example.test`, manager, `${manager}@example.test`]);
      ownerOrg = (await db.query("INSERT INTO organizations(name,kind,created_by_auth_user_id) VALUES('Test Owner','owner',$1) RETURNING id", [owner])).rows[0].id;
      agencyOrg = (await db.query("INSERT INTO organizations(name,kind,created_by_auth_user_id) VALUES('Test Agency','agency',$1) RETURNING id", [manager])).rows[0].id;
      await db.query("INSERT INTO organization_members(organization_id,auth_user_id,role) VALUES($1,$2,'owner'),($3,$4,'agency_manager')", [ownerOrg, owner, agencyOrg, manager]);
      const tenant = await createTenant(owner, {fullName: "Awa Test", email: "awa@example.test"}, db);
      await expect(updateTenantEmail(manager, tenant.id, "else@example.test", db)).rejects.toMatchObject({code: "FORBIDDEN"});
      await expect(issueInvitation(manager, {kind:"tenant", organizationId:agencyOrg, tenantId:tenant.id}, db)).rejects.toMatchObject({code: "FORBIDDEN"});
      await expect(issueInvitation(owner, {kind:"agency_manager", organizationId:ownerOrg, email:"new@example.test"}, db)).rejects.toMatchObject({code: "FORBIDDEN"});
      const [first, second] = await Promise.all([
        issueInvitation(owner, {kind:"tenant", organizationId:ownerOrg, tenantId:tenant.id}, db),
        issueInvitation(owner, {kind:"tenant", organizationId:ownerOrg, tenantId:tenant.id}, db),
      ]);
      expect(first.urlToken).not.toBe(second.urlToken);
      const pending = await listInvitations(owner, ownerOrg, db);
      expect(pending.filter(row => !row.revokedAt && !row.acceptedAt)).toHaveLength(1);
      expect(JSON.stringify(pending)).not.toContain(first.urlToken);
      await expect(listInvitations(manager, ownerOrg, db)).rejects.toMatchObject({code: "FORBIDDEN"});
      await revokeInvitation(owner, pending.find(row => !row.revokedAt)!.id, db);
      expect((await listInvitations(owner, ownerOrg, db)).filter(row => !row.revokedAt && !row.acceptedAt)).toHaveLength(0);
      const noEmail = (await db.query("INSERT INTO tenants(organization_id,full_name) VALUES($1,'Sans email') RETURNING id", [ownerOrg])).rows[0].id;
      await expect(issueInvitation(owner, {kind:"tenant", organizationId:ownerOrg, tenantId:noEmail}, db)).rejects.toMatchObject({code: "INVALID_EMAIL"});
      await updateTenantEmail(owner, noEmail, "nouveau@example.test", db);
      expect((await issueInvitation(owner, {kind:"tenant", organizationId:ownerOrg, tenantId:noEmail}, db)).urlToken).toBeTruthy();
      await db.query("UPDATE tenants SET auth_user_id=$1 WHERE id=$2", [owner, tenant.id]);
      await expect(issueInvitation(owner, {kind:"tenant", organizationId:ownerOrg, tenantId:tenant.id}, db)).rejects.toMatchObject({code: "ALREADY_LINKED"});
    } finally {
      if (ownerOrg || agencyOrg) {
        await db.query("DELETE FROM account_invitations WHERE organization_id=ANY($1::uuid[])", [[ownerOrg, agencyOrg].filter(Boolean)]).catch(() => {});
        await db.query("DELETE FROM organizations WHERE id=ANY($1::uuid[])", [[ownerOrg, agencyOrg].filter(Boolean)]).catch(() => {});
      }
      await db.query("DELETE FROM profiles WHERE auth_user_id=ANY($1::text[])", [[owner, manager]]).catch(() => {});
      await db.end();
    }
  }, 60_000);
});
