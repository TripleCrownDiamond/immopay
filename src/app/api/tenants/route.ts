import {auth} from "@/lib/auth/server";
import {createTenant} from "@/lib/onboarding/tenants";
import {onboardingErrorResponse, sameOrigin} from "@/lib/onboarding/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"BAD_ORIGIN"}, {status:403});
  const {data} = await auth.getSession();
  if (!data?.user?.id) return Response.json({error:"UNAUTHENTICATED"}, {status:401});
  const input = await request.json().catch(() => ({}));
  try {
    const result = await createTenant(data.user.id, {
      fullName: typeof input.fullName === "string" ? input.fullName : "",
      email: typeof input.email === "string" ? input.email : "",
      phone: typeof input.phone === "string" ? input.phone : undefined,
    });
    return Response.json(result, {status:201});
  } catch (error) {return onboardingErrorResponse(error);}
}
