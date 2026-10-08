import {auth} from "@/lib/auth/server";
import {acceptInvitation} from "@/lib/onboarding/invitations";
import {onboardingErrorResponse, sameOrigin} from "@/lib/onboarding/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"BAD_ORIGIN"}, {status:403});
  const {data} = await auth.getSession();
  const user = data?.user;
  if (!user?.id || !user.email) return Response.json({error:"UNAUTHENTICATED"}, {status:401});
  const input = await request.json().catch(() => ({}));
  try {
    const result = await acceptInvitation({id:user.id,email:user.email,name:user.name || user.email}, typeof input.token === "string" ? input.token : "");
    return Response.json(result);
  } catch (error) {return onboardingErrorResponse(error);}
}
