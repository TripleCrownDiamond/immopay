export const dynamic = "force-dynamic";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
import {getOwnerDashboard} from "@/lib/db/owner";

const money = (value: number) => `${new Intl.NumberFormat("fr-FR").format(value)} F`;
export default async function Dashboard() {
  const userId = await requireOwnerPage();
  const {name, membership, stats, nextDue} = await getOwnerDashboard(userId);
  const rate = stats.expected ? Math.round(stats.paid / stats.expected * 100) : 0;
  const cards = [["Attendu",stats.expected],["Encaissé",stats.paid],["Restant",stats.remaining],["En retard",stats.overdue]] as const;
  return <AppShell><section><p className="text-sm text-slate-500">{membership.organizationName}</p><h1 className="mt-1 text-3xl font-bold">Bonjour {name.split(" ")[0]} 👋</h1><p className="mt-2 text-slate-500">Voici où en sont vos loyers aujourd’hui.</p></section>
    <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(([label,value])=><article key={label} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><strong className="mt-2 block text-xl">{money(value)}</strong></article>)}</section>
    <section className="mt-5 grid gap-5 lg:grid-cols-3"><article className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2"><div className="flex justify-between"><h2 className="font-semibold">Taux de recouvrement</h2><strong className="text-emerald-600">{rate}%</strong></div><div className="mt-4 h-3 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${Math.min(rate,100)}%`}}/></div></article><article className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-semibold">Prochaine échéance</h2>{nextDue?<><p className="mt-4 text-sm text-slate-500">{nextDue.dueOn} · {nextDue.unit}</p><strong className="mt-2 block">{money(nextDue.amount)}</strong></>:<p className="mt-4 text-sm text-slate-500">Aucune échéance ouverte.</p>}</article></section>
  </AppShell>;
}
