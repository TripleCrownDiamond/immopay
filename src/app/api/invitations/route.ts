import {auth} from "@/lib/auth/server";
import {issueInvitation, listInvitations} from "@/lib/onboarding/invitations";
import {onboardingErrorResponse, sameOrigin} from "@/lib/onboarding/http";

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
    return Response.json({id: result.id, url: `${new URL(request.url).origin}/invitation/${result.urlToken}`}, {status:201});
  } catch (error) {return onboardingErrorResponse(error);}
}
