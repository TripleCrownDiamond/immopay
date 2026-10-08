"use client";
import {useState} from "react";import {Clock3,Info} from "lucide-react";
import {TenantShell} from "@/components/tenant-shell";
import {CopyId} from "@/components/tenant/copy-id";
import {MethodPicker} from "@/components/payments/method-picker";
import {ProofInput} from "@/components/payments/proof-input";
import {payoutAccounts,type OfflineMethod} from "@/lib/demo/payments";
import {currentDue,fcfa,rentals} from "@/lib/demo/tenant-space";

const TRANSFER_REF="IMP-7K3F9Q-OCT";

export default function DeclarePayment(){
  const [method,setMethod]=useState<OfflineMethod>("bank_transfer");const [sent,setSent]=useState(false);
  const current=rentals.find(r=>!r.to)!, rest=currentDue.amount-currentDue.paid;
  if(sent)return <TenantShell><div className="mx-auto max-w-xl rounded-3xl border border-brand-line bg-white p-8 text-center">
    <Clock3 className="mx-auto h-12 w-12 text-amber-500"/><h1 className="mt-4 text-2xl font-bold">Paiement envoyé pour vérification</h1>
    <p className="mt-2 text-slate-500">{current.landlord} va vérifier votre preuve. Dès qu’il confirme, votre quittance est générée et apparaît dans « Quittances ». Vous recevrez une notification.</p>
  </div></TenantShell>;
  return <TenantShell>
    <h1 className="text-3xl font-bold">Déclarer un paiement</h1>
    <p className="mt-1 max-w-2xl text-slate-500">Vous avez payé par virement, dépôt en banque ou Mobile Money direct ? Envoyez la preuve : votre quittance est générée dès que le propriétaire confirme.</p>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <section className="space-y-4">
        <div className="rounded-3xl border border-brand-line bg-white p-6">
          <h2 className="font-bold">Où payer {current.landlord}</h2>
          <ul className="mt-4 space-y-3">{payoutAccounts.map(a=><li key={a.label} className="flex gap-3 rounded-2xl bg-slate-50 p-3.5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-mist text-brand-blue"><a.icon className="h-5 w-5" strokeWidth={1.75}/></span><span className="min-w-0 text-sm"><b className="block">{a.label}</b><span className="block text-slate-500">{a.holder}</span><span className="block break-all font-mono text-[13px]">{a.number}</span></span></li>)}</ul>
        </div>
        <div className="rounded-3xl border border-brand-line bg-white p-6">
          <h2 className="font-bold">Référence à indiquer</h2>
          <p className="mt-1 text-sm text-slate-500">Mettez-la dans le libellé du virement ou sur le bordereau. Votre propriétaire retrouve ainsi votre paiement plus vite.</p>
          <CopyId id={TRANSFER_REF}/>
        </div>
      </section>
      <form onSubmit={e=>{e.preventDefault();setSent(true);}} className="space-y-5 rounded-3xl border border-brand-line bg-white p-6">
        <MethodPicker value={method} onChange={setMethod} exclude={["cash"]}/>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Montant payé (F CFA)<input type="number" min={1} defaultValue={rest} className="mt-2 w-full rounded-xl border p-3"/></label>
          <label className="block text-sm font-medium">Date du paiement<input type="date" defaultValue="2026-10-08" className="mt-2 w-full rounded-xl border p-3"/></label>
        </div>
        <label className="block text-sm font-medium">{method==="cheque"?"Numéro du chèque":method==="mobile_money"?"ID de transaction":"Référence de l’opération"}<input placeholder={method==="bank_deposit"?"N° du bordereau":"Ex. : FT26281XYZ"} className="mt-2 w-full rounded-xl border p-3"/></label>
        <ProofInput/>
        <p className="flex gap-2 rounded-xl bg-brand-mist p-3 text-sm text-slate-600"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue"/>Reste à payer pour {currentDue.period} : <b className="ml-1">{fcfa(rest)}</b></p>
        <button className="w-full rounded-xl bg-brand-blue p-3.5 font-semibold text-white hover:bg-brand-deep">Envoyer la preuve</button>
      </form>
    </div>
  </TenantShell>;
}
