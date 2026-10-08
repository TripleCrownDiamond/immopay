# MVP Roadmap

## Phase 1 — Foundation
- [x] PRD and architecture
- [x] Next.js/PWA scaffold
- [x] Schéma initial exploratoire (migrations Supabase historiques, non appliquées à Neon)
- [x] Responsive app shell and landlord dashboard
- [x] Provider abstractions

## Phase 2 — Rental core
- [x] Property list/create UI
- [x] Tenant list UI
- [x] Lease creation UI
- [x] Rent schedule generator
- [x] Partial payment allocation/domain status
- [ ] Migrer le modèle métier vers Neon et connecter les formulaires
- [ ] Auth/session middleware
- [ ] Tenant invitations

## Phase 3 — Money
- [x] Payments UI and manual flow shell
- [ ] Online provider adapter
- [ ] Signed/idempotent webhook
- [ ] Automatic reconciliation
- [ ] Receipt PDF + QR generation
- [x] Public verification route shell

## Phase 4 — Notifications
- [x] Reminder rule engine foundation
- [ ] Notification center
- [ ] Web Push subscription API
- [ ] Email provider
- [ ] WhatsApp provider
- [ ] SMS provider
- [ ] Quota/usage accounting

## Phase 5 — SaaS
- [ ] Subscription plans
- [ ] Reports/exports
- [ ] Admin/support
- [ ] Tests, CI and production hardening

## Après le MVP — foncier et commerces (à étudier)
- [ ] Cadrer les pays, types de contrats et justificatifs avec les utilisateurs concernés
- [ ] Location de terres agricoles : parcelles, périodes/saisons, loyers, échéances et reçus
- [ ] Achat de parcelles : dossier de vente, acomptes, échéancier et documents, séparés des baux
- [ ] Étendre la location commerciale : magasins, lots, charges, dépôts et renouvellements
