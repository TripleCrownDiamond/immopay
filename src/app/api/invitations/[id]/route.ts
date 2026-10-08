import {auth} from "@/lib/auth/server";
import {revokeInvitation} from "@/lib/onboarding/invitations";
import {onboardingErrorResponse, sameOrigin} from "@/lib/onboarding/http";

export async function DELETE(request: Request, {params}: {params: Promise<{id:string}>}) {
  if (!sameOrigin(request)) return Response.json({error:"BAD_ORIGIN"}, {status:403});
  const {data} = await auth.getSession();
  if (!data?.user?.id) return Response.json({error:"UNAUTHENTICATED"}, {status:401});
  const {id} = await params;
  try {await revokeInvitation(data.user.id, id); return Response.json({ok:true});}
  catch (error) {return onboardingErrorResponse(error);}
}
