"use client";
import Link from "next/link";import {useState} from "react";
import {Check,FileImage,Plus,X} from "lucide-react";
import {AppShell} from "@/components/app-shell";
import {declared as initial,methods,methodLabel,type Declared} from "@/lib/demo/payments";
import {fcfa} from "@/lib/demo/tenant-space";

const rows=[["Aïcha S.","Appartement A3","110 000 F","Payé"],["Jean K.","Boutique B2","70 000 / 110 000 F","Partiel"],["Mariam A.","Appartement C1","0 / 95 000 F","En retard"]];

function Review({p,onDone}:{p:Declared;onDone:(id:string,ok:boolean)=>void}){
  const [rejecting,setRejecting]=useState(false);const [reason,setReason]=useState("");
  const M=methods.find(m=>m.id===p.method)!.icon;
  return <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-mist text-brand-blue"><M className="h-5 w-5" strokeWidth={1.75}/></span><div><strong>{p.tenant}</strong><p className="text-sm text-slate-500">{p.unit}</p></div></div>
      <div className="text-right"><b className="text-lg">{fcfa(p.amount)}</b><p className="text-xs text-slate-500">{methodLabel(p.method)} · {p.date}</p></div>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
      <span className="grid h-14 w-11 place-items-center rounded-md border border-brand-line bg-white text-slate-400"><FileImage className="h-5 w-5"/></span>
      <span className="flex-1"><span className="block font-semibold">Preuve jointe</span><span className="text-slate-500">Réf. {p.reference}{p.note?` · ${p.note}`:""}</span></span>
      <button className="rounded-lg border border-brand-line bg-white px-3 py-1.5 font-semibold text-brand-blue">Voir</button>
    </div>
    {rejecting?<div className="mt-4"><label htmlFor={`r-${p.id}`} className="text-sm font-medium">Motif du refus (envoyé au locataire)</label><textarea id={`r-${p.id}`} value={reason} onChange={e=>setReason(e.target.value)} rows={2} placeholder="Ex. : montant introuvable sur le relevé du 07/10" className="mt-2 w-full rounded-xl border p-3 text-sm"/>
      <div className="mt-2 flex gap-2"><button disabled={!reason.trim()} onClick={()=>onDone(p.id,false)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Refuser le paiement</button><button onClick={()=>setRejecting(false)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Annuler</button></div></div>
    :<div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>onDone(p.id,true)} className="flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep"><Check className="h-4 w-4"/>Confirmer et générer la quittance</button><button onClick={()=>setRejecting(true)} className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold"><X className="h-4 w-4"/>Refuser</button></div>}
  </article>;
}

export default function Payments(){
  const [pending,setPending]=useState(initial);const [done,setDone]=useState<string|null>(null);
  const finish=(id:string,ok:boolean)=>{const p=pending.find(x=>x.id===id)!;setPending(ps=>ps.filter(x=>x.id!==id));setDone(ok?`Paiement de ${p.tenant} confirmé. La quittance a été générée et envoyée.`:`Paiement de ${p.tenant} refusé. Le locataire a été prévenu.`);};
  return <AppShell>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-500">Encaissements</p><h1 className="text-3xl font-bold">Paiements</h1></div><Link href="/payments/new" className="flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4"/>Enregistrer un paiement</Link></div>
    {done&&<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{done}</p>}
    {pending.length>0&&<section className="mt-7"><h2 className="font-bold">À confirmer <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{pending.length}</span></h2><p className="mt-1 text-sm text-slate-500">Paiements déclarés par vos locataires (virement, dépôt en banque…). Vérifiez la preuve, puis confirmez.</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">{pending.map(p=><Review key={p.id} p={p} onDone={finish}/>)}</div></section>}
    <h2 className="mt-9 font-bold">Ce mois-ci</h2>
    <div className="mt-4 space-y-3">{rows.map(([n,u,a,s])=><article key={n} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex justify-between gap-4"><div><strong>{n}</strong><p className="text-sm text-slate-500">{u}</p></div><span className="text-sm font-medium">{s}</span></div><div className="mt-4 flex items-end justify-between"><strong>{a}</strong>{s==="Partiel"&&<span className="text-xs text-slate-500">64%</span>}</div>{s==="Partiel"&&<div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full w-[64%] rounded-full bg-amber-400"/></div>}</article>)}</div>
  </AppShell>;
}
