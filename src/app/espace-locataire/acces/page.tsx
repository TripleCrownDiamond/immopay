"use client";
import {useState} from "react";
import {Ban,Check,CircleCheck,EyeOff,ShieldCheck,X} from "lucide-react";
import {TenantShell} from "@/components/tenant-shell";
import {CopyId} from "@/components/tenant/copy-id";
import {requests as initial,tenant,type AccessRequest} from "@/lib/demo/tenant-space";

export default function TenantAccess(){
  const [requests,setRequests]=useState<AccessRequest[]>(initial);
  const decide=(id:string,status:AccessRequest["status"])=>setRequests(rs=>rs.map(r=>r.id===id?{...r,status,expiresOn:status==="approved"?"06/01/2027":undefined}:r));
  const pending=requests.filter(r=>r.status==="pending"), others=requests.filter(r=>r.status!=="pending");
  return <TenantShell>
    <h1 className="text-3xl font-bold">Partage de mon historique</h1>
    <p className="mt-1 max-w-2xl text-slate-500">Un propriétaire ne voit votre historique de paiement que si vous l’acceptez. Vous pouvez retirer l’accès à tout moment.</p>

    <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-3xl border border-brand-line bg-white p-6">
        <h2 className="font-bold">Demandes en attente</h2>
        {pending.length===0&&<p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Aucune demande en attente. Donnez votre identifiant à un propriétaire pour qu’il vous retrouve.</p>}
        <ul className="mt-4 space-y-3">{pending.map(r=><li key={r.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <b>{r.landlord}</b><p className="text-sm text-slate-600">Pour le logement {r.unit} · demandé le {r.requestedOn}</p>
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>decide(r.id,"approved")} className="flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep"><Check className="h-4 w-4"/>Autoriser 90 jours</button><button onClick={()=>decide(r.id,"declined")} className="flex items-center gap-1.5 rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm font-semibold"><X className="h-4 w-4"/>Refuser</button></div>
        </li>)}</ul>

        <h2 className="mt-8 font-bold">Accès déjà traités</h2>
        <ul className="mt-3 divide-y divide-slate-100">{others.map(r=><li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <span><b className="block">{r.landlord}</b><span className="text-sm text-slate-500">{r.status==="approved"?`Autorisé jusqu’au ${r.expiresOn}`:"Refusé ou retiré"}</span></span>
          {r.status==="approved"?<button onClick={()=>decide(r.id,"declined")} className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Ban className="h-4 w-4"/>Retirer l’accès</button>:<span className="text-sm text-slate-400">Aucun accès</span>}
        </li>)}</ul>
      </section>

      <div className="space-y-5">
        <section className="rounded-3xl border border-brand-line bg-white p-6"><h2 className="font-bold">Mon identifiant ImmoPay</h2><CopyId id={tenant.immopayId}/></section>
        <section className="rounded-3xl bg-brand-ink p-6 text-white">
          <h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-brand-green"/>Ce que voit le propriétaire</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-200">{["Nombre de logements loués via ImmoPay","Taux de paiement à temps","Nombre de retards et impayés en cours"].map(x=><li key={x} className="flex gap-2"><CircleCheck className="h-4 w-4 shrink-0 text-brand-green"/>{x}</li>)}</ul>
          <h3 className="mt-5 flex items-center gap-2 text-sm font-bold"><EyeOff className="h-4 w-4 text-slate-400"/>Ce qu’il ne voit jamais</h3>
          <p className="mt-2 text-sm text-slate-400">Vos anciens propriétaires, adresses, montants de loyer et quittances détaillées.</p>
        </section>
      </div>
    </div>
  </TenantShell>;
}
