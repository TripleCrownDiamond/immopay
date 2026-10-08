export const dynamic = "force-dynamic";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
import {getOwnerDashboard,listProperties} from "@/lib/db/owner";
const money=(v:number)=>`${new Intl.NumberFormat("fr-FR").format(v)} F`;
export default async function Reports(){const userId=await requireOwnerPage();const [{membership,stats},{rows}]=await Promise.all([getOwnerDashboard(userId),listProperties(userId)]);const units=rows.reduce((n,p)=>n+p.units,0),occupied=rows.reduce((n,p)=>n+p.occupied,0);return <AppShell><p className="text-sm text-slate-500">{membership.organizationName}</p><h1 className="text-3xl font-bold">Rapports</h1><div className="mt-7 grid gap-4 md:grid-cols-3">{[["Revenus encaissés",money(stats.paid)],["Taux de recouvrement",`${stats.expected?Math.round(stats.paid/stats.expected*100):0}%`],["Occupation",`${occupied}/${units} unités`]].map(([label,value])=><div key={label} className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{label}</p><b className="mt-2 block text-2xl">{value}</b></div>)}</div></AppShell>}
