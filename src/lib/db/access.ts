import {getPool, type Queryable} from "./pool";

export class AccessError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code);
  }
}

export type Membership = {organizationId: string; organizationName: string; role: "owner" | "agency_manager"};

export async function listMemberships(userId: string, db: Queryable = getPool()): Promise<Membership[]> {
  if (!userId) throw new AccessError("UNAUTHENTICATED");
  const result = await db.query(`
    SELECT o.id AS "organizationId", o.name AS "organizationName", m.role
    FROM organization_members m
    JOIN organizations o ON o.id=m.organization_id
    JOIN profiles p ON p.auth_user_id=m.auth_user_id
    WHERE m.auth_user_id=$1
      AND ((m.role='owner' AND p.kind='owner') OR (m.role='agency_manager' AND p.kind='agency_manager'))
    ORDER BY o.name, o.id`, [userId]);
  return result.rows;
}

export async function requireOrganization(userId: string, organizationId?: string, db: Queryable = getPool()): Promise<Membership> {
  const memberships = await listMemberships(userId, db);
  const membership = organizationId ? memberships.find(item => item.organizationId === organizationId) : memberships[0];
  if (!membership) throw new AccessError("FORBIDDEN");
  return membership;
}

export async function requireTenant(userId: string, db: Queryable = getPool()): Promise<{authUserId: string; fullName: string; immopayId: string | null}> {
  if (!userId) throw new AccessError("UNAUTHENTICATED");
  const result = await db.query(`
    SELECT auth_user_id AS "authUserId", full_name AS "fullName", immopay_id AS "immopayId"
    FROM profiles WHERE auth_user_id=$1 AND kind='tenant'`, [userId]);
  if (!result.rows[0]) throw new AccessError("FORBIDDEN");
  return result.rows[0];
}
