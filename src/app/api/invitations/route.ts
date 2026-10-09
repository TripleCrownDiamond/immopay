import {auth} from "@/lib/auth/server";
import {issueInvitation, listInvitations, markInvitationDelivery} from "@/lib/onboarding/invitations";
import {onboardingErrorResponse, sameOrigin} from "@/lib/onboarding/http";
import {sendInvitationEmail} from "@/lib/email/invitation-email";

export async function GET(request: Request) {
  const {data} = await auth.getSession();
  if (!data?.user?.id) return Response.json({error:"UNAUTHENTICATED"}, {status:401});
  const organizationId = new URL(request.url).searchParams.get("organizationId") ?? "";
  try {return Response.json({invitations: await listInvitations(data.user.id, organizationId)});}
  catch (error) {return onboardingErrorResponse(error);}
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"BAD_ORIGIN"}, {status:403});
  const {data} = await auth.getSession();
  if (!data?.user?.id) return Response.json({error:"UNAUTHENTICATED"}, {status:401});
  const input = await request.json().catch(() => ({}));
  try {
    const result = await issueInvitation(data.user.id, {
      kind: input.kind,
      organizationId: typeof input.organizationId === "string" ? input.organizationId : "",
      tenantId: typeof input.tenantId === "string" ? input.tenantId : undefined,
      email: typeof input.email === "string" ? input.email : undefined,
    });
    const url=`${new URL(request.url).origin}/invitation/${result.urlToken}`;
    const delivery=await sendInvitationEmail({id:result.id,to:result.email,url,organizationName:result.organizationName,kind:input.kind});
    try {await markInvitationDelivery(result.id,delivery);}
    catch (error) {console.error("Invitation delivery metadata update failed",{invitationId:result.id,category:error instanceof Error?error.name:"unknown"});}
    return Response.json({id:result.id,url,delivery}, {status:201});
  } catch (error) {return onboardingErrorResponse(error);}
}
