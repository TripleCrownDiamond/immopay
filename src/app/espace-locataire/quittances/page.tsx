"use client";
import Link from "next/link";import {useState} from "react";
import {CircleCheck,Clock3,Download,QrCode} from "lucide-react";
import {TenantShell} from "@/components/tenant-shell";
import {fcfa,receipts,rentals} from "@/lib/demo/tenant-space";

export default function TenantReceipts(){
  const [filter,setFilter]=useState("all");
  const list=filter==="all"?receipts:receipts.filter(r=>r.rentalId===filter);
  return <TenantShell>
    <h1 className="text-3xl font-bold">Mes quittances</h1>
    <p className="mt-1 text-slate-500">Toutes vos quittances, chez tous vos propriétaires, disponibles à tout moment.</p>
    <div className="mt-6 flex flex-wrap gap-2" role="tablist">
      {[["all","Tous les logements"],...rentals.map(r=>[r.id,`${r.unit}${r.to?" (ancien)":""}`])].map(([id,l])=><button key={id} role="tab" aria-selected={filter===id} onClick={()=>setFilter(id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter===id?"bg-brand-blue text-white":"border border-brand-line bg-white text-slate-600"}`}>{l}</button>)}
    </div>
    <ul className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-3xl border border-brand-line bg-white">
      {list.map(r=>{const rental=rentals.find(x=>x.id===r.rentalId)!;return <li key={r.code} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-mist text-brand-blue"><QrCode className="h-5 w-5"/></span>
        <span className="min-w-0 flex-1"><b className="block capitalize">{r.period}</b><span className="text-sm text-slate-500">{rental.unit} · {rental.landlord}</span></span>
        <span className="text-right"><b className="block">{fcfa(r.amount)}</b><span className={`inline-flex items-center gap-1 text-xs font-semibold ${r.onTime?"text-emerald-600":"text-amber-600"}`}>{r.onTime?<CircleCheck className="h-3.5 w-3.5"/>:<Clock3 className="h-3.5 w-3.5"/>}Payé le {r.paidOn}</span></span>
        <Link href={`/verify/${r.code}`} className="flex items-center gap-1.5 rounded-lg border border-brand-line px-3 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-mist"><Download className="h-4 w-4"/>Quittance</Link>
      </li>})}
    </ul>
  </TenantShell>;
}
