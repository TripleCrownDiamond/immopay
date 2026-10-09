export const dynamic = "force-dynamic";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
import {getOwnerDashboard} from "@/lib/db/owner";
import {CalendarClock, CircleCheck, CircleDashed, ClockAlert} from "lucide-react";
import {StatCard} from "@/components/dashboard/stat-card";
import {QuickActions} from "@/components/dashboard/quick-actions";

const money = (value: number) => `${new Intl.NumberFormat("fr-FR").format(value)} F`;
export default async function Dashboard() {
  const userId = await requireOwnerPage();
  const {name, membership, stats, nextDue} = await getOwnerDashboard(userId);
  const rate = stats.expected ? Math.round(stats.paid / stats.expected * 100) : 0;
  const progress = Math.min(100,Math.max(0,rate));
  const cards = [
    {label:"Attendu",value:stats.expected,icon:CalendarClock,tone:"neutral"},
    {label:"Encaissé",value:stats.paid,icon:CircleCheck,tone:"success"},
    {label:"Restant",value:stats.remaining,icon:CircleDashed,tone:"warning"},
    {label:"En retard",value:stats.overdue,icon:ClockAlert,tone:"danger"},
  ] as const;
  return <AppShell><section><p className="text-sm text-slate-500">{membership.organizationName}</p><h1 className="mt-1 text-3xl font-bold">Bonjour {name.split(" ")[0]} 👋</h1><p className="mt-2 text-slate-500">Voici où en sont vos loyers aujourd’hui.</p><QuickActions/></section>
    <section aria-label="Résumé des loyers" className="mt-7 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">{cards.map(card=><StatCard key={card.label} label={card.label} value={money(card.value)} icon={card.icon} tone={card.tone}/>)}</section>
    <section className="mt-5 grid gap-5 lg:grid-cols-3"><article className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm lg:col-span-2"><div className="flex justify-between gap-3"><h2 className="font-semibold">Taux de recouvrement</h2><strong className="text-emerald-700">{rate}%</strong></div><div role="progressbar" aria-label="Taux de recouvrement" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${progress}%`}}/></div></article><article className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><CalendarClock aria-hidden="true" size={18} className="text-brand-blue"/>Prochaine échéance</h2>{nextDue?<><p className="mt-4 text-sm text-slate-500">{nextDue.dueOn} · {nextDue.unit}</p><strong className="mt-2 block">{money(nextDue.amount)}</strong></>:<p className="mt-4 text-sm text-slate-500">Aucune échéance ouverte.</p>}</article></section>
  </AppShell>;
}
