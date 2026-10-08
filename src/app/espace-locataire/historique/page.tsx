import {Building2,CircleCheck,Clock3,MapPin} from "lucide-react";
import {TenantShell} from "@/components/tenant-shell";
import {fcfa,receipts,rentals,summary} from "@/lib/demo/tenant-space";

const fmt=(d:string)=>new Date(d).toLocaleDateString("fr-FR",{month:"long",year:"numeric"});

export default function TenantHistory(){
  const all=summary();
  return <TenantShell>
    <h1 className="text-3xl font-bold">Mon historique</h1>
    <p className="mt-1 text-slate-500">Vos locations successives et votre régularité de paiement.</p>

    <section className="mt-6 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl bg-brand-blue p-5 text-white"><span className="text-sm opacity-80">Payés à temps</span><b className="mt-1 block text-4xl font-extrabold">{all.rate}%</b><span className="text-sm opacity-80">{all.onTime} sur {all.total} échéances</span></div>
      <div className="rounded-2xl border border-brand-line bg-white p-5"><span className="text-sm text-slate-500">Paiements en retard</span><b className="mt-1 block text-4xl font-extrabold">{all.late}</b><span className="text-sm text-slate-500">depuis le début</span></div>
      <div className="rounded-2xl border border-brand-line bg-white p-5"><span className="text-sm text-slate-500">Impayé en cours</span><b className="mt-1 block text-4xl font-extrabold text-emerald-600">0</b><span className="text-sm text-slate-500">tout est réglé</span></div>
    </section>

    <ol className="relative mt-8 space-y-5 border-l-2 border-brand-line pl-6">
      {rentals.map(r=>{const rs=receipts.filter(x=>x.rentalId===r.id), s=summary(rs);return <li key={r.id} className="relative">
        <span className={`absolute -left-[33px] top-6 h-4 w-4 rounded-full ring-4 ring-[#F6F8FD] ${r.to?"bg-slate-300":"bg-brand-green"}`}/>
        <article className="rounded-3xl border border-brand-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-mist text-brand-blue"><Building2 className="h-5 w-5"/></span><div><h2 className="font-bold">{r.unit}</h2><p className="text-sm text-slate-500">{r.landlord}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5"/>{r.city}</p></div></div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.to?"bg-slate-100 text-slate-600":"bg-emerald-50 text-emerald-700"}`}>{r.to?"Terminée":"En cours"}</span>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-slate-400">Période</dt><dd className="font-semibold">{fmt(r.from)} – {r.to?fmt(r.to):"aujourd’hui"}</dd></div>
            <div><dt className="text-slate-400">Loyer</dt><dd className="font-semibold">{fcfa(r.rent)}</dd></div>
            <div><dt className="text-slate-400">Quittances</dt><dd className="font-semibold">{s.total}</dd></div>
            <div><dt className="text-slate-400">À temps</dt><dd className="flex items-center gap-1 font-semibold">{s.late?<Clock3 className="h-4 w-4 text-amber-500"/>:<CircleCheck className="h-4 w-4 text-emerald-500"/>}{s.rate}%</dd></div>
          </dl>
        </article>
      </li>})}
    </ol>
  </TenantShell>;
}
