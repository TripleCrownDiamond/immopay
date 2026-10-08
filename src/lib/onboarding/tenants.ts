import type {Pool} from "pg";
import {AccessError, requireOrganization} from "../db/access";
import {getPool} from "../db/pool";
import {isUuid, OnboardingError} from "./errors";

export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OnboardingError("INVALID_EMAIL");
  return email;
}

export async function createTenant(userId: string, input: {fullName: string; email: string; phone?: string}, db: Pool = getPool()) {
  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 120) throw new OnboardingError("INVALID_NAME");
  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim().slice(0, 40) || null;
  const membership = await requireOrganization(userId, undefined, db);
  const result = await db.query(`INSERT INTO tenants(organization_id,full_name,email,phone)
    VALUES($1,$2,$3,$4) RETURNING id`, [membership.organizationId, fullName, email, phone]);
  return {id: result.rows[0].id as string, organizationId: membership.organizationId};
}

export async function updateTenantEmail(userId: string, tenantId: string, value: string, db: Pool = getPool()) {
  if (!isUuid(tenantId)) throw new OnboardingError("INVALID_ID");
  const email = normalizeEmail(value);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const membership = await requireOrganization(userId, undefined, client);
    const tenant = await client.query(`SELECT auth_user_id FROM tenants WHERE id=$1 AND organization_id=$2 FOR UPDATE`,
      [tenantId, membership.organizationId]);
    if (!tenant.rows[0]) throw new AccessError("FORBIDDEN");
    if (tenant.rows[0].auth_user_id) throw new OnboardingError("ALREADY_LINKED");
    await client.query("UPDATE tenants SET email=$1 WHERE id=$2 AND organization_id=$3", [email, tenantId, membership.organizationId]);
    await client.query(`UPDATE account_invitations SET revoked_at=now()
      WHERE organization_id=$1 AND tenant_id=$2 AND accepted_at IS NULL AND revoked_at IS NULL`,
      [membership.organizationId, tenantId]);
    await client.query("COMMIT");
    return {id: tenantId, email};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
