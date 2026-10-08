import Link from "next/link";
import {ArrowRight,Bell,Building2,ChartColumn,ChevronDown,CircleCheck,CreditCard,Crown,FileCheck2,FileText,Play,TrendingUp,UserRoundSearch} from "lucide-react";
import {QrMark,Sparkline} from "@/components/landing/illustrations";
import {AgencyDistrict3DLazy,City3DLazy,HeroDevices3DLazy,TenantPhones3DLazy} from "@/components/landing/lazy-3d";
import {SiteFooter} from "@/components/site-footer";
import {BenefitList} from "@/components/landing/benefits";

const features=[
  [Bell,"Rappels automatiques","Email, WhatsApp ou SMS selon votre formule."],
  [CreditCard,"Paiements en ligne","Mobile Money, carte bancaire et paiements enregistrés."],
  [FileCheck2,"Quittances vérifiables","Chaque quittance a une référence et un code QR."],
  [ChartColumn,"Suivi en temps réel","Encaissements, impayés et statistiques."],
  [Building2,"Gestion multi-biens","Appartements, boutiques, bureaux et maisons."],
] as const;
const steps=[[Building2,"Ajoutez vos biens","Créez vos immeubles, logements et locataires."],[FileText,"Définissez les contrats","Montant, fréquence, échéances et frais éventuels."],[Bell,"ImmoPay fait le reste","Rappels automatiques, encaissements et suivi."],[CircleCheck,"Consultez vos résultats","Statistiques, rapports et quittances vérifiables."]] as const;
const plans=[
  {name:"Starter",tag:"Pour débuter",price:"Gratuit",icon:CreditCard,items:["Jusqu’à 3 locataires","Rappels par email","Paiements en ligne","Quittances générées automatiquement","Tableau de bord"],cta:"Commencer gratuitement"},
  {name:"Pro",tag:"Pour les bailleurs actifs",price:"Bientôt",icon:Crown,items:["Jusqu’à 50 locataires","Rappels par email et WhatsApp","Rappels programmés avant et après l’échéance","Paiements en ligne","Quittances vérifiables avec code QR","Historique de paiement des futurs locataires, avec leur accord","Rapports avancés et export Excel / PDF","Support prioritaire"],cta:"Choisir Pro",popular:true},
  {name:"Business",tag:"Pour les agences et grands portefeuilles",price:"Sur mesure",icon:Building2,items:["Locataires illimités","Rappels par email, WhatsApp et SMS","Plusieurs utilisateurs avec rôles (gestionnaire, comptable)","Quittances à votre logo","Rapports par propriétaire mandant","Import de vos données existantes","Accompagnement à la mise en place","Interlocuteur dédié"],cta:"Nous contacter"},
];
const faq=[
  ["Comment fonctionne le paiement ?","Le locataire reçoit un rappel avec un lien de paiement. Dès que le paiement est confirmé, l’échéance est mise à jour et la quittance est générée automatiquement."],
  ["Quels moyens de paiement sont disponibles ?","Mobile Money et carte bancaire selon les opérateurs disponibles dans votre pays. Vous pouvez aussi enregistrer un paiement reçu en espèces ou par virement."],
  ["Mon locataire change de logement. Que devient son historique ?","Son espace locataire le suit. Il garde l’accès à toutes ses quittances, et un nouveau propriétaire peut consulter son historique de paiement s’il l’y autorise."],
  ["Puis-je commencer gratuitement ?","Oui. La formule Starter est gratuite pour démarrer avec un petit portefeuille."],
  ["Mes données sont-elles sécurisées ?","Les données de chaque propriétaire sont isolées, et l’historique d’un locataire n’est partagé qu’avec son accord."],
];

const Tile=({icon:I,size="md"}:{icon:typeof Bell;size?:"md"|"lg"})=><span className={`grid shrink-0 place-items-center rounded-xl bg-brand-mist text-brand-blue ${size==="lg"?"h-14 w-14":"h-11 w-11"}`}><I className={size==="lg"?"h-7 w-7":"h-5 w-5"} strokeWidth={1.75} aria-hidden/></span>;

export default function Landing(){return <main className="min-h-screen overflow-x-hidden bg-white text-brand-ink">
  {/* Header */}
  <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
    <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto sm:h-10"/></Link>
    <nav className="hidden gap-8 text-sm font-medium text-slate-600 lg:flex"><a href="#avantages" className="hover:text-brand-blue">Avantages</a><a href="#agences" className="hover:text-brand-blue">Agences</a><a href="#locataires" className="hover:text-brand-blue">Locataires</a><a href="#pricing" className="hover:text-brand-blue">Tarifs</a><a href="#faq" className="hover:text-brand-blue">FAQ</a></nav>
    <div className="flex items-center gap-2 sm:gap-3"><Link href="/login" className="hidden rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm font-semibold sm:block">Se connecter</Link><Link href="/signup" className="rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-brand-deep">Commencer gratuitement</Link></div>
  </header>

  {/* Hero */}
  <section className="relative">
    <div aria-hidden className="absolute -right-40 -top-40 h-[720px] w-[900px] rounded-full bg-gradient-to-br from-[#E4EDFF] via-[#EEF4FF] to-[#E3FAF0] blur-0 lg:-right-20"/>
    <div className="relative mx-auto grid max-w-7xl min-w-0 items-center gap-10 px-5 pb-20 pt-10 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] xl:gap-8 xl:pb-28 xl:pt-16">
      <div className="anim-rise min-w-0">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"><span className="h-2 w-2 rounded-full bg-brand-green anim-ping"/>Gestion locative simplifiée</span>
        <h1 className="mt-6 text-[clamp(1.875rem,9.5vw,3rem)] font-extrabold leading-[1.02] tracking-tight sm:text-6xl xl:text-[clamp(3rem,4.2vw,3.75rem)]">Vos loyers.<br/><span className="text-brand-blue">Automatiquement.</span></h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">Pour les propriétaires et les agences immobilières : rappels automatiques, paiements en ligne ou en banque, et quittances vérifiables générées sans effort.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3.5 font-semibold text-white shadow-xl shadow-blue-200 hover:bg-brand-deep">Commencer gratuitement<ArrowRight className="h-4 w-4"/></Link><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-brand-line bg-white px-6 py-3.5 font-semibold"><Play className="h-4 w-4 fill-brand-ink"/>Voir la démo</Link></div>
        <div className="mt-8 flex flex-wrap gap-5 text-sm font-medium text-slate-600">{["Simple à utiliser","Sécurisé","Adapté à l’Afrique"].map(x=><span key={x} className="flex items-center gap-1.5"><CircleCheck className="h-5 w-5 text-brand-green"/>{x}</span>)}</div>
      </div>

      <div className="relative mx-auto aspect-[1.3/1] min-w-0 w-full max-w-[760px]">
        <HeroDevices3DLazy className="anim-rise d-1 h-full w-full"/>
      </div>
    </div>
  </section>

  {/* Features */}
  <section id="features" className="relative border-y border-brand-line bg-white">
    <h2 className="sr-only">Fonctionnalités</h2>
    <div className="mx-auto grid max-w-7xl gap-x-6 gap-y-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
      {features.map(([I,t,d])=><article key={t} className="text-center">
        <div className="flex justify-center"><Tile icon={I} size="lg"/></div>
        <h3 className="mt-4 font-bold">{t}</h3><p className="mx-auto mt-1.5 max-w-[15rem] text-sm leading-6 text-slate-500">{d}</p>
      </article>)}
    </div>
  </section>

  {/* Owners */}
  <section id="avantages" className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:px-8">
    <div className="relative">
      <div className="h-[380px] overflow-hidden rounded-[32px] bg-gradient-to-b from-[#CFE0FF] via-[#E8F0FF] to-[#E3FAF0] sm:h-[460px]"><City3DLazy className="h-full w-full"/></div>
      <div className="anim-float absolute -bottom-8 left-4 w-[260px] rounded-2xl border border-brand-line bg-white p-4 shadow-2xl shadow-blue-100 sm:left-8">
        <div className="flex items-center gap-3"><Tile icon={ChartColumn}/><div><span className="text-xs text-slate-500">Revenus du mois</span><b className="block text-lg">1 420 000 F</b></div><span className="ml-auto flex items-center gap-0.5 text-xs font-bold text-emerald-600"><TrendingUp className="h-3.5 w-3.5"/>12%</span></div>
        <Sparkline className="mt-3 h-14 w-full"/>
      </div>
    </div>
    <div>
      <p className="text-sm font-bold text-brand-blue">Pour les propriétaires</p>
      <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Une gestion locative sans stress</h2>
      <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Gagnez du temps, évitez les oublis et gardez une vision claire de vos revenus. ImmoPay s’occupe des relances, des paiements et des quittances.</p>
      <BenefitList audience="owners"/>
    </div>
  </section>

  {/* Agencies */}
  <section id="agences" className="bg-brand-ink text-white">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-[1fr_1.15fr] lg:px-8">
      <div>
        <p className="text-sm font-bold text-brand-green">Pour les agences immobilières</p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Gérez les biens de tous vos clients</h2>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">Chaque propriétaire qui vous confie ses biens a son espace, ses locataires et ses rapports. Votre équipe encaisse, relance et reverse depuis un seul tableau de bord.</p>
        <BenefitList audience="agencies" dark/>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-ink hover:bg-brand-mist">Créer l’espace de mon agence<ArrowRight className="h-4 w-4"/></Link><a href="#pricing" className="inline-flex items-center rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white hover:bg-white/10">Voir l’offre Business</a></div>
      </div>
      <div className="relative aspect-[1.25/1] w-full overflow-hidden rounded-[32px] bg-gradient-to-b from-[#1B2A63] to-[#0B1A4A]">
        <AgencyDistrict3DLazy className="h-full w-full"/>
      </div>
    </div>
  </section>

  {/* Tenants */}
  <section id="locataires" className="relative overflow-hidden bg-gradient-to-b from-[#F2F6FF] to-white">
    <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:px-8">
      <div>
        <p className="text-sm font-bold text-brand-blue">Pour les locataires</p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Payez facilement et gardez vos quittances</h2>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Votre espace locataire vous suit d’un logement à l’autre. Vos quittances restent accessibles à tout moment, et votre historique de paiement devient une référence auprès de vos futurs propriétaires.</p>
        <BenefitList audience="tenants"/>
        <Link href="/espace-locataire" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-ink px-6 py-3.5 font-semibold text-white hover:bg-black">Accéder à l’espace locataire<ArrowRight className="h-4 w-4"/></Link>
      </div>
      <div className="relative mx-auto h-[540px] w-full max-w-[540px] overflow-hidden rounded-[32px] bg-gradient-to-br from-[#DFEAFE] via-[#EDF5FF] to-[#DDF9EB]">
        <TenantPhones3DLazy className="h-full w-full"/>
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-2xl border border-brand-line bg-white p-3 pr-5 shadow-2xl shadow-blue-100"><QrMark size={44} className="text-brand-ink"/><span><b className="block text-sm">Quittance vérifiable</b><span className="text-xs text-slate-500">avec code QR</span></span></div>
      </div>
    </div>
  </section>

  {/* How it works */}
  <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
    <div className="text-center"><h2 className="text-4xl font-extrabold tracking-tight">Comment ça marche ?</h2><p className="mt-3 text-slate-500">Une mise en place simple et rapide.</p></div>
    <ol className="relative mt-14 grid gap-10 md:grid-cols-4">
      <span aria-hidden className="absolute left-[12%] right-[12%] top-7 hidden border-t-2 border-dashed border-brand-line md:block"/>
      {steps.map(([I,t,d],i)=><li key={t} className="relative text-center">
        <span className="relative mx-auto block w-fit rounded-2xl bg-white px-3"><Tile icon={I} size="lg"/></span>
        <h3 className="mt-5 font-bold"><span className="text-brand-blue">{i+1}.</span> {t}</h3><p className="mx-auto mt-1.5 max-w-[14rem] text-sm leading-6 text-slate-500">{d}</p>
      </li>)}
    </ol>
  </section>

  {/* Pricing */}
  <section id="pricing" className="bg-gradient-to-b from-[#EEFBF5] to-[#F2F6FF]">
    <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <h2 className="text-4xl font-extrabold tracking-tight">Des offres adaptées à vos besoins</h2>
      <p className="mt-3 text-slate-500">Commencez gratuitement et passez à une offre supérieure quand vous le souhaitez.</p>
      <div className="mt-12 grid gap-5 md:grid-cols-3">{plans.map(p=><article key={p.name} className={`relative flex flex-col rounded-3xl bg-white p-7 ${p.popular?"shadow-2xl shadow-blue-200 ring-2 ring-brand-blue md:-translate-y-3":"border border-brand-line"}`}>
        {p.popular&&<span className="absolute -top-3 right-6 rounded-full bg-brand-blue px-3 py-1 text-xs font-bold text-white">Le plus populaire</span>}
        <div className="flex items-center gap-3"><Tile icon={p.icon}/><div><h3 className="font-bold">{p.name}</h3><p className="text-xs text-slate-500">{p.tag}</p></div></div>
        <strong className="mt-6 block text-3xl font-extrabold">{p.price}</strong>
        <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-600">{p.items.map(x=><li key={x} className="flex gap-2"><CircleCheck className="h-4 w-4 shrink-0 text-brand-green"/>{x}</li>)}</ul>
        <Link href="/signup" className={`mt-8 block rounded-xl p-3 text-center text-sm font-semibold ${p.popular?"bg-brand-blue text-white hover:bg-brand-deep":"border border-brand-blue text-brand-blue hover:bg-brand-mist"}`}>{p.cta}</Link>
      </article>)}</div>
    </div>
  </section>

  {/* FAQ */}
  <section id="faq" className="mx-auto grid max-w-7xl gap-10 px-5 py-24 lg:grid-cols-[1fr_1.4fr] lg:px-8">
    <div><h2 className="text-4xl font-extrabold tracking-tight">Questions fréquentes</h2><p className="mt-3 text-slate-500">Les réponses aux questions les plus courantes.</p><div className="mt-8 hidden items-center gap-3 rounded-2xl bg-brand-mist p-4 lg:flex"><Tile icon={UserRoundSearch}/><p className="text-sm text-slate-600">Locataire déjà inscrit ? Vos quittances vous attendent dans votre <Link href="/espace-locataire" className="font-semibold text-brand-blue">espace locataire</Link>.</p></div></div>
    <div className="space-y-3">{faq.map(([q,a])=><details key={q} className="group rounded-2xl border border-brand-line bg-white p-5 open:shadow-lg open:shadow-blue-50"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{q}<ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"/></summary><p className="mt-3 text-sm leading-6 text-slate-500">{a}</p></details>)}</div>
  </section>

  <SiteFooter/>
</main>}
