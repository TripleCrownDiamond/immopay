export const dynamic = "force-dynamic";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
import {listPayments} from "@/lib/db/owner";
const money=(v:number)=>`${new Intl.NumberFormat("fr-FR").format(v)} F`;
export default async function Payments(){const userId=await requireOwnerPage();const {membership,rows}=await listPayments(userId);return <AppShell><p className="text-sm text-slate-500">{membership.organizationName}</p><h1 className="text-3xl font-bold">Paiements</h1><p className="mt-2 text-sm text-slate-500">La saisie et la confirmation des paiements seront disponibles prochainement.</p>{rows.length?<div className="mt-7 space-y-3">{rows.map(p=><article key={p.id} className="flex flex-wrap justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm"><div><strong>{p.tenant}</strong><p className="text-sm text-slate-500">{p.unit} · {p.method}</p></div><div className="text-right"><b>{money(p.amount)}</b><p className="text-sm text-slate-500">{p.status} · {p.paidOn??"Date à confirmer"}</p></div></article>)}</div>:<p className="mt-7 rounded-2xl bg-white p-6 text-slate-500">Aucun paiement dans cet espace.</p>}</AppShell>}
