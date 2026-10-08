import Link from "next/link";

// Legal pages are linked now and will be written later.
const columns=[
  ["Produit",[["/#avantages","Avantages"],["/#agences","Agences immobilières"],["/#locataires","Espace locataire"],["/#pricing","Tarifs"],["/#faq","Questions fréquentes"]]],
  ["Compte",[["/login","Se connecter"],["/signup","Créer un compte"],["/espace-locataire","Accès locataire"]]],
  ["Légal",[["/mentions-legales","Mentions légales"],["/cgu","Conditions générales d’utilisation"],["/cgv","Conditions générales de vente"],["/confidentialite","Politique de confidentialité"],["/cookies","Politique de cookies"]]],
] as const;

export function SiteFooter(){
  return <footer className="bg-brand-ink text-slate-300">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
      <div>
        <img src="/brand/immopay-logo-white.png" alt="ImmoPay" className="h-9 w-auto"/>
        <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Vos loyers. Automatiquement. Rappels, paiements et quittances vérifiables pour propriétaires et locataires.</p>
      </div>
      {columns.map(([title,links])=><nav key={title} aria-label={title}>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <ul className="mt-4 space-y-2.5 text-sm">{links.map(([href,label])=><li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}</ul>
      </nav>)}
    </div>
    <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:justify-between lg:px-8"><span>© 2026 ImmoPay. Tous droits réservés.</span><span>Conçu pour la gestion locative en Afrique.</span></div></div>
  </footer>;
}
