import {BadgeCheck,Bell,BellRing,Building2,Calculator,ChartColumn,FileCheck2,FolderArchive,History,Landmark,PhoneOff,Receipt,ShieldCheck,Smartphone,UserRoundSearch,Users,Wallet,type LucideIcon} from "lucide-react";

type Benefit=[LucideIcon,string,string];
type Audience="owners"|"agencies"|"tenants";

const benefits:Record<Audience,Benefit[]>={
  owners:[
    [Building2,"Une mise en place rapide","Ajoutez vos biens et vos locataires, puis planifiez les échéances selon vos contrats."],
    [Bell,"Plus de relances à faire","Vos locataires reçoivent des rappels automatiques avant et après l’échéance."],
    [Wallet,"Encaissez sans vous déplacer","Mobile Money, carte bancaire, ou virement et dépôt en banque déclarés avec une preuve."],
    [FileCheck2,"Quittances automatiques","Chaque paiement confirmé génère une quittance vérifiable, envoyée au locataire."],
    [ChartColumn,"Une vision claire, tout de suite","Suivez les paiements, les impayés et vos revenus depuis un seul tableau de bord."],
    [UserRoundSearch,"Des locataires plus fiables","Consultez l’historique de paiement d’un futur locataire, avec son accord."],
    [FolderArchive,"Tous vos documents au même endroit","Retrouvez l’historique et exportez des rapports clairs pour votre comptable."],
  ],
  agencies:[
    [Building2,"Tous vos mandants au même endroit","Chaque propriétaire client a ses biens, ses locataires et ses comptes séparés."],
    [Users,"Votre équipe, avec des rôles","Gestionnaires, comptables et agents accèdent à ce qui les concerne."],
    [ChartColumn,"Un rapport par propriétaire","Encaissements, impayés et historique, prêts à envoyer à chaque client."],
    [Calculator,"Reversements calculés","Loyers encaissés moins vos honoraires : le montant à reverser est prêt."],
    [BadgeCheck,"Quittances à votre logo","Vos locataires reçoivent des documents à l’image de votre agence."],
    [PhoneOff,"Moins d’appels à gérer","Locataires et propriétaires suivent leurs paiements en ligne, sans vous appeler."],
  ],
  tenants:[
    [Receipt,"Votre quittance tout de suite","Elle devient disponible dès que votre paiement est confirmé."],
    [Smartphone,"Payez depuis votre téléphone","Mobile Money ou carte, à toute heure, sans vous déplacer."],
    [Landmark,"Payé à la banque ? Envoyez la preuve","Photo du bordereau ou de l’avis de virement : la quittance suit dès validation."],
    [BellRing,"Un rappel avant chaque échéance","Gardez vos échéances en vue et évitez les oublis."],
    [History,"Toutes vos quittances réunies","Même celles de vos anciens logements, disponibles à tout moment."],
    [ShieldCheck,"Un historique partagé avec votre accord","Prouvez votre sérieux à un prochain propriétaire seulement si vous le souhaitez."],
  ],
};

export function BenefitList({audience,dark=false}:{audience:Audience;dark?:boolean}){
  return <ul className="mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2">
    {benefits[audience].map(([Icon,title,description])=><li key={title} className="flex min-w-0 gap-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${dark?"bg-white/10 text-brand-green":"bg-brand-mist text-brand-blue"}`}><Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden/></span>
      <span className="min-w-0"><strong className="block text-sm leading-5">{title}</strong><span className={`mt-1 block text-[13px] leading-5 ${dark?"text-slate-300":"text-slate-500"}`}>{description}</span></span>
    </li>)}
  </ul>;
}
