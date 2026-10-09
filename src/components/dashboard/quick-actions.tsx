import Link from "next/link";
import {ArrowUpRight, Building2, CreditCard, UserPlus} from "lucide-react";

const actions = [
  {href:"/tenants/new",label:"Ajouter un locataire",icon:UserPlus,primary:true},
  {href:"/properties",label:"Voir mes biens",icon:Building2,primary:false},
  {href:"/payments",label:"Voir les paiements",icon:CreditCard,primary:false},
] as const;

export function QuickActions() {
  return <nav aria-label="Actions rapides" className="mt-6 flex flex-wrap gap-2">
    {actions.map(({href,label,icon:Icon,primary})=><Link key={href} href={href} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${primary?"bg-brand-blue text-white hover:bg-blue-900":"border border-brand-line bg-white text-brand-blue hover:bg-brand-mist"}`}>
      <Icon aria-hidden="true" size={17}/>{label}<ArrowUpRight aria-hidden="true" size={15} className="opacity-60"/>
    </Link>)}
  </nav>;
}
