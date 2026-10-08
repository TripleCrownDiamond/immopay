"use client";
import {useState} from "react";
import {BadgeCheck,Bell,BellRing,Building2,Calculator,ChartColumn,FileCheck2,FolderArchive,History,Landmark,PhoneOff,Receipt,ShieldCheck,Smartphone,UserRoundSearch,Users,Wallet,type LucideIcon} from "lucide-react";

type Benefit=[LucideIcon,string,string];
const audiences:{id:string;label:string;title:string;items:Benefit[]}[]=[
  {id:"proprietaires",label:"Propriétaires",title:"Vous ne courez plus après les loyers",items:[
    [Bell,"Plus de relances à faire","Vos locataires reçoivent des rappels automatiques par email, WhatsApp ou SMS, avant et après l’échéance."],
    [Wallet,"Encaissez sans vous déplacer","Mobile Money, carte bancaire, ou virement et dépôt en banque déclarés avec une preuve."],
    [FileCheck2,"Quittances sans signature manuelle","Chaque paiement confirmé génère une quittance vérifiable, envoyée au locataire."],
    [ChartColumn,"Une vision claire, tout de suite","Qui a payé, qui doit encore, combien vous avez encaissé ce mois-ci."],
    [UserRoundSearch,"Des locataires plus fiables","Consultez l’historique de paiement d’un futur locataire, avec son accord."],
    [FolderArchive,"Fini les cahiers et les reçus perdus","Tout l’historique au même endroit, exportable pour votre comptable."],
  ]},
  {id:"agences",label:"Agences",title:"Tous les biens de vos clients, un seul outil",items:[
    [Building2,"Tous vos mandants au même endroit","Chaque propriétaire client a ses biens, ses locataires et ses comptes séparés."],
    [Users,"Votre équipe, avec des rôles","Gestionnaires, comptables et agents accèdent à ce qui les concerne."],
    [ChartColumn,"Un rapport par propriétaire","Encaissements, impayés et historique, prêts à envoyer à chaque client."],
    [Calculator,"Reversements calculés","Loyers encaissés moins vos honoraires : le montant à reverser est prêt."],
    [BadgeCheck,"Quittances à votre logo","Vos locataires reçoivent des documents à l’image de votre agence."],
    [PhoneOff,"Moins d’appels à gérer","Locataires et propriétaires suivent leurs paiements en ligne, sans vous appeler."],
  ]},
  {id:"locataires",label:"Locataires",title:"Payer son loyer devient simple",items:[
    [Receipt,"Votre quittance tout de suite","Plus besoin d’attendre que le propriétaire la signe : elle arrive dès le paiement."],
    [Smartphone,"Payez depuis votre téléphone","Mobile Money ou carte, à toute heure, sans vous déplacer."],
    [Landmark,"Payé à la banque ? Envoyez la preuve","Photo du bordereau ou de l’avis de virement : la quittance suit dès validation."],
    [BellRing,"Un rappel avant chaque échéance","Vous ne payez plus de pénalités pour un simple oubli."],
    [History,"Toutes vos quittances, pour toujours","Même celles de vos anciens logements, disponibles à tout moment."],
    [ShieldCheck,"Un historique qui vous recommande","Prouvez votre sérieux à votre prochain propriétaire, si vous le souhaitez."],
  ]},
];

export function Benefits(){
  const [active,setActive]=useState(audiences[0].id);const a=audiences.find(x=>x.id===active)!;
  return <section id="avantages" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div><h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Ce que vous y gagnez</h2><p className="mt-3 max-w-xl text-lg text-slate-600">ImmoPay simplifie la location pour chacun : propriétaires, agences immobilières et locataires.</p></div>
      <div role="tablist" aria-label="Choisir votre profil" className="flex rounded-2xl bg-brand-mist p-1.5">
        {audiences.map(x=><button key={x.id} role="tab" id={`tab-${x.id}`} aria-selected={active===x.id} aria-controls={`panel-${x.id}`} onClick={()=>setActive(x.id)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${active===x.id?"bg-white text-brand-blue shadow-sm":"text-slate-600 hover:text-brand-ink"}`}>{x.label}</button>)}
      </div>
    </div>
    <div role="tabpanel" id={`panel-${a.id}`} aria-labelledby={`tab-${a.id}`} className="mt-10">
      <h3 className="text-xl font-bold">{a.title}</h3>
      <ul className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{a.items.map(([I,t,d])=><li key={t} className="flex gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-mist text-brand-blue"><I className="h-5 w-5" strokeWidth={1.75} aria-hidden/></span>
        <span><b className="block">{t}</b><span className="mt-1 block text-sm leading-6 text-slate-500">{d}</span></span>
      </li>)}</ul>
    </div>
  </section>;
}
