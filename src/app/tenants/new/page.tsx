"use client";
import {useState} from "react";
import {Clock3,Search,ShieldCheck,UserRoundCheck,UserRoundPlus} from "lucide-react";
import {AppShell} from "@/components/app-shell";
import {tenant} from "@/lib/demo/tenant-space";

type Step="search"|"found"|"notfound"|"requested";
const digits=(s:string)=>s.replace(/\D/g,"");

export default function NewTenant(){
  const [q,setQ]=useState("");const [step,setStep]=useState<Step>("search");
  const search=(e:React.FormEvent)=>{e.preventDefault();
    const hit=q.trim().toUpperCase()===tenant.immopayId||(digits(q).length>=8&&"22997123456".endsWith(digits(q).slice(-8)));
    setStep(hit?"found":"notfound");};
  return <AppShell><div className="mx-auto max-w-xl">
    <h1 className="text-3xl font-bold">Ajouter un locataire</h1>
    <p className="mt-1 text-slate-500">Vérifiez d’abord s’il a déjà un compte ImmoPay.</p>

    <form onSubmit={search} className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
      <label htmlFor="lookup" className="text-sm font-medium">Téléphone ou identifiant ImmoPay</label>
      <div className="mt-2 flex gap-2"><input id="lookup" value={q} onChange={e=>{setQ(e.target.value);setStep("search");}} placeholder="+229 97 12 34 56 ou IMP-7K3F9Q" className="min-w-0 flex-1 rounded-xl border p-3"/><button className="flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 font-semibold text-white"><Search className="h-4 w-4"/>Rechercher</button></div>
      <p className="mt-2 text-xs text-slate-400">Démo : essayez IMP-7K3F9Q.</p>
    </form>

    {step==="found"&&<section className="mt-4 rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-brand-mist text-brand-blue"><UserRoundCheck className="h-6 w-6"/></span><div><b>{tenant.name}</b><p className="text-sm text-slate-500">{tenant.phone} · sur ImmoPay depuis {tenant.since}</p></div></div>
      <p className="mt-4 rounded-xl bg-brand-mist p-3 text-sm text-slate-600">Ce locataire a déjà loué via ImmoPay. Ses coordonnées seront reprises, et il retrouvera vos quittances dans son espace.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button onClick={()=>setStep("requested")} className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue p-3 text-sm font-semibold text-white"><ShieldCheck className="h-4 w-4"/>Demander son historique</button>
        <button className="rounded-xl border p-3 text-sm font-semibold">Ajouter sans historique</button>
      </div>
    </section>}

    {step==="requested"&&<section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="flex items-center gap-2 font-semibold"><Clock3 className="h-5 w-5 text-amber-600"/>Demande envoyée à {tenant.name}</p>
      <p className="mt-2 text-sm text-slate-600">Il doit l’accepter depuis son espace locataire. Vous verrez alors son taux de paiement à temps, ses retards et ses impayés en cours, pendant 90 jours.</p>
      <button className="mt-4 w-full rounded-xl bg-brand-blue p-3 text-sm font-semibold text-white">Ajouter le locataire</button>
    </section>}

    {step==="notfound"&&<form className="mt-4 space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <p className="flex items-center gap-2 text-sm text-slate-600"><UserRoundPlus className="h-5 w-5 text-brand-blue"/>Aucun compte trouvé. Créez sa fiche : il pourra activer son espace avec son numéro.</p>
      {["Nom complet","Téléphone","Email"].map(x=><label key={x} className="block text-sm font-medium">{x}<input defaultValue={x==="Téléphone"?q:undefined} className="mt-2 w-full rounded-xl border p-3"/></label>)}
      <button className="w-full rounded-xl bg-brand-blue p-3 font-semibold text-white">Enregistrer le locataire</button>
    </form>}
  </div></AppShell>;
}
