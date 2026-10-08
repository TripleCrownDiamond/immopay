# ImmoPay — Product Requirements Document

## 1. Vision
ImmoPay est le système d'exploitation financier des bailleurs : **Vos loyers. Automatiquement.**
La plateforme centralise biens, unités, locataires, contrats, échéances, encaissements, relances et quittances.

## 2. Utilisateurs
- **Bailleur / propriétaire** : pilote son portefeuille et ses encaissements.
- **Gestionnaire** : agit sur les biens auxquels il est autorisé.
- **Locataire** : consulte ses échéances, paie et télécharge ses justificatifs.
- **Administrateur ImmoPay** : support, plans, fournisseurs, supervision et audit.

## 3. Principes produit
1. Une échéance de loyer est générée par le contrat, jamais ressaisie chaque mois.
2. Chaque paiement doit être réconciliable avec un locataire, une unité, une échéance et un bailleur.
3. Paiements, relances et quittances doivent être traçables.
4. L'interface mobile est une vraie PWA installable, avec navigation basse et bouton + flottant.
5. Les fournisseurs de paiement et de messagerie restent interchangeables.

## 4. Modèle métier
Bailleur → Bien → Unité → Contrat → Échéance → Paiement → Quittance.

### Bien et unité
Un bien peut être une maison, un immeuble, une boutique, un bureau ou autre. Il contient une ou plusieurs unités. Statuts : vacant, occupé, préavis, impayé.

### Locataire
Identité, téléphone, email, contact d'urgence optionnel, historique locatif et accès à son espace.

### Contrat
Montant du loyer, devise, fréquence (mensuelle, trimestrielle, semestrielle, annuelle, personnalisée), jour d'échéance, dates de début/fin, caution, avance, frais, paiement partiel autorisé ou non et politique de relance.

### Frais
Récurrents ou ponctuels : charges communes, eau, ordures, autres. Le total d'une échéance est détaillé par ligne.

### Échéance
États : à venir, due, partiellement payée, payée, en retard, annulée. Une échéance conserve montant attendu, payé et solde.

### Paiement
Canal, fournisseur, référence externe, montant, statut, date, payeur. Les webhooks sont idempotents. Un paiement partiel met à jour le solde sans produire une quittance finale.

### Quittance
Après règlement complet : identifiant unique, PDF, QR code et URL publique de vérification. La page publique expose uniquement les données nécessaires à l'authenticité.

## 5. Dashboard bailleur
KPIs : attendu, encaissé, restant, impayé, taux de recouvrement. Statuts des unités, graphique d'encaissement, échéances proches et paiements récents. Sur mobile, bouton **+** flottant unique ouvrant les actions rapides.

## 6. Relances et notifications
Canaux :
- notifications in-app ;
- **push PWA / Web Push** ;
- email ;
- WhatsApp ;
- SMS.

Déclencheurs : nouvelle échéance, J-5/J-2, jour J, retard J+3/J+7, paiement reçu, paiement partiel, quittance disponible, contrat proche de l'expiration, invitation, changement sensible.

Chaque utilisateur contrôle ses préférences par canal lorsque le message n'est pas transactionnel. Le moteur de relance journalise chaque tentative, statut fournisseur, coût estimé et quota consommé.

## 7. Espace locataire
Accueil avec montant dû et prochaine échéance, CTA payer, progression des paiements partiels, historique, quittances, notifications et profil. Gamification discrète : séries de paiements ponctuels et taux de ponctualité.

## 8. Paiements
Une interface PaymentProvider encapsule création de paiement, statut, vérification de webhook, remboursement futur et bénéficiaire. SasPay peut être branché après validation de ses capacités multi-bailleur/sous-comptes/split/payout. Aucune dépendance métier ne doit être couplée à un fournisseur.

## 9. Abonnements
Plans configurables :
- Starter : petit portefeuille, email et fonctionnalités essentielles.
- Pro : davantage d'unités, WhatsApp, rapports avancés.
- Business : gros portefeuille, équipe, SMS/WhatsApp plus larges et support renforcé.
Les quotas de messages sont comptabilisés. Des crédits supplémentaires pourront être vendus.

## 10. Rapports
Encaissements par période/bien/unité, impayés, occupation, historique locataire, export CSV/PDF et synthèse de performance.

## 11. PWA
Manifest, icônes, mode standalone, écran d'installation, service worker, cache de shell, stratégie offline limitée, Web Push, badges lorsque supportés et deep links vers l'échéance/paiement concerné.

## 12. Sécurité
Authentification à connecter à Neon, séparation stricte par organisation/bailleur, rôles vérifiés côté serveur, journal d'audit, validation serveur, secrets uniquement côté serveur, vérification cryptographique des webhooks, limitation de débit sur endpoints publics, minimisation des données sur les URLs de vérification. Les écrans actuels de démonstration ne constituent pas encore des comptes sécurisés ni des données persistées.

## 13. MVP
Inclus : auth/onboarding, biens/unités, locataires, contrats, génération d'échéances, dashboard, paiements manuels + abstraction paiement en ligne, partiels, quittances QR, espace locataire, centre de notifications, email + push, moteur de relance extensible WhatsApp/SMS, rapports de base, abonnement/quota de base et PWA.

Après MVP : équipes avancées, maintenance/incidents, comptabilité, scoring locatif sous cadre légal/consentement, marketplace et automatisations avancées.

### Extensions possibles après le MVP — foncier et locaux commerciaux
Ces usages sont **à étudier et non implémentés**. Ils réutilisent le suivi des contrats, des échéances et des paiements, avec des règles propres à chaque type d'opération.

- **Location de terres agricoles** : décrire la parcelle (surface, localisation et références disponibles), le bailleur et l'exploitant, la période ou saison, le loyer et sa fréquence ; suivre acomptes, échéances saisonnières, reçus et renouvellements. Les loyers liés à une récolte demanderaient une règle de calcul explicite et vérifiable.
- **Achat de parcelles** : suivre une transaction distincte d'un bail, avec parties, prix, réservation éventuelle, acomptes, échéancier, pièces et historique des versements. Un reçu de paiement ne doit pas être présenté comme une preuve de propriété ; les actes et vérifications de titre relèvent des intervenants compétents selon le pays.
- **Location de magasins et autres locaux commerciaux** : étendre les biens et contrats existants aux dépôts, charges, révisions de loyer, renouvellements et, si utile, à plusieurs lots dans un même marché ou bâtiment.

L'étude préalable devra confirmer les pays visés, les documents exigés, les modes de paiement et les règles propres aux baux ou ventes avant de définir ces parcours.

## 14. Critères de succès
Temps jusqu'au premier bien < 5 min ; dashboard compréhensible immédiatement ; rapprochement automatique fiable ; quittance générée après solde complet ; aucune fuite inter-bailleur ; notifications idempotentes ; PWA installable sur navigateurs compatibles.
