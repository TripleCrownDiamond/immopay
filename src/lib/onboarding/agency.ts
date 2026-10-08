import type {Pool} from "pg";
import {AccessError, type Membership} from "../db/access";
import {getPool, type Queryable} from "../db/pool";

export async function requireAgencyManager(userId: string, organizationId: string, db: Queryable = getPool()): Promise<Membership> {
  if (!userId) throw new AccessError("UNAUTHENTICATED");
  const result = await db.query(`SELECT o.id AS "organizationId", o.name AS "organizationName", m.role
    FROM organization_members m JOIN organizations o ON o.id=m.organization_id
    JOIN profiles p ON p.auth_user_id=m.auth_user_id
    WHERE m.auth_user_id=$1 AND o.id=$2 AND o.kind='agency'
      AND m.role='agency_manager' AND p.kind='agency_manager'`, [userId, organizationId]);
  if (!result.rows[0]) throw new AccessError("FORBIDDEN");
  return result.rows[0];
}

export async function createAgency(
  user: {id: string; email: string; name: string}, agencyName: string, db: Pool = getPool(),
): Promise<{organizationId: string}> {
  const name = agencyName.trim();
  if (name.length < 2 || name.length > 120) throw new Error("INVALID_AGENCY_NAME");
  const email = user.email.trim().toLowerCase();
  if (!user.id || !email) throw new AccessError("UNAUTHENTICATED");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [user.id]);
    const profile = await client.query("SELECT kind,email FROM profiles WHERE auth_user_id=$1 FOR UPDATE", [user.id]);
    if (profile.rows[0] && (profile.rows[0].kind !== "agency_manager" || profile.rows[0].email !== email)) {
      throw new AccessError("FORBIDDEN");
    }
    if (profile.rows[0]) {
      const existing = await client.query(`SELECT o.id FROM organization_members m JOIN organizations o ON o.id=m.organization_id
        WHERE m.auth_user_id=$1 AND m.role='agency_manager' AND o.kind='agency' LIMIT 1`, [user.id]);
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return {organizationId: existing.rows[0].id};
      }
      throw new AccessError("FORBIDDEN");
    }
    await client.query(`INSERT INTO profiles(auth_user_id,full_name,kind,email)
      VALUES($1,$2,'agency_manager',$3)`, [user.id, user.name.trim().slice(0, 120) || email, email]);
    const organization = await client.query(`INSERT INTO organizations(name,currency,kind,created_by_auth_user_id)
      VALUES($1,'XOF','agency',$2) RETURNING id`, [name, user.id]);
    const organizationId = organization.rows[0].id as string;
    await client.query(`INSERT INTO organization_members(organization_id,auth_user_id,role)
      VALUES($1,$2,'agency_manager')`, [organizationId, user.id]);
    await client.query("COMMIT");
    return {organizationId};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
