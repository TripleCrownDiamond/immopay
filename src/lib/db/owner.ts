import {requireOrganization} from "./access";
import {getPool, type Queryable} from "./pool";

export async function getOwnerDashboard(userId: string, organizationId?: string, db: Queryable = getPool()) {
  const membership = await requireOrganization(userId, organizationId, db);
  const [profile, totals, nextDue] = await Promise.all([
    db.query("SELECT full_name AS name FROM profiles WHERE auth_user_id=$1", [userId]),
    db.query(`SELECT COALESCE(SUM(amount_expected),0)::text AS expected,
      COALESCE(SUM(amount_paid),0)::text AS paid,
      COALESCE(SUM(amount_expected-amount_paid),0)::text AS remaining,
      COALESCE(SUM(amount_expected-amount_paid) FILTER (WHERE due_on<CURRENT_DATE),0)::text AS overdue
      FROM rent_dues WHERE organization_id=$1 AND period_start<=CURRENT_DATE AND period_end>=CURRENT_DATE`, [membership.organizationId]),
    db.query(`SELECT to_char(d.due_on,'DD/MM/YYYY') AS "dueOn", u.name AS unit,
      (d.amount_expected-d.amount_paid)::text AS amount
      FROM rent_dues d JOIN leases l ON l.id=d.lease_id AND l.organization_id=d.organization_id
      JOIN units u ON u.id=l.unit_id AND u.organization_id=l.organization_id
      WHERE d.organization_id=$1 AND d.amount_paid<d.amount_expected AND d.status<>'cancelled'
      ORDER BY d.due_on, d.id LIMIT 1`, [membership.organizationId]),
  ]);
  const row = totals.rows[0];
  return {
    membership, name: profile.rows[0]?.name ?? "",
    stats: {expected: Number(row.expected), paid: Number(row.paid), remaining: Number(row.remaining), overdue: Number(row.overdue)},
    nextDue: nextDue.rows[0] ? {...nextDue.rows[0], amount: Number(nextDue.rows[0].amount)} : null,
  };
}

export async function listProperties(userId: string, organizationId?: string, db: Queryable = getPool()) {
  const membership = await requireOrganization(userId, organizationId, db);
  const result = await db.query(`SELECT p.id, p.name, p.type, p.address,
    COUNT(u.id)::int AS units, COUNT(u.id) FILTER (WHERE u.status='occupied')::int AS occupied
    FROM properties p LEFT JOIN units u ON u.property_id=p.id AND u.organization_id=p.organization_id
    WHERE p.organization_id=$1 GROUP BY p.id ORDER BY p.name`, [membership.organizationId]);
  return {membership, rows: result.rows as {id: string; name: string; type: string; address: string | null; units: number; occupied: number}[]};
}

export async function listTenants(userId: string, organizationId?: string, db: Queryable = getPool()) {
  const membership = await requireOrganization(userId, organizationId, db);
  const result = await db.query(`SELECT t.id, t.full_name AS name, t.email, u.name AS unit,
    COALESCE(d.status,'none') AS status
    FROM tenants t
    LEFT JOIN LATERAL (SELECT l.id,l.unit_id FROM leases l
      WHERE l.tenant_id=t.id AND l.organization_id=t.organization_id ORDER BY l.active DESC,l.starts_on DESC LIMIT 1) l ON true
    LEFT JOIN units u ON u.id=l.unit_id AND u.organization_id=t.organization_id
    LEFT JOIN LATERAL (SELECT status FROM rent_dues d WHERE d.lease_id=l.id ORDER BY d.due_on DESC LIMIT 1) d ON true
    WHERE t.organization_id=$1 ORDER BY t.full_name`, [membership.organizationId]);
  return {membership, rows: result.rows as {id: string; name: string; email: string | null; unit: string | null; status: string}[]};
}

export async function listDues(userId: string, organizationId?: string, db: Queryable = getPool()) {
  const membership = await requireOrganization(userId, organizationId, db);
  const result = await db.query(`SELECT d.id, to_char(d.due_on,'DD/MM/YYYY') AS "dueOn",
    t.full_name AS tenant, u.name AS unit, d.amount_expected::text AS expected,
    d.amount_paid::text AS paid, d.status
    FROM rent_dues d JOIN leases l ON l.id=d.lease_id AND l.organization_id=d.organization_id
    JOIN tenants t ON t.id=l.tenant_id AND t.organization_id=l.organization_id
    JOIN units u ON u.id=l.unit_id AND u.organization_id=l.organization_id
    WHERE d.organization_id=$1 ORDER BY d.due_on DESC, d.id`, [membership.organizationId]);
  return {membership, rows: result.rows.map(row => ({...row, expected: Number(row.expected), paid: Number(row.paid)}))};
}

export async function listPayments(userId: string, organizationId?: string, db: Queryable = getPool()) {
  const membership = await requireOrganization(userId, organizationId, db);
  const result = await db.query(`SELECT p.id, t.full_name AS tenant, u.name AS unit,
    p.amount::text AS amount, p.method, p.status,
    CASE WHEN p.paid_at IS NULL THEN NULL ELSE to_char(p.paid_at AT TIME ZONE 'UTC','DD/MM/YYYY') END AS "paidOn"
    FROM payments p JOIN tenants t ON t.id=p.tenant_id AND t.organization_id=p.organization_id
    LEFT JOIN LATERAL (SELECT l.unit_id FROM leases l WHERE l.tenant_id=t.id AND l.organization_id=t.organization_id
      ORDER BY l.active DESC,l.starts_on DESC LIMIT 1) l ON true
    LEFT JOIN units u ON u.id=l.unit_id AND u.organization_id=t.organization_id
    WHERE p.organization_id=$1 ORDER BY p.paid_at DESC NULLS LAST,p.id`, [membership.organizationId]);
  return {membership, rows: result.rows.map(row => ({...row, amount: Number(row.amount)}))};
}

export async function listReceipts(userId: string, organizationId?: string, db: Queryable = getPool()) {
  const membership = await requireOrganization(userId, organizationId, db);
  const result = await db.query(`SELECT r.public_code AS "publicCode", t.full_name AS tenant,
    to_char(d.period_start,'YYYY-MM') AS period, r.amount::text AS amount
    FROM receipts r
    JOIN rent_dues d ON d.id=r.rent_due_id AND d.organization_id=r.organization_id
    JOIN leases l ON l.id=d.lease_id AND l.organization_id=d.organization_id
    JOIN tenants t ON t.id=l.tenant_id AND t.organization_id=l.organization_id
    WHERE r.organization_id=$1 ORDER BY r.issued_at DESC,r.id`, [membership.organizationId]);
  return {membership, rows: result.rows.map(row => ({...row, amount: Number(row.amount)}))};
}
