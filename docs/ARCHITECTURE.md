# Architecture ImmoPay

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Neon PostgreSQL et Neon Auth : identités, sessions et tables métier
- PWA / Web Push
- API/Route Handlers pour webhooks et intégrations

## Modules
`auth`, `organizations`, `properties`, `units`, `tenants`, `leases`, `charges`, `rent-due`, `payments`, `receipts`, `notifications`, `subscriptions`, `reports`, `audit`.

## Tables principales
profiles, organizations, organization_members, properties, units, tenants, leases, lease_charges, rent_dues, payments, payment_allocations, receipts, notification_preferences, notification_jobs, notification_deliveries, push_subscriptions, plans, subscriptions, usage_counters, audit_logs.

`neon/migrations/0001_core.sql` contient les tables actives du premier bloc : `profiles`, `organizations`, `organization_members`, `properties`, `units`, `tenants`, `leases`, `rent_dues`, `payments` et `receipts`. Les autres tables restent cibles. Les migrations `supabase/` sont historiques et ne sont pas appliquées à Neon. Chaque lecture privée vérifie la session Neon Auth et filtre par organisation autorisée ou par l'identifiant Auth du locataire.

Les écrans propriétaire, agence et locataire affichent les données de Neon. Les actions d'écriture métier, le paiement en ligne, les relances et le PDF restent à développer ; les contrôles correspondants sont inactifs ou signalent leur indisponibilité. La vérification publique des quittances interroge le code stocké et indique clairement une référence inconnue.

Pour les extensions foncières envisagées après le MVP, conserver un socle commun « actif, partie, accord, échéance, paiement, document » et modéliser séparément les baux agricoles, baux commerciaux et ventes. Une vente ne doit pas être forcée dans le modèle `leases`. Aucun schéma ni parcours de ces extensions n'est déployé à ce stade.

## Providers
```ts
interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<PaymentIntent>
  getPayment(reference: string): Promise<ProviderPayment>
  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent>
}

interface NotificationProvider {
  channel: "email" | "whatsapp" | "sms" | "push"
  send(message: NotificationMessage): Promise<DeliveryResult>
}
```

## Flux paiement
1. Une échéance existe.
2. ImmoPay crée une intention avec référence interne immuable.
3. Le fournisseur traite le paiement.
4. Webhook signé reçu.
5. Événement dédupliqué.
6. Paiement enregistré et alloué.
7. Solde recalculé.
8. Si solde = 0 : quittance + QR.
9. Notifications bailleur/locataire.

## Relances
Un scheduler sélectionne les échéances correspondant aux règles. Chaque envoi produit un job idempotent. Les quotas sont réservés avant appel fournisseur puis confirmés/relâchés selon résultat.

## Déploiement
Environnements local, branche Neon de répétition et production. Variables documentées dans `.env.example` : `DATABASE_URL` (pool), `DATABASE_URL_UNPOOLED` (migration et seed), `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` et `NEON_BRANCH`. Les domaines applicatifs doivent être autorisés dans Neon Auth. Aucun secret ni mot de passe de démonstration dans Git. Exécuter la migration, le seed puis le provisionnement Auth uniquement avec une cible de branche explicite. Les comptes locataire et gestionnaire sont provisionnés côté serveur ; l'inscription publique ne crée qu'un compte propriétaire.
