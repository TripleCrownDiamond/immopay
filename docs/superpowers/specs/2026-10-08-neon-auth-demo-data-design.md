# ImmoPay — Authentification Neon et données de démonstration

## Intention et périmètre validé

Ce premier bloc permet à un propriétaire, un gestionnaire d'agence et un locataire de se connecter par email et mot de passe, d'accéder uniquement à leur espace, et d'y voir des données de démonstration persistées dans la branche Neon `production`. Les comptes et données de test sont créés directement sur cette branche, comme demandé. Les écrans marketing conservent leurs captures illustratives.

Le bloc ne prétend pas rendre fonctionnels les paiements, la création de biens, les invitations, les quittances PDF ni les autres mutations métier. Les contrôles concernés doivent être désactivés ou clairement signalés comme démonstration tant que leurs opérations serveur n'existent pas. Les futurs usages fonciers et commerciaux restent hors périmètre.

## Choix d'architecture

**Retenu : Neon Auth géré + requêtes PostgreSQL dans Next.js côté serveur.** Neon Auth gère les comptes et sessions ; les tables applicatives gèrent rôles, organisations et données locatives. Les pages et handlers Next.js vérifient la session et le périmètre avant chaque lecture. Les secrets et la connexion SQL restent côté serveur.

Le SDK Neon Auth actuel indique un peer Next.js `>=16.0.0`, alors que le projet est sur Next.js 15. La mise à niveau vers Next.js 16 fait donc partie de ce bloc, avec adaptation du middleware/proxy et vérification du build et des parcours existants avant toute bascule en production. Ne pas forcer l'installation du SDK sur Next.js 15.

Alternatives écartées pour ce bloc : Better Auth autohébergé (plus de maintenance d'identité), et Data API exposée au navigateur (surface d'autorisation plus large alors que le projet dispose déjà de Next.js côté serveur). Les migrations Supabase historiques servent de référence métier, sans être exécutées telles quelles sur Neon.

## Identité et autorisation

- Activer Neon Auth sur le projet lié, branche `production`, sans écraser la configuration actuelle des buckets et Functions.
- Utiliser le proxy Auth Next.js et des formulaires de connexion, inscription et déconnexion. Prévoir les états chargement, erreur, session expirée et retour à la page demandée.
- Configurer le middleware/proxy selon la version Next.js 16 et le SDK effectivement installés ; limiter son matcher aux routes privées.
- Une inscription publique crée uniquement un espace propriétaire personnel. Un utilisateur ne choisit jamais librement le rôle `agency_manager` ou `tenant` dans le navigateur. Les comptes de démonstration de ces rôles sont provisionnés explicitement.
- `profiles` associe l'identifiant Neon Auth à un profil applicatif. `organization_members` associe un profil à une organisation avec rôle `owner` ou `agency_manager`. Un profil locataire est lié à ses lignes métier par identifiant de compte ; il n'obtient pas l'accès aux organisations d'autres personnes.
- Le middleware redirige les visites anonymes des pages privées. Chaque page/handler refait une vérification de session et de rôle côté serveur avant la requête SQL. Les requêtes filtrent par organisation autorisée ou par identifiant locataire, sans accepter un identifiant d'organisation fourni seul par le client.
- Les pages publiques (`/`, `/login`, `/signup`, `/verify/...` et les captures marketing) restent accessibles sans session. La vérification d'une quittance ne peut confirmer que les références réellement présentes en base ; une référence inconnue reçoit un état introuvable.

## Données et migrations

Créer des migrations SQL versionnées pour un noyau minimal : `profiles`, `organizations`, `organization_members`, `properties`, `units`, `tenants`, `leases`, `rent_dues`, `payments` et `receipts`. Chaque relation métier porte l'organisation pertinente ; clés étrangères et contraintes garantissent l'intégrité. Montants stockés en entiers de la plus petite unité monétaire et devise explicite. Les références de quittance sont uniques. Les données d'identité restent dans le schéma géré par Neon Auth ; les migrations applicatives ne modifient pas ses tables.

Appliquer les migrations avec une connexion directe, après essai sur une branche Neon issue de `production`. Le seed est idempotent, clairement identifié comme démonstration et limité à des organisations, biens, baux, échéances et paiements fictifs. Les comptes Auth correspondants sont créés séparément par un script de provisionnement utilisant des mots de passe générés ou fournis hors Git ; aucune adresse personnelle ni mot de passe en clair n'entre dans une migration ou un commit. Le script lie ensuite les identifiants Auth aux profils et aux organisations. Le seed ne modifie pas les futures données réelles hors de son espace dédié.

## Parcours affichés

- **Propriétaire** : après connexion, tableau de bord, biens, locataires, échéances et paiements de sa seule organisation, alimentés par Neon.
- **Gestionnaire d'agence** : mêmes lectures pour les organisations auxquelles il est explicitement rattaché ; le contexte de l'organisation affichée est visible et contrôlé côté serveur.
- **Locataire** : page de connexion dédiée ou entrée depuis `/login`, puis accueil, échéances, historique et quittances appartenant à ce compte. Un nouveau locataire sans bail lié voit un état vide utile, jamais la démonstration d'un autre compte.
- **Inscription propriétaire** : création du compte Auth, puis création idempotente du profil et de l'organisation personnelle ; redirection vers l'espace correspondant.
- **Déconnexion** : fin de session et retour à une page publique.

Les composants de lecture reçoivent des données typées côté serveur. Les fichiers `src/lib/demo/*` peuvent rester pour les captures et exemples marketing, mais aucun écran privé ne doit s'en servir comme source d'autorité une fois migré.

## Déploiement et configuration

Les variables serveur requises comprennent `DATABASE_URL` (pooled pour l'application), `DATABASE_URL_UNPOOLED` (migrations), `NEON_AUTH_BASE_URL` et `NEON_AUTH_COOKIE_SECRET`. Les variables sensibles sont configurées dans l'environnement local et dans les deux projets Vercel de production, jamais dans Git. Enregistrer les domaines Vercel utilisés dans les domaines de confiance de Neon Auth. Prévoir la configuration email de production exigée par Neon avant d'ouvrir l'inscription publique au-delà de la démonstration.

Ordre de déploiement : vérifier les variables et domaines, tester la migration sur une branche, appliquer la migration et le seed à `production`, provisionner les comptes de test, déployer l'application, puis vérifier les parcours avec chaque rôle. Si une étape échoue, ne pas exposer une page qui mélange données privées et démonstration publique.

## Vérification et critères d'acceptation

1. Inscription, connexion, déconnexion et restauration de session après rechargement fonctionnent.
2. Les trois rôles voient des données persistées correspondant à leur périmètre ; deux organisations ne peuvent pas lire leurs données réciproques.
3. Un visiteur anonyme et un locataire ne peuvent pas ouvrir directement les routes ou handlers propriétaire/agence ; un propriétaire ne peut pas lire les données privées d'un autre.
4. Les données de démonstration restent identiques après rechargement et le seed peut être relancé sans doublon.
5. Un compte neuf sans données voit un état vide explicite ; une quittance inconnue n'est jamais annoncée authentique.
6. TypeScript et build passent ; les scénarios d'accès négatifs et les parcours principaux sont exercés dans le navigateur et via des requêtes directes.

## Points de contrôle

L'intégration dépend de l'accès au projet Neon et aux paramètres des deux projets Vercel. Les fonctionnalités d'email en production dépendent de la configuration SMTP requise par Neon. Aucun identifiant de démonstration partagé publiquement ne doit donner accès à une organisation réelle.
