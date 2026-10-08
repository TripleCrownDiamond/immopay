import {createHash, randomBytes} from "node:crypto";
import type {Pool} from "pg";
import {AccessError, requireOrganization} from "../db/access";
import {getPool, type Queryable} from "../db/pool";
import {requireAgencyManager} from "./agency";
import {isUuid, OnboardingError} from "./errors";
import {normalizeEmail} from "./tenants";

export type InvitationKind = "tenant" | "agency_manager";
export type InvitationInput = {kind: InvitationKind; organizationId: string; tenantId?: string; email?: string};

export async function issueInvitation(userId: string, input: InvitationInput, db: Pool = getPool()): Promise<{id: string; urlToken: string}> {
  if (!isUuid(input.organizationId) || (input.tenantId && !isUuid(input.tenantId))) throw new OnboardingError("INVALID_ID");
  if (input.kind !== "tenant" && input.kind !== "agency_manager") throw new OnboardingError("INVALID_INVITATION");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await requireOrganization(userId, input.organizationId, client);
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
    return {id: inserted.rows[0].id as string, urlToken};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {client.release();}
}

export type InvitationListItem = {id: string; kind: InvitationKind; email: string; tenantId: string | null; expiresAt: string; acceptedAt: string | null; revokedAt: string | null};

export async function listInvitations(userId: string, organizationId: string, db: Queryable = getPool()): Promise<InvitationListItem[]> {
  if (!isUuid(organizationId)) throw new OnboardingError("INVALID_ID");
  await requireOrganization(userId, organizationId, db);
  const result = await db.query(`SELECT id,kind,email,tenant_id AS "tenantId",
    expires_at AS "expiresAt",accepted_at AS "acceptedAt",revoked_at AS "revokedAt"
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
