export const dynamic = "force-dynamic";
import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {InviteForm} from "@/components/invitations/invite-form";
import {requireOwnerPage} from "@/lib/auth/page-access";
import {listTenants} from "@/lib/db/owner";
import {listInvitations} from "@/lib/onboarding/invitations";
export default async function Tenants(){
  const userId=await requireOwnerPage();
  const {membership,rows}=await listTenants(userId);
  const invitations=await listInvitations(userId,membership.organizationId);
  return <AppShell><p className="text-sm text-slate-500">{membership.organizationName}</p><div className="mt-1 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold">Locataires</h1><Link href="/tenants/new" className="rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white">Ajouter un locataire</Link></div><p className="mt-2 text-slate-500">Invitez chaque locataire à consulter ses échéances et ses quittances.</p>
    {rows.length?<div className="mt-7 space-y-3">{rows.map(t=>{const pending=invitations.find(i=>i.kind==="tenant"&&i.tenantId===t.id&&!i.revokedAt&&!i.acceptedAt&&new Date(i.expiresAt).getTime()>Date.now());return <article key={t.id} className="grid gap-4 rounded-2xl border border-brand-line bg-white p-5 shadow-sm lg:grid-cols-[minmax(180px,1fr)_minmax(260px,1.4fr)]"><div><strong>{t.name}</strong><p className="text-sm text-slate-500">{t.unit??"Aucun logement"} · {t.status}</p></div><InviteForm kind="tenant" organizationId={membership.organizationId} tenantId={t.id} email={t.email} linked={!!t.authUserId} pendingInvitationId={pending?.id} emailDeliveryStatus={pending?.emailDeliveryStatus}/></article>})}</div>:<p className="mt-7 rounded-2xl bg-white p-6 text-slate-500">Aucun locataire dans cet espace. Ajoutez le premier pour préparer son invitation.</p>}
  </AppShell>;
}
