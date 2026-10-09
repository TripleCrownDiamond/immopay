export const dynamic = "force-dynamic";
import Link from "next/link";
import {InvitationAccept} from "@/components/auth/invitation-accept";
import {previewInvitation} from "@/lib/onboarding/invitations";

export default async function InvitationPage({params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  const invitation=await previewInvitation(token);
  const message = invitation.state==="expired"?"Ce lien a expiré. Demandez une nouvelle invitation."
    : invitation.state==="revoked"?"Cette invitation a été révoquée."
    : invitation.state==="used"?"Cette invitation a déjà été utilisée."
    : "Ce lien d’invitation est invalide.";
  return <main className="grid min-h-screen place-items-center bg-[#F6F8FD] p-6"><section className="w-full max-w-lg rounded-3xl border border-brand-line bg-white p-8 shadow-sm">
    <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto"/></Link>
    <p className="mt-9 text-sm font-bold text-brand-blue">Invitation ImmoPay</p>
    {invitation.state==="open" && invitation.kind?<><h1 className="mt-2 text-3xl font-bold">Rejoindre {invitation.organizationName}</h1><p className="mt-2 text-slate-500">Accès {invitation.kind==="tenant"?"à votre espace locataire":"à l’espace de gestion de l’agence"} pour l’adresse {invitation.maskedEmail}.</p><InvitationAccept token={token} kind={invitation.kind}/></>:<><h1 className="mt-2 text-3xl font-bold">Invitation indisponible</h1><p className="mt-3 text-slate-500">{message}</p></>}
  </section></main>;
}
