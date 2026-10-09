import {createHash, randomBytes} from "node:crypto";
import type {Pool} from "pg";
import {AccessError, requireOrganization} from "../db/access";
import {getPool, type Queryable} from "../db/pool";
import {requireAgencyManager} from "./agency";
import {isUuid, OnboardingError} from "./errors";
import {normalizeEmail} from "./tenants";
import type {InvitationDelivery} from "../email/invitation-email";

export type InvitationKind = "tenant" | "agency_manager";
export type InvitationInput = {kind: InvitationKind; organizationId: string; tenantId?: string; email?: string};

export async function issueInvitation(userId: string, input: InvitationInput, db: Pool = getPool()): Promise<{id: string; urlToken: string; email:string; organizationName:string}> {
  if (!isUuid(input.organizationId) || (input.tenantId && !isUuid(input.tenantId))) throw new OnboardingError("INVALID_ID");
  if (input.kind !== "tenant" && input.kind !== "agency_manager") throw new OnboardingError("INVALID_INVITATION");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const organization=await requireOrganization(userId, input.organizationId, client);
    let email: string;
    let tenantId: string | null = null;
    if (input.kind === "agency_manager") {
      await requireAgencyManager(userId, input.organizationId, client);
      email = normalizeEmail(input.email ?? "");
    } else {
      if (!input.tenantId) throw new OnboardingError("INVALID_TENANT");
      tenantId = input.tenantId;
      const tenant = await client.query(`SELECT email,auth_user_id FROM tenants
        WHERE id=$1 AND organization_id=$2 FOR UPDATE`, [tenantId, input.organizationId]);
      if (!tenant.rows[0]) throw new AccessError("FORBIDDEN");
      if (tenant.rows[0].auth_user_id) throw new OnboardingError("ALREADY_LINKED");
      email = normalizeEmail(tenant.rows[0].email ?? "");
      if (input.email && normalizeEmail(input.email) !== email) throw new OnboardingError("INVALID_EMAIL");
    }
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${input.organizationId}:${input.kind}:${email}:${tenantId ?? ""}`]);
    await client.query(`UPDATE account_invitations SET revoked_at=now()
      WHERE organization_id=$1 AND kind=$2 AND email=$3 AND tenant_id IS NOT DISTINCT FROM $4
        AND accepted_at IS NULL AND revoked_at IS NULL`, [input.organizationId, input.kind, email, tenantId]);
    const urlToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(urlToken).digest("hex");
    const inserted = await client.query(`INSERT INTO account_invitations
      (organization_id,kind,tenant_id,email,token_hash,expires_at,created_by_auth_user_id)
      VALUES($1,$2,$3,$4,$5,now()+interval '7 days',$6) RETURNING id`,
      [input.organizationId, input.kind, tenantId, email, tokenHash, userId]);
    await client.query("COMMIT");
    return {id: inserted.rows[0].id as string, urlToken, email, organizationName:organization.organizationName};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {client.release();}
}

export async function markInvitationDelivery(id:string,status:InvitationDelivery,db:Queryable=getPool()):Promise<void> {
  await db.query(`UPDATE account_invitations SET email_delivery_status=$2,
    email_accepted_at=CASE WHEN $2='sent' THEN now() ELSE NULL END WHERE id=$1`,[id,status]);
}

export type InvitationListItem = {id: string; kind: InvitationKind; email: string; tenantId: string | null; expiresAt: string; acceptedAt: string | null; revokedAt: string | null; emailDeliveryStatus:InvitationDelivery;emailAcceptedAt:string|null};

export async function listInvitations(userId: string, organizationId: string, db: Queryable = getPool()): Promise<InvitationListItem[]> {
  if (!isUuid(organizationId)) throw new OnboardingError("INVALID_ID");
  await requireOrganization(userId, organizationId, db);
  const result = await db.query(`SELECT id,kind,email,tenant_id AS "tenantId",
    expires_at AS "expiresAt",accepted_at AS "acceptedAt",revoked_at AS "revokedAt",
    email_delivery_status AS "emailDeliveryStatus",email_accepted_at AS "emailAcceptedAt"
    FROM account_invitations WHERE organization_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100`, [organizationId]);
  return result.rows;
}

export async function revokeInvitation(userId: string, invitationId: string, db: Pool = getPool()): Promise<void> {
  if (!isUuid(invitationId)) throw new OnboardingError("INVALID_ID");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT organization_id,kind,accepted_at FROM account_invitations WHERE id=$1 FOR UPDATE", [invitationId]);
    const row = result.rows[0];
    if (!row) throw new AccessError("FORBIDDEN");
    await requireOrganization(userId, row.organization_id, client);
    if (row.kind === "agency_manager") await requireAgencyManager(userId, row.organization_id, client);
    if (row.accepted_at) throw new OnboardingError("USED");
    await client.query("UPDATE account_invitations SET revoked_at=COALESCE(revoked_at,now()) WHERE id=$1", [invitationId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {client.release();}
}

const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export type InvitationPreview = {
  kind: InvitationKind | null; organizationName: string | null; maskedEmail: string | null;
  state: "open" | "expired" | "used" | "revoked" | "invalid";
};

export async function previewInvitation(token: string, db: Queryable = getPool()): Promise<InvitationPreview> {
  if (!tokenPattern.test(token)) return {kind:null, organizationName:null, maskedEmail:null, state:"invalid"};
  const result = await db.query(`SELECT i.kind,i.email,i.expires_at,i.accepted_at,i.revoked_at,o.name AS organization_name
    FROM account_invitations i JOIN organizations o ON o.id=i.organization_id WHERE i.token_hash=$1`, [tokenHash(token)]);
  const row = result.rows[0];
  if (!row) return {kind:null, organizationName:null, maskedEmail:null, state:"invalid"};
  const [local, domain] = (row.email as string).split("@");
  const maskedEmail = `${local.slice(0,1)}***@${domain}`;
  const state = row.accepted_at ? "used" : row.revoked_at ? "revoked"
    : new Date(row.expires_at).getTime() <= Date.now() ? "expired" : "open";
  return {kind:row.kind, organizationName:row.organization_name, maskedEmail, state};
}

export async function acceptInvitation(
  user: {id:string;email:string;name:string}, token: string, db: Pool = getPool(),
): Promise<{destination:string}> {
  if (!tokenPattern.test(token)) throw new OnboardingError("INVALID_INVITATION");
  const email = normalizeEmail(user.email);
  if (!user.id) throw new AccessError("UNAUTHENTICATED");
  const hash = tokenHash(token);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [user.id]);
    const hint = await client.query("SELECT tenant_id,organization_id FROM account_invitations WHERE token_hash=$1", [hash]);
    if (!hint.rows[0]) throw new OnboardingError("INVALID_INVITATION");
    let tenant;
    if (hint.rows[0].tenant_id) {
      const tenantResult = await client.query(`SELECT id,email,full_name,auth_user_id FROM tenants
        WHERE id=$1 AND organization_id=$2 FOR UPDATE`, [hint.rows[0].tenant_id, hint.rows[0].organization_id]);
      tenant = tenantResult.rows[0];
      if (!tenant) throw new OnboardingError("INVALID_TENANT");
    }
    const locked = await client.query("SELECT * FROM account_invitations WHERE token_hash=$1 FOR UPDATE", [hash]);
    const invite = locked.rows[0];
    if (!invite) throw new OnboardingError("INVALID_INVITATION");
    const destination = invite.kind === "tenant" ? "/espace-locataire" : "/dashboard";
    if (invite.accepted_at) {
      if (invite.accepted_by_auth_user_id === user.id) {await client.query("COMMIT"); return {destination};}
      throw new OnboardingError("USED");
    }
    if (invite.revoked_at) throw new OnboardingError("REVOKED");
    if (new Date(invite.expires_at).getTime() <= Date.now()) throw new OnboardingError("EXPIRED");
    if (invite.email !== email) throw new OnboardingError("EMAIL_MISMATCH");
    const profile = await client.query("SELECT kind,email FROM profiles WHERE auth_user_id=$1 FOR UPDATE", [user.id]);
    if (profile.rows[0] && (profile.rows[0].kind !== invite.kind || profile.rows[0].email !== email)) {
      throw new OnboardingError("ROLE_CONFLICT");
    }
    const emailOwner = await client.query("SELECT auth_user_id FROM profiles WHERE email=$1", [email]);
    if (emailOwner.rows[0] && emailOwner.rows[0].auth_user_id !== user.id) throw new OnboardingError("ROLE_CONFLICT");
    if (invite.kind === "tenant") {
      if (!tenant || tenant.email?.trim().toLowerCase() !== email) throw new OnboardingError("INVALID_TENANT");
      if (tenant.auth_user_id && tenant.auth_user_id !== user.id) throw new OnboardingError("ALREADY_LINKED");
      if (!profile.rows[0]) {
        await client.query(`INSERT INTO profiles(auth_user_id,full_name,kind,email,immopay_id)
          VALUES($1,$2,'tenant',$3,$4)`, [user.id, tenant.full_name, email, `IMP-${randomBytes(6).toString("hex").toUpperCase()}`]);
      }
      await client.query("UPDATE tenants SET auth_user_id=$1 WHERE id=$2 AND organization_id=$3", [user.id, tenant.id, invite.organization_id]);
    } else {
      const organization = await client.query("SELECT kind FROM organizations WHERE id=$1", [invite.organization_id]);
      if (organization.rows[0]?.kind !== "agency") throw new OnboardingError("ROLE_CONFLICT");
      const memberships = await client.query("SELECT organization_id FROM organization_members WHERE auth_user_id=$1", [user.id]);
      if (memberships.rows.some(row => row.organization_id !== invite.organization_id)) throw new OnboardingError("ROLE_CONFLICT");
      if (!profile.rows[0]) {
        await client.query(`INSERT INTO profiles(auth_user_id,full_name,kind,email)
          VALUES($1,$2,'agency_manager',$3)`, [user.id, user.name.trim().slice(0,120) || email, email]);
      }
      await client.query(`INSERT INTO organization_members(organization_id,auth_user_id,role)
        VALUES($1,$2,'agency_manager') ON CONFLICT(organization_id,auth_user_id) DO NOTHING`, [invite.organization_id, user.id]);
    }
    await client.query("UPDATE account_invitations SET accepted_at=now(),accepted_by_auth_user_id=$1 WHERE id=$2", [user.id, invite.id]);
    await client.query("COMMIT");
    return {destination};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {client.release();}
}
