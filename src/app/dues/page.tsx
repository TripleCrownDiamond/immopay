export const dynamic = "force-dynamic";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
import {listDues} from "@/lib/db/owner";
const money=(v:number)=>`${new Intl.NumberFormat("fr-FR").format(v)} F`;
export default async function Dues(){const userId=await requireOwnerPage();const {membership,rows}=await listDues(userId);return <AppShell><p className="text-sm text-slate-500">{membership.organizationName}</p><h1 className="text-3xl font-bold">Échéances</h1>{rows.length?<div className="mt-7 space-y-3">{rows.map(d=><div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm"><div><b>{d.tenant} · {d.unit}</b><p className="text-sm text-slate-500">Échéance {d.dueOn}</p></div><div className="text-right"><b>{money(d.expected-d.paid)} restant</b><p className="text-sm text-slate-500">{d.status}</p></div></div>)}</div>:<p className="mt-7 rounded-2xl bg-white p-6 text-slate-500">Aucune échéance dans cet espace.</p>}</AppShell>}
