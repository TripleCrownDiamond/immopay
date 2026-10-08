import Link from "next/link";
import {ArrowRight,CircleCheck,Clock3,History,Receipt,ShieldAlert} from "lucide-react";
import {TenantShell} from "@/components/tenant-shell";
import {CopyId} from "@/components/tenant/copy-id";
import {currentDue,fcfa,receipts,rentals,requests,summary,tenant} from "@/lib/demo/tenant-space";

export default function TenantHome(){
  const s=summary(), pending=requests.filter(r=>r.status==="pending"), current=rentals.find(r=>!r.to)!;
  const pct=Math.round(currentDue.paid/currentDue.amount*100);
  return <TenantShell>
    <p className="text-sm text-slate-500">{current.unit} · {current.landlord}</p>
    <h1 className="text-3xl font-bold">Bonjour {tenant.name.split(" ")[0]}</h1>

    {pending.map(r=><Link key={r.id} href="/espace-locataire/acces" className="mt-6 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100/60">
      <ShieldAlert className="h-6 w-6 shrink-0 text-amber-600"/>
      <span className="flex-1 text-sm"><b>{r.landlord}</b> demande à voir votre historique de paiement.</span>
      <span className="hidden text-sm font-semibold text-amber-700 sm:block">Répondre</span><ArrowRight className="h-4 w-4 text-amber-700"/>
    </Link>)}

    <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <section className="rounded-3xl bg-brand-blue p-6 text-white shadow-xl shadow-blue-200">
        <p className="text-sm opacity-80">Loyer de {currentDue.period}</p>
        <p className="mt-1 text-4xl font-extrabold">{fcfa(currentDue.amount)}</p>
        <div className="mt-5 h-2 rounded-full bg-white/25"><div className="h-full rounded-full bg-brand-green" style={{width:`${pct}%`}}/></div>
        <div className="mt-2 flex justify-between text-sm opacity-90"><span>{fcfa(currentDue.paid)} payés</span><span>À régler avant le {currentDue.dueOn}</span></div>
        <button className="mt-6 w-full rounded-xl bg-white p-3.5 font-bold text-brand-blue hover:bg-brand-mist">Payer {fcfa(currentDue.amount-currentDue.paid)}</button>
        <Link href="/espace-locataire/declarer" className="mt-3 block text-center text-sm font-semibold text-white/90 underline-offset-4 hover:underline">Payé par virement ou en banque ? Envoyer la preuve</Link>
      </section>
      <section className="rounded-3xl border border-brand-line bg-white p-6">
        <h2 className="font-bold">Mon identifiant ImmoPay</h2>
        <p className="mt-1 text-sm text-slate-500">Donnez-le à votre prochain propriétaire pour qu’il vous retrouve.</p>
        <CopyId id={tenant.immopayId}/>
        <p className="mt-4 text-xs text-slate-400">Membre depuis {tenant.since}</p>
      </section>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-3">
      {[[Receipt,`${s.total}`,"quittances"],[CircleCheck,`${s.rate}%`,"payés à temps"],[History,`${s.rentals}`,"logements"]].map(([I,v,l])=>{const Icon=I as typeof Receipt;return <div key={l as string} className="rounded-2xl border border-brand-line bg-white p-4"><Icon className="h-5 w-5 text-brand-blue"/><b className="mt-2 block text-2xl">{v as string}</b><span className="text-sm text-slate-500">{l as string}</span></div>})}
    </div>

    <section className="mt-5 rounded-3xl border border-brand-line bg-white p-6">
      <div className="flex items-center justify-between"><h2 className="font-bold">Dernières quittances</h2><Link href="/espace-locataire/quittances" className="text-sm font-semibold text-brand-blue">Tout voir</Link></div>
      <ul className="mt-3 divide-y divide-slate-100">{receipts.slice(0,3).map(r=><li key={r.code} className="flex items-center justify-between py-3"><span><b className="block capitalize">{r.period}</b><span className="text-sm text-slate-500">{fcfa(r.amount)} · payé le {r.paidOn}</span></span><Link href={`/verify/${r.code}`} className="flex items-center gap-1.5 rounded-lg bg-brand-mist px-3 py-1.5 text-sm font-semibold text-brand-blue"><Receipt className="h-4 w-4"/>Voir</Link></li>)}</ul>
    </section>
    <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><Clock3 className="h-4 w-4"/>Prochain rappel envoyé 3 jours avant l’échéance.</p>
  </TenantShell>;
}
