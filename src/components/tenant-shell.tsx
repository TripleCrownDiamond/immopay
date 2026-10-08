"use client";
import Link from "next/link";import {usePathname} from "next/navigation";
import {House,Receipt,History,ShieldCheck} from "lucide-react";
import {LogoutButton} from "@/components/auth/logout-button";

const nav=[["/espace-locataire","Accueil",House],["/espace-locataire/quittances","Quittances",Receipt],["/espace-locataire/historique","Historique",History],["/espace-locataire/acces","Partage",ShieldCheck]] as const;

export function TenantShell({children}:{children:React.ReactNode}){
  const path=usePathname();
  const active=(h:string)=>h==="/espace-locataire"?path===h:path.startsWith(h);
  return <div className="min-h-screen bg-[#F6F8FD] text-brand-ink md:flex">
    <aside className="hidden w-64 shrink-0 border-r border-brand-line bg-white p-6 md:flex md:flex-col">
      <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto"/></Link>
      <p className="mt-2 text-xs font-semibold text-slate-400">Espace locataire</p>
      <nav className="mt-8 space-y-1">{nav.map(([h,l,I])=><Link key={h} href={h} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm ${active(h)?"bg-brand-mist font-semibold text-brand-blue":"text-slate-500 hover:bg-slate-50"}`}><I className="h-4 w-4"/>{l}</Link>)}</nav>
      <div className="mt-auto rounded-2xl bg-brand-mist p-4 text-sm"><b>Mon espace locataire</b></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="flex h-16 items-center justify-between border-b border-brand-line bg-white px-5 md:px-8">
        <Link href="/espace-locataire" className="inline-flex md:hidden"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-7 w-auto"/></Link>
        <span className="hidden text-sm text-slate-400 md:block">Mon espace locataire</span>
        <div className="flex items-center gap-2"><LogoutButton/></div>
      </header>
      <main className="mx-auto max-w-5xl p-5 pb-28 md:p-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-brand-line bg-white px-2 pb-5 pt-2.5 text-[11px] md:hidden">{nav.map(([h,l,I])=><Link key={h} href={h} className={`flex flex-col items-center gap-1 ${active(h)?"font-bold text-brand-blue":"text-slate-400"}`}><I className="h-5 w-5"/>{l}</Link>)}</nav>
    </div>
  </div>;
}
