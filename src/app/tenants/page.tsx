import Link from "next/link";
import {ShieldCheck} from "lucide-react";
import {AppShell} from "@/components/app-shell";
import {summary,tenant} from "@/lib/demo/tenant-space";

const tenants=[["Aïcha S.","Appartement A3","À jour",false],["Jean K.","Boutique B2","Partiel",false],["Mariam A.","Appartement C1","En retard",false],[tenant.name,"Appartement 2B","Nouveau",true]] as const;

export default function Tenants(){const s=summary();return <AppShell>
  <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-500">Relations locatives</p><h1 className="text-3xl font-bold">Locataires</h1></div><Link href="/tenants/new" className="rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white">Ajouter un locataire</Link></div>
  <div className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm">{tenants.map(([n,u,st,shared])=><div key={n} className="flex flex-wrap items-center justify-between gap-3 border-b p-5 last:border-0">
    <div><strong>{n}</strong><p className="text-sm text-slate-500">{u}</p></div>
    {shared?<details className="group w-full sm:w-auto"><summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700"><ShieldCheck className="h-4 w-4"/>Historique partagé</summary>
      <dl className="mt-3 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:w-80"><div><dt className="text-slate-500">À temps</dt><dd className="text-xl font-bold text-emerald-600">{s.rate}%</dd></div><div><dt className="text-slate-500">Retards</dt><dd className="text-xl font-bold">{s.late}</dd></div><div><dt className="text-slate-500">Impayés</dt><dd className="text-xl font-bold">0</dd></div><p className="col-span-3 text-xs text-slate-400">{s.total} échéances sur {s.rentals} logements. Partagé par le locataire jusqu’au 06/01/2027.</p></dl></details>
    :<span className="text-sm">{st}</span>}
  </div>)}</div>
</AppShell>}
