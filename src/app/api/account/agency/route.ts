import {auth} from "@/lib/auth/server";
import {AccessError} from "@/lib/db/access";
import {createAgency} from "@/lib/onboarding/agency";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return Response.json({error: "BAD_ORIGIN"}, {status: 403});
  const {data} = await auth.getSession();
  const user = data?.user;
  if (!user?.id || !user.email) return Response.json({error: "UNAUTHENTICATED"}, {status: 401});
  const input = await request.json().catch(() => ({}));
  const agencyName = typeof input.agencyName === "string" ? input.agencyName.trim() : "";
  if (agencyName.length < 2 || agencyName.length > 120) return Response.json({error: "INVALID_AGENCY_NAME"}, {status: 400});
  try {
    const result = await createAgency({id: user.id, email: user.email, name: user.name || user.email}, agencyName);
    return Response.json(result, {status: 201});
  } catch (error) {
    if (error instanceof AccessError) return Response.json({error: error.code}, {status: 403});
    throw error;
  }
}
