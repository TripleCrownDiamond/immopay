"use client";
import {useMemo,useState} from "react";import {CircleCheck,Receipt} from "lucide-react";
import {AppShell} from "@/components/app-shell";
import {MethodPicker} from "@/components/payments/method-picker";
import {ProofInput} from "@/components/payments/proof-input";
import {allocatePayment} from "@/lib/payments/allocation";
import {openDues,tenantsForPayment,type OfflineMethod} from "@/lib/demo/payments";
import {fcfa} from "@/lib/demo/tenant-space";

export default function NewPayment(){
  const [method,setMethod]=useState<OfflineMethod>("bank_transfer");const [amount,setAmount]=useState(130000);const [saved,setSaved]=useState(false);
  const outstanding=openDues.reduce((s,d)=>s+d.amountExpected-d.amountPaid,0);
  const plan=useMemo(()=>{try{return amount>0?allocatePayment(Math.min(amount,outstanding),openDues):[];}catch{return [];}},[amount,outstanding]);
  const needsRef=method!=="cash";
  if(saved)return <AppShell><div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm"><CircleCheck className="mx-auto h-12 w-12 text-brand-green"/><h1 className="mt-4 text-2xl font-bold">Paiement enregistré</h1><p className="mt-2 text-slate-500">{plan.filter(a=>{const d=openDues.find(x=>x.id===a.rentDueId)!;return d.amountPaid+a.amount>=d.amountExpected;}).length} quittance(s) générée(s) et envoyée(s) au locataire.</p><button onClick={()=>setSaved(false)} className="mt-6 rounded-xl border px-4 py-2.5 text-sm font-semibold">Enregistrer un autre paiement</button></div></AppShell>;
  return <AppShell><div className="mx-auto max-w-2xl">
    <h1 className="text-3xl font-bold">Enregistrer un paiement</h1>
    <p className="mt-2 text-slate-500">Pour un loyer reçu hors ImmoPay : virement, dépôt en banque, espèces, chèque ou Mobile Money direct.</p>
    <form onSubmit={e=>{e.preventDefault();setSaved(true);}} className="mt-7 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <label className="block text-sm font-medium">Locataire<select className="mt-2 w-full rounded-xl border p-3">{tenantsForPayment.map(t=><option key={t}>{t}</option>)}</select></label>
      <MethodPicker value={method} onChange={setMethod}/>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Montant reçu (F CFA)<input type="number" min={1} value={amount} onChange={e=>setAmount(Number(e.target.value))} className="mt-2 w-full rounded-xl border p-3"/></label>
        <label className="block text-sm font-medium">Date du paiement<input type="date" defaultValue="2026-10-07" className="mt-2 w-full rounded-xl border p-3"/></label>
      </div>
      {needsRef&&<label className="block text-sm font-medium">{method==="cheque"?"Numéro du chèque":method==="mobile_money"?"ID de transaction":"Référence bancaire"}<input placeholder={method==="bank_deposit"?"N° du bordereau":"Ex. : VIR-IMP-JK2B"} className="mt-2 w-full rounded-xl border p-3"/></label>}
      <ProofInput label={method==="cash"?"Justificatif (facultatif)":"Preuve de paiement"}/>
      <section className="rounded-xl bg-brand-mist p-4" aria-live="polite">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Receipt className="h-4 w-4 text-brand-blue"/>Affectation automatique</h2>
        <p className="mt-1 text-xs text-slate-500">Le paiement règle d’abord les échéances les plus anciennes.</p>
        <ul className="mt-3 space-y-1.5 text-sm">{openDues.map(d=>{const a=plan.find(x=>x.rentDueId===d.id)?.amount??0;const full=d.amountPaid+a>=d.amountExpected;return <li key={d.id} className="flex justify-between gap-3"><span>{d.label}</span><span className={a?full?"font-semibold text-emerald-700":"font-semibold text-amber-700":"text-slate-400"}>{a?`${fcfa(a)} · ${full?"soldé, quittance générée":"partiel"}`:"non couvert"}</span></li>})}</ul>
        {amount>outstanding&&<p className="mt-2 text-xs font-medium text-brand-blue">{fcfa(amount-outstanding)} seront gardés en avance pour les prochaines échéances.</p>}
      </section>
      <button className="w-full rounded-xl bg-brand-blue p-3.5 font-semibold text-white hover:bg-brand-deep">Enregistrer le paiement</button>
    </form>
  </div></AppShell>;
}
