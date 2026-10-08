import {requireTenant} from "./access";
import {getPool, type Queryable} from "./pool";

export type TenantRental = {
  id: string; landlord: string; unit: string; city: string | null;
  rent: number; from: string; to: string | null;
};
export type TenantReceipt = {
  publicCode: string; rentalId: string; period: string;
  amount: number; paidOn: string; onTime: boolean;
};
export type TenantDue = {
  id: string; period: string; amount: number; paid: number; dueOn: string;
  unit: string; landlord: string;
};

export async function getTenantRentals(userId: string, db: Queryable = getPool()): Promise<TenantRental[]> {
  await requireTenant(userId, db);
  const result = await db.query(`
    SELECT l.id, o.name AS landlord, u.name AS unit, p.address AS city,
      l.rent_amount::text AS rent, to_char(l.starts_on,'YYYY-MM-DD') AS "from",
      CASE WHEN l.ends_on IS NULL THEN NULL ELSE to_char(l.ends_on,'YYYY-MM-DD') END AS "to"
    FROM leases l
    JOIN tenants t ON t.id=l.tenant_id AND t.organization_id=l.organization_id
    JOIN units u ON u.id=l.unit_id AND u.organization_id=l.organization_id
    JOIN properties p ON p.id=u.property_id AND p.organization_id=l.organization_id
    JOIN organizations o ON o.id=l.organization_id
    WHERE t.auth_user_id=$1 ORDER BY l.starts_on DESC, l.id`, [userId]);
  return result.rows.map(row => ({...row, rent: Number(row.rent)}));
}

export async function getTenantReceipts(userId: string, db: Queryable = getPool()): Promise<TenantReceipt[]> {
  await requireTenant(userId, db);
  const result = await db.query(`
    SELECT r.public_code AS "publicCode", l.id AS "rentalId",
      to_char(d.period_start,'TMMonth YYYY') AS period, r.amount::text AS amount,
      to_char(r.issued_at AT TIME ZONE 'UTC','DD/MM/YYYY') AS "paidOn", r.on_time AS "onTime"
    FROM receipts r
    JOIN rent_dues d ON d.id=r.rent_due_id AND d.organization_id=r.organization_id
    JOIN leases l ON l.id=d.lease_id AND l.organization_id=d.organization_id
    JOIN tenants t ON t.id=l.tenant_id AND t.organization_id=l.organization_id
    WHERE t.auth_user_id=$1 ORDER BY r.issued_at DESC, r.id`, [userId]);
  return result.rows.map(row => ({...row, amount: Number(row.amount)}));
}

export async function getTenantCurrentDue(userId: string, db: Queryable = getPool()): Promise<TenantDue | null> {
  await requireTenant(userId, db);
  const result = await db.query(`
    SELECT d.id, to_char(d.period_start,'TMMonth YYYY') AS period,
      d.amount_expected::text AS amount, d.amount_paid::text AS paid,
      to_char(d.due_on,'DD/MM/YYYY') AS "dueOn", u.name AS unit, o.name AS landlord
    FROM rent_dues d
    JOIN leases l ON l.id=d.lease_id AND l.organization_id=d.organization_id
    JOIN tenants t ON t.id=l.tenant_id AND t.organization_id=l.organization_id
    JOIN units u ON u.id=l.unit_id AND u.organization_id=l.organization_id
    JOIN organizations o ON o.id=l.organization_id
    WHERE t.auth_user_id=$1 AND l.active AND d.amount_paid<d.amount_expected AND d.status<>'cancelled'
    ORDER BY d.due_on ASC, d.id LIMIT 1`, [userId]);
  const row = result.rows[0];
  return row ? {...row, amount: Number(row.amount), paid: Number(row.paid)} : null;
}

export async function getTenantHome(userId: string, db: Queryable = getPool()) {
  const profile = await requireTenant(userId, db);
  const [rentals, receipts, currentDue] = await Promise.all([
    getTenantRentals(userId, db), getTenantReceipts(userId, db), getTenantCurrentDue(userId, db),
  ]);
  const onTime = receipts.filter(receipt => receipt.onTime).length;
  return {
    profile, rentals, receipts, currentDue,
    summary: {total: receipts.length, onTime, late: receipts.length - onTime,
      rate: receipts.length ? Math.round(onTime / receipts.length * 100) : 0,
      rentals: rentals.length},
  };
}
