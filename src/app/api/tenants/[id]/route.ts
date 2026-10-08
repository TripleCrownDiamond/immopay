import {auth} from "@/lib/auth/server";
import {updateTenantEmail} from "@/lib/onboarding/tenants";
import {onboardingErrorResponse, sameOrigin} from "@/lib/onboarding/http";

export async function PATCH(request: Request, {params}: {params: Promise<{id:string}>}) {
  if (!sameOrigin(request)) return Response.json({error:"BAD_ORIGIN"}, {status:403});
  const {data} = await auth.getSession();
  if (!data?.user?.id) return Response.json({error:"UNAUTHENTICATED"}, {status:401});
  const input = await request.json().catch(() => ({}));
  const {id} = await params;
  try {
    const result = await updateTenantEmail(data.user.id, id, typeof input.email === "string" ? input.email : "");
    return Response.json(result);
  } catch (error) {return onboardingErrorResponse(error);}
}
