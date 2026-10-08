import {auth} from "@/lib/auth/server";
import {listMemberships} from "@/lib/db/access";
import {getPool} from "@/lib/db/pool";

export async function GET() {
  const {data} = await auth.getSession();
  const userId = data?.user?.id;
  if (!userId) return Response.json({error: "UNAUTHENTICATED"}, {status: 401});
  const db = getPool();
  const profile = await db.query("SELECT kind FROM profiles WHERE auth_user_id=$1", [userId]);
  if (!profile.rows[0]) return Response.json({error: "PROFILE_NOT_READY"}, {status: 404});
  if (profile.rows[0].kind === "tenant") return Response.json({role: "tenant", destination: "/espace-locataire"});
  const memberships = await listMemberships(userId, db);
  if (!memberships.length) return Response.json({error: "NO_ORGANIZATION"}, {status: 403});
  return Response.json({role: memberships[0].role, destination: "/dashboard", organizations: memberships});
}
