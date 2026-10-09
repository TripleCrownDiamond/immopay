"use client";
import {useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import toast from "react-hot-toast";
import type {InvitationDelivery} from "@/lib/email/invitation-email";

type InviteFormProps = {
  kind: "tenant" | "agency_manager"; organizationId: string; tenantId?: string;
  email?: string | null; linked?: boolean; pendingInvitationId?: string;
  emailDeliveryStatus?: InvitationDelivery;
};

export function InviteForm({kind,organizationId,tenantId,email,linked,pendingInvitationId,emailDeliveryStatus}: InviteFormProps) {
  const router = useRouter();
  const [currentEmail,setCurrentEmail] = useState(email ?? "");
  const [pending,setPending] = useState(false);
  const [error,setError] = useState("");
  const [url,setUrl] = useState("");
  const [copied,setCopied] = useState(false);
  const [delivery,setDelivery] = useState<InvitationDelivery|null>(null);
  if (linked) return <span className="text-sm font-semibold text-emerald-700">Compte activé</span>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setUrl("");setDelivery(null);
    try {
      if (kind==="tenant" && !email) {
        const changed = await fetch(`/api/tenants/${tenantId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({email:currentEmail})});
        if (!changed.ok) {setError("Impossible d’enregistrer cet email."); return;}
      }
      const response = await fetch("/api/invitations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind,organizationId,tenantId,email:currentEmail})});
      if (!response.ok) {setError("Impossible de créer cette invitation. Vérifiez l’email et les droits du compte."); return;}
      const data = await response.json() as {url:string;delivery:InvitationDelivery};
      setUrl(data.url);setDelivery(data.delivery);
      if (data.delivery==="sent") toast.success("Invitation créée : email accepté pour envoi.");
      else toast("Invitation créée. Copiez le lien pour le transmettre.");
      router.refresh();
    } catch {setError("La création du lien a échoué. Réessayez.");}
    finally {setPending(false);}
  }
  async function copy() {
    try {await navigator.clipboard.writeText(url); setCopied(true);toast.success("Lien copié.");}
    catch {setCopied(false);setError("Impossible de copier automatiquement le lien. Sélectionnez-le dans le champ.");}
  }
  async function revoke() {
    if (!pendingInvitationId) return;
    setPending(true); setError("");
    try {
      const response=await fetch(`/api/invitations/${pendingInvitationId}`,{method:"DELETE"});
      if (!response.ok) {setError("Impossible de révoquer le lien."); return;}
      toast.success("Invitation révoquée.");router.refresh();
    } catch {setError("Impossible de révoquer le lien.");}
    finally {setPending(false);}
  }
  return <div className="min-w-0">
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      {kind==="agency_manager" || !email ? <label className="min-w-[180px] flex-1 text-xs font-medium text-slate-600">Email du destinataire<input type="email" value={currentEmail} onChange={event=>setCurrentEmail(event.target.value)} required className="mt-1 w-full rounded-lg border p-2 text-sm"/></label> : <span className="min-w-0 text-sm text-slate-500">{email}</span>}
      <button disabled={pending} className="rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending?"Patientez…":pendingInvitationId?"Nouveau lien":"Créer un lien"}</button>
      {pendingInvitationId && <button type="button" onClick={revoke} disabled={pending} className="rounded-lg border px-3 py-2 text-sm font-semibold">Révoquer</button>}
    </form>
    {pendingInvitationId && !url && <p className="mt-2 text-xs text-amber-700">Invitation en attente. {emailDeliveryStatus==="sent"?"Email accepté pour envoi.":"Email non envoyé ; si vous avez perdu le lien, créez-en un nouveau."} Un nouveau lien annulera l’ancien, même si l’ancien email a déjà été reçu.</p>}
    {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    {url && <div className="mt-3 rounded-xl bg-brand-mist p-3"><p role="status" className="text-sm font-semibold text-brand-blue">{delivery==="sent"?"Email accepté pour envoi. Gardez aussi ce lien en secours.":"Email non envoyé. Copiez le lien pour le transmettre."}</p><p className="mt-2 text-xs font-semibold">Lien à transmettre au destinataire</p><input readOnly aria-label="Lien d’invitation" value={url} onFocus={event=>event.target.select()} className="mt-2 w-full rounded-lg border bg-white p-2 text-xs"/><button type="button" onClick={copy} className="mt-2 text-xs font-bold text-brand-blue">{copied?"Copié":"Copier le lien"}</button></div>}
  </div>;
}
