import {fileURLToPath} from "node:url";
import path from "node:path";
import pg from "pg";
import {assertTarget} from "./migrate.mjs";

export const demoIds = {
  ownerOrg: "10000000-0000-4000-8000-000000000001",
  agencyOrg: "10000000-0000-4000-8000-000000000002",
  paulOwner: "40000000-0000-4000-8000-000000000001",
  paulAgency: "40000000-0000-4000-8000-000000000003",
};

async function upsert(client, table, columns, values) {
  const quoted = columns.map(c => `"${c}"`);
  const placeholders = columns.map((_, i) => `$${i + 1}`);
  const updates = columns.filter(c => c !== "id").map(c => `"${c}"=EXCLUDED."${c}"`);
  await client.query(
    `INSERT INTO ${table} (${quoted.join(",")}) VALUES (${placeholders.join(",")}) ON CONFLICT (id) DO UPDATE SET ${updates.join(",")}`,
    values,
  );
}

export async function seedDemo(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(460212)");
    const existing = await client.query("SELECT id, is_demo FROM organizations WHERE id = ANY($1::uuid[])", [[demoIds.ownerOrg, demoIds.agencyOrg]]);
    if (existing.rows.some(row => !row.is_demo)) throw new Error("A demo organization ID belongs to real data");

    const rows = [
      ["organizations", ["id", "name", "currency", "is_demo", "kind"], [demoIds.ownerOrg, "Résidence Démo", "XOF", true, "owner"]],
      ["organizations", ["id", "name", "currency", "is_demo", "kind"], [demoIds.agencyOrg, "Agence Démo", "XOF", true, "agency"]],
      ["properties", ["id", "organization_id", "name", "type", "address"], ["20000000-0000-4000-8000-000000000001", demoIds.ownerOrg, "Résidence Les Cocotiers", "immeuble", "Cotonou, Fidjrossè"]],
      ["properties", ["id", "organization_id", "name", "type", "address"], ["20000000-0000-4000-8000-000000000002", demoIds.agencyOrg, "Boutiques Cadjèhoun", "commerce", "Cotonou, Cadjèhoun"]],
      ["properties", ["id", "organization_id", "name", "type", "address"], ["20000000-0000-4000-8000-000000000003", demoIds.agencyOrg, "Studios Calavi", "immeuble", "Abomey-Calavi"]],
      ["units", ["id", "organization_id", "property_id", "name", "status"], ["30000000-0000-4000-8000-000000000001", demoIds.ownerOrg, "20000000-0000-4000-8000-000000000001", "Appartement A03", "occupied"]],
      ["units", ["id", "organization_id", "property_id", "name", "status"], ["30000000-0000-4000-8000-000000000002", demoIds.agencyOrg, "20000000-0000-4000-8000-000000000002", "Boutique B2", "occupied"]],
      ["units", ["id", "organization_id", "property_id", "name", "status"], ["30000000-0000-4000-8000-000000000003", demoIds.agencyOrg, "20000000-0000-4000-8000-000000000003", "Studio 4", "vacant"]],
      ["tenants", ["id", "organization_id", "full_name", "email", "phone"], [demoIds.paulOwner, demoIds.ownerOrg, "Paul Adjovi", "paul.demo@immopay.test", "+229 97 12 34 56"]],
      ["tenants", ["id", "organization_id", "full_name", "email", "phone"], ["40000000-0000-4000-8000-000000000002", demoIds.ownerOrg, "Aïcha Soglo", null, null]],
      ["tenants", ["id", "organization_id", "full_name", "email", "phone"], [demoIds.paulAgency, demoIds.agencyOrg, "Paul Adjovi", "paul.demo@immopay.test", "+229 97 12 34 56"]],
      ["tenants", ["id", "organization_id", "full_name", "email", "phone"], ["40000000-0000-4000-8000-000000000004", demoIds.agencyOrg, "Jean Kora", null, null]],
      ["leases", ["id", "organization_id", "unit_id", "tenant_id", "rent_amount", "currency", "starts_on", "ends_on", "active"], ["50000000-0000-4000-8000-000000000001", demoIds.ownerOrg, "30000000-0000-4000-8000-000000000001", demoIds.paulOwner, 110000, "XOF", "2025-11-01", null, true]],
      ["leases", ["id", "organization_id", "unit_id", "tenant_id", "rent_amount", "currency", "starts_on", "ends_on", "active"], ["50000000-0000-4000-8000-000000000002", demoIds.ownerOrg, "30000000-0000-4000-8000-000000000001", "40000000-0000-4000-8000-000000000002", 110000, "XOF", "2024-01-01", "2025-10-31", false]],
      ["leases", ["id", "organization_id", "unit_id", "tenant_id", "rent_amount", "currency", "starts_on", "ends_on", "active"], ["50000000-0000-4000-8000-000000000003", demoIds.agencyOrg, "30000000-0000-4000-8000-000000000003", demoIds.paulAgency, 60000, "XOF", "2024-03-01", "2025-10-31", false]],
      ["leases", ["id", "organization_id", "unit_id", "tenant_id", "rent_amount", "currency", "starts_on", "ends_on", "active"], ["50000000-0000-4000-8000-000000000004", demoIds.agencyOrg, "30000000-0000-4000-8000-000000000002", "40000000-0000-4000-8000-000000000004", 95000, "XOF", "2026-01-01", null, true]],
      ["rent_dues", ["id", "organization_id", "lease_id", "period_start", "period_end", "due_on", "amount_expected", "amount_paid", "status"], ["60000000-0000-4000-8000-000000000001", demoIds.ownerOrg, "50000000-0000-4000-8000-000000000001", "2026-10-01", "2026-10-31", "2026-10-05", 110000, 66000, "partial"]],
      ["rent_dues", ["id", "organization_id", "lease_id", "period_start", "period_end", "due_on", "amount_expected", "amount_paid", "status"], ["60000000-0000-4000-8000-000000000002", demoIds.ownerOrg, "50000000-0000-4000-8000-000000000002", "2025-09-01", "2025-09-30", "2025-09-05", 110000, 110000, "paid"]],
      ["rent_dues", ["id", "organization_id", "lease_id", "period_start", "period_end", "due_on", "amount_expected", "amount_paid", "status"], ["60000000-0000-4000-8000-000000000003", demoIds.agencyOrg, "50000000-0000-4000-8000-000000000003", "2025-09-01", "2025-09-30", "2025-09-05", 60000, 60000, "paid"]],
      ["rent_dues", ["id", "organization_id", "lease_id", "period_start", "period_end", "due_on", "amount_expected", "amount_paid", "status"], ["60000000-0000-4000-8000-000000000004", demoIds.agencyOrg, "50000000-0000-4000-8000-000000000004", "2026-10-01", "2026-10-31", "2026-10-05", 95000, 40000, "partial"]],
      ["payments", ["id", "organization_id", "tenant_id", "internal_reference", "amount", "currency", "method", "status", "paid_at"], ["70000000-0000-4000-8000-000000000001", demoIds.ownerOrg, demoIds.paulOwner, "DEMO-PAUL-OCT", 66000, "XOF", "mobile_money", "paid", "2026-10-04T10:00:00Z"]],
      ["payments", ["id", "organization_id", "tenant_id", "internal_reference", "amount", "currency", "method", "status", "paid_at"], ["70000000-0000-4000-8000-000000000002", demoIds.ownerOrg, "40000000-0000-4000-8000-000000000002", "DEMO-AICHA-SEP", 110000, "XOF", "bank_transfer", "paid", "2025-09-04T10:00:00Z"]],
      ["payments", ["id", "organization_id", "tenant_id", "internal_reference", "amount", "currency", "method", "status", "paid_at"], ["70000000-0000-4000-8000-000000000003", demoIds.agencyOrg, demoIds.paulAgency, "DEMO-PAUL-SEP", 60000, "XOF", "cash", "paid", "2025-09-05T10:00:00Z"]],
      ["payments", ["id", "organization_id", "tenant_id", "internal_reference", "amount", "currency", "method", "status", "paid_at"], ["70000000-0000-4000-8000-000000000004", demoIds.agencyOrg, "40000000-0000-4000-8000-000000000004", "DEMO-JEAN-OCT", 40000, "XOF", "bank_deposit", "paid", "2026-10-06T10:00:00Z"]],
      ["receipts", ["id", "organization_id", "rent_due_id", "public_code", "amount", "issued_at", "on_time"], ["80000000-0000-4000-8000-000000000001", demoIds.ownerOrg, "60000000-0000-4000-8000-000000000002", "IMP-25-09A3", 110000, "2025-09-04T10:00:00Z", true]],
      ["receipts", ["id", "organization_id", "rent_due_id", "public_code", "amount", "issued_at", "on_time"], ["80000000-0000-4000-8000-000000000002", demoIds.agencyOrg, "60000000-0000-4000-8000-000000000003", "IMP-25-09S4", 60000, "2025-09-05T10:00:00Z", true]],
    ];
    for (const [table, columns, values] of rows) await upsert(client, table, columns, values);
    await client.query("COMMIT");
    return {organizations: 2, receipts: 2};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assertTarget();
    const pool = new pg.Pool({connectionString: process.env.DATABASE_URL_UNPOOLED});
    try { process.stdout.write(`${JSON.stringify(await seedDemo(pool))}\n`); } finally { await pool.end(); }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
