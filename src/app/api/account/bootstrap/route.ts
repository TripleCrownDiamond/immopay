import {auth} from "@/lib/auth/server";
import {getPool} from "@/lib/db/pool";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({error: "BAD_ORIGIN"}, {status: 403});
  const {data} = await auth.getSession();
  const user = data?.user;
  if (!user?.id || !user.email) return Response.json({error: "UNAUTHENTICATED"}, {status: 401});

  const input = await request.json().catch(() => ({}));
  const phone = typeof input.phone === "string" ? input.phone.trim().slice(0, 40) : null;
  const name = (user.name || user.email.split("@")[0]).trim().slice(0, 120);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [user.id]);
    const existing = await client.query("SELECT kind FROM profiles WHERE auth_user_id=$1 FOR UPDATE", [user.id]);
    if (existing.rows[0] && existing.rows[0].kind !== "owner") {
      await client.query("ROLLBACK");
      return Response.json({error: "FORBIDDEN"}, {status: 403});
    }
    await client.query(`INSERT INTO profiles(auth_user_id,full_name,kind,email,phone)
      VALUES($1,$2,'owner',$3,$4) ON CONFLICT(auth_user_id) DO NOTHING`, [user.id, name, user.email, phone]);
    const membership = await client.query("SELECT organization_id FROM organization_members WHERE auth_user_id=$1 AND role='owner' LIMIT 1", [user.id]);
    let organizationId = membership.rows[0]?.organization_id as string | undefined;
    if (!organizationId) {
      const organization = await client.query(`INSERT INTO organizations(name,currency,created_by_auth_user_id)
        VALUES($1,'XOF',$2) RETURNING id`, [`Locations de ${name}`, user.id]);
      organizationId = organization.rows[0].id;
      await client.query("INSERT INTO organization_members(organization_id,auth_user_id,role) VALUES($1,$2,'owner')", [organizationId, user.id]);
    }
    await client.query("COMMIT");
    return Response.json({organizationId});
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
