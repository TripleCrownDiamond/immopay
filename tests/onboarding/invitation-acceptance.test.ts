import {randomUUID} from "node:crypto";
import {describe, expect, it} from "vitest";
import {Pool} from "pg";
import {issueInvitation, acceptInvitation, previewInvitation} from "../../src/lib/onboarding/invitations";
import {getTenantRentals} from "../../src/lib/db/tenant";
import {requireAgencyManager} from "../../src/lib/onboarding/agency";

describe("invitation acceptance", () => {
  it.skipIf(process.env.NEON_BRANCH !== "auth-onboarding-rehearsal-20261008")("binds only the invited identity and rejects stale tokens", async () => {
    const db = new Pool({connectionString: process.env.DATABASE_URL_UNPOOLED});
    const suffix = randomUUID();
    const owner = `test-owner-${suffix}`;
    const manager = `test-manager-${suffix}`;
    const tenantAuth = `test-tenant-${suffix}`;
    const newManager = `test-new-manager-${suffix}`;
    const ownerEmail = `owner-${suffix}@example.test`;
    const managerEmail = `manager-${suffix}@example.test`;
    const tenantEmail = `tenant-${suffix}@example.test`;
    const newManagerEmail = `new-manager-${suffix}@example.test`;
    let ownerOrg = "";
    let agencyOrg = "";
    try {
      await db.query(`INSERT INTO profiles(auth_user_id,full_name,kind,email) VALUES
        ($1,'Owner','owner',$2),($3,'Manager','agency_manager',$4)`, [owner, ownerEmail, manager, managerEmail]);
      ownerOrg = (await db.query("INSERT INTO organizations(name,kind,created_by_auth_user_id) VALUES('Owner Test','owner',$1) RETURNING id", [owner])).rows[0].id;
      agencyOrg = (await db.query("INSERT INTO organizations(name,kind,created_by_auth_user_id) VALUES('Agency Test','agency',$1) RETURNING id", [manager])).rows[0].id;
      await db.query("INSERT INTO organization_members(organization_id,auth_user_id,role) VALUES($1,$2,'owner'),($3,$4,'agency_manager')", [ownerOrg, owner, agencyOrg, manager]);
      const property = (await db.query("INSERT INTO properties(organization_id,name,type) VALUES($1,'Maison','residential') RETURNING id", [ownerOrg])).rows[0].id;
      const unit = (await db.query("INSERT INTO units(organization_id,property_id,name,status) VALUES($1,$2,'A1','occupied') RETURNING id", [ownerOrg, property])).rows[0].id;
      const tenant = (await db.query("INSERT INTO tenants(organization_id,full_name,email) VALUES($1,'Locataire',$2) RETURNING id", [ownerOrg, tenantEmail])).rows[0].id;
      await db.query("INSERT INTO leases(organization_id,unit_id,tenant_id,rent_amount,starts_on) VALUES($1,$2,$3,50000,CURRENT_DATE)", [ownerOrg, unit, tenant]);

      const invitation = await issueInvitation(owner,{kind:"tenant",organizationId:ownerOrg,tenantId:tenant},db);
      expect((await previewInvitation(invitation.urlToken,db)).state).toBe("open");
      await expect(acceptInvitation({id:"wrong",email:"wrong@example.test",name:"Wrong"},invitation.urlToken,db)).rejects.toMatchObject({code:"EMAIL_MISMATCH"});
      const user = {id:tenantAuth,email:tenantEmail,name:"Locataire"};
      expect((await acceptInvitation(user,invitation.urlToken,db)).destination).toBe("/espace-locataire");
      expect(await getTenantRentals(tenantAuth,db)).toHaveLength(1);
      expect((await acceptInvitation(user,invitation.urlToken,db)).destination).toBe("/espace-locataire");
      await expect(acceptInvitation({id:"other",email:tenantEmail,name:"Other"},invitation.urlToken,db)).rejects.toMatchObject({code:"USED"});
      expect((await previewInvitation(invitation.urlToken,db)).state).toBe("used");
      expect((await previewInvitation("not-a-token",db)).state).toBe("invalid");

      const agencyInvite = await issueInvitation(manager,{kind:"agency_manager",organizationId:agencyOrg,email:newManagerEmail},db);
      expect((await acceptInvitation({id:newManager,email:newManagerEmail,name:"Collègue"},agencyInvite.urlToken,db)).destination).toBe("/dashboard");
      expect((await requireAgencyManager(newManager,agencyOrg,db)).role).toBe("agency_manager");
      const expired = await issueInvitation(manager,{kind:"agency_manager",organizationId:agencyOrg,email:`expired-${suffix}@example.test`},db);
      await db.query("UPDATE account_invitations SET expires_at=now()-interval '1 second' WHERE id=$1",[expired.id]);
      await expect(acceptInvitation({id:`expired-${suffix}`,email:`expired-${suffix}@example.test`,name:"Expired"},expired.urlToken,db)).rejects.toMatchObject({code:"EXPIRED"});
      const revoked = await issueInvitation(manager,{kind:"agency_manager",organizationId:agencyOrg,email:`revoked-${suffix}@example.test`},db);
      await db.query("UPDATE account_invitations SET revoked_at=now() WHERE id=$1",[revoked.id]);
      await expect(acceptInvitation({id:`revoked-${suffix}`,email:`revoked-${suffix}@example.test`,name:"Revoked"},revoked.urlToken,db)).rejects.toMatchObject({code:"REVOKED"});
      const conflict = await issueInvitation(manager,{kind:"agency_manager",organizationId:agencyOrg,email:ownerEmail},db);
      await expect(acceptInvitation({id:owner,email:ownerEmail,name:"Owner"},conflict.urlToken,db)).rejects.toMatchObject({code:"ROLE_CONFLICT"});
    } finally {
      if (ownerOrg || agencyOrg) await db.query("DELETE FROM organizations WHERE id=ANY($1::uuid[])", [[ownerOrg,agencyOrg].filter(Boolean)]).catch(() => {});
      await db.query("DELETE FROM profiles WHERE auth_user_id=ANY($1::text[])", [[owner,manager,tenantAuth,newManager]]).catch(() => {});
      await db.end();
    }
  }, 120_000);
});
