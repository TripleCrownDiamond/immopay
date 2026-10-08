"use client";
import Link from "next/link";import {usePathname} from "next/navigation";
import {Building2,CalendarDays,ChartColumn,CreditCard,House,LayoutGrid,Menu,MessageCircle,Plus,Receipt,Settings,Users} from "lucide-react";

const main=[["/dashboard","Accueil",LayoutGrid],["/properties","Biens",Building2],["/tenants","Locataires",Users],["/dues","Échéances",CalendarDays],["/payments","Paiements",CreditCard],["/receipts","Quittances",Receipt],["/messages","Messages",MessageCircle],["/reports","Rapports",ChartColumn]] as const;
const bottom=[["/dashboard","Accueil",House],["/properties","Biens",Building2],["/payments","Paiements",CreditCard],["/settings","Plus",Menu]] as const;

export function AppShell({children}:{children:React.ReactNode}){const path=usePathname();return <div className="min-h-screen bg-[#F6F7FA] md:flex">
  <aside className="hidden w-64 shrink-0 border-r bg-white p-6 md:block">
    <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto"/></Link>
    <nav className="mt-9 space-y-1">{main.map(([h,l,I])=><Link key={h} href={h} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm ${path.startsWith(h)?"bg-brand-mist font-semibold text-brand-blue":"text-slate-500 hover:bg-slate-50"}`}><I className="h-4 w-4" strokeWidth={1.75}/>{l}</Link>)}</nav>
    <Link href="/settings" className={`mt-7 flex items-center gap-3 border-t px-4 pt-5 text-sm ${path.startsWith("/settings")?"font-semibold text-brand-blue":"text-slate-500"}`}><Settings className="h-4 w-4" strokeWidth={1.75}/>Paramètres</Link>
  </aside>
  <div className="min-w-0 flex-1">
    <header className="flex h-16 items-center justify-between border-b bg-white px-5 md:px-8"><Link href="/dashboard" className="inline-flex md:hidden"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-7 w-auto"/></Link><span className="hidden text-sm text-slate-400 md:block">Gestion locative</span><div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold">GA</div></header>
    <main className="p-5 pb-28 md:p-8">{children}</main>
    <Link href="/quick-add" aria-label="Ajouter" className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-xl shadow-blue-200 hover:bg-brand-deep md:bottom-8 md:right-8"><Plus className="h-7 w-7" strokeWidth={2.25}/></Link>
    <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t bg-white px-2 pb-5 pt-2.5 text-[11px] md:hidden">{bottom.map(([h,l,I])=><Link key={h} href={h} className={`flex flex-col items-center gap-1 ${path.startsWith(h)?"font-bold text-brand-blue":"text-slate-400"}`}><I className="h-5 w-5" strokeWidth={1.75}/>{l}</Link>)}</nav>
  </div>
</div>}
