export const dynamic = "force-dynamic";
import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
import {listReceipts} from "@/lib/db/owner";
const money=(v:number)=>`${new Intl.NumberFormat("fr-FR").format(v)} F`;
export default async function Receipts(){const userId=await requireOwnerPage();const {membership,rows}=await listReceipts(userId);return <AppShell><p className="text-sm text-slate-500">{membership.organizationName}</p><h1 className="text-3xl font-bold">Quittances</h1>{rows.length?<div className="mt-7 grid gap-4 lg:grid-cols-2">{rows.map(r=><article key={r.publicCode} className="rounded-2xl bg-white p-6 shadow-sm"><span className="text-xs text-slate-400">{r.publicCode}</span><h2 className="mt-2 font-bold">{r.tenant}</h2><p className="text-sm text-slate-500">{r.period} · {money(r.amount)}</p><Link href={`/verify/${encodeURIComponent(r.publicCode)}`} className="mt-5 inline-block text-sm font-semibold text-indigo-600">Vérifier</Link></article>)}</div>:<p className="mt-7 rounded-2xl bg-white p-6 text-slate-500">Aucune quittance dans cet espace.</p>}</AppShell>}
