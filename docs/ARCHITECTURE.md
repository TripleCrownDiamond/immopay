# Architecture ImmoPay

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase : PostgreSQL, Auth, Storage, RLS
- PWA / Web Push
- API/Route Handlers pour webhooks et intégrations

## Modules
`auth`, `organizations`, `properties`, `units`, `tenants`, `leases`, `charges`, `rent-due`, `payments`, `receipts`, `notifications`, `subscriptions`, `reports`, `audit`.

## Tables principales
profiles, organizations, organization_members, properties, units, tenants, leases, lease_charges, rent_dues, payments, payment_allocations, receipts, notification_preferences, notification_jobs, notification_deliveries, push_subscriptions, plans, subscriptions, usage_counters, audit_logs.

Toutes les entités métier portent organization_id lorsque pertinent. Les politiques RLS doivent empêcher tout accès inter-organisation.

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
Environnements local, preview/staging, production. Variables documentées dans .env.example. Aucun secret dans Git.
