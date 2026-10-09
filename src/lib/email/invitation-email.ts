export type InvitationDelivery = "sent" | "not_configured" | "failed";
type InvitationEmail = {id:string;to:string;url:string;organizationName:string;kind:"tenant"|"agency_manager"};

export async function sendInvitationEmail(input:InvitationEmail,fetcher:typeof fetch=fetch):Promise<InvitationDelivery> {
  const key=process.env.RESEND_API_KEY;
  const from=process.env.INVITATION_FROM_EMAIL;
  if (!key || !from) return "not_configured";
  const role=input.kind==="tenant"?"locataire":"gestionnaire d’agence";
  const text=`${input.organizationName} vous invite à rejoindre ImmoPay en tant que ${role}.\n\nOuvrez ce lien pour créer votre compte ou vous connecter :\n${input.url}\n\nCe lien personnel expire dans 7 jours. Si vous n’attendiez pas cette invitation, ignorez ce message.`;
  try {
    const response=await fetcher("https://api.resend.com/emails",{
      method:"POST",
      signal:AbortSignal.timeout(8000),
      headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json","Idempotency-Key":`invitation/${input.id}`},
      body:JSON.stringify({from,to:input.to,subject:"Votre invitation ImmoPay",text}),
    });
    return response.ok?"sent":"failed";
  } catch {return "failed";}
}
