import type {LucideIcon} from "lucide-react";

type Tone = "neutral" | "success" | "warning" | "danger";
const toneClass: Record<Tone,string> = {
  neutral: "bg-blue-50 text-brand-blue",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
};

export function StatCard({label,value,icon:Icon,tone}:{label:string;value:string;icon:LucideIcon;tone:Tone}) {
  return <article className="min-w-0 rounded-2xl border border-brand-line bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneClass[tone]}`}><Icon aria-hidden="true" size={19}/></span>
    </div>
    <strong className="mt-4 block break-words text-xl tracking-tight text-slate-900 sm:text-2xl">{value}</strong>
  </article>;
}
