# ImmoPay — inscription agence et activation des espaces locataires

## Intention validée

Permettre à une vraie agence de créer son organisation, d'inviter ses gestionnaires, et à un propriétaire ou gestionnaire d'inviter un locataire dans l'espace correspondant à sa fiche. Les invitations sont des liens à copier depuis l'application. Ajouter un parcours de récupération de mot de passe pour les comptes Neon Auth. Les rôles et rattachements sont attribués uniquement par le serveur.

Le succès se mesure avec trois comptes neufs : une agence peut ouvrir son propre tableau de bord, un collègue invité voit uniquement cette agence, et un locataire invité voit uniquement les baux et quittances reliés à sa fiche. Les accès croisés et les invitations expirées échouent.

## Situation actuelle

Neon Auth assure déjà inscription, connexion, session et déconnexion. `profiles`, `organization_members` et `tenants.auth_user_id` portent les droits applicatifs. L'inscription publique crée toujours un propriétaire et sa propre organisation. Le bouton marketing « Créer l'espace de mon agence » pointe à tort vers ce flux. Les comptes agence et locataire actuels ont été provisionnés par script. `tenants/new` est une page d'attente. Les données du locataire sont déjà filtrées par `tenants.auth_user_id`.

## Choix et alternatives

**Retenu : liens d'invitation à usage unique, stockés sous forme de hash dans PostgreSQL.** Un membre autorisé copie le lien et le transmet au destinataire. Aucun service d'envoi n'est nécessaire pour l'activation initiale. Le destinataire crée son compte Neon Auth ou se connecte, puis le serveur consomme l'invitation et rattache son identité. Le lien n'attribue jamais un rôle choisi dans le navigateur.

L'envoi automatique par email est reporté car il exige une configuration d'envoi et une délivrabilité validées. La création de comptes avec mots de passe temporaires par les gestionnaires est écartée : elle exposerait les secrets à des tiers et compliquerait la récupération des comptes.

## Modèle de données

- Une migration versionnée ajoute `organizations.kind` (`owner` ou `agency`, `owner` par défaut). Elle classe l'organisation de démonstration agence existante d'après son membership `agency_manager`, sans toucher aux organisations propriétaires ni aux données Neon Auth.
- Une table `account_invitations` contient `id`, `organization_id`, `kind` (`agency_manager` ou `tenant`), `tenant_id` nullable, `email` normalisé, `token_hash` unique, `expires_at`, `accepted_at`, `accepted_by_auth_user_id`, `revoked_at`, `created_by_auth_user_id` et `created_at`. Une contrainte lie `tenant_id` à la même organisation pour les invitations locataires. Le token brut n'est jamais enregistré ; il est montré une seule fois à sa création.
- Une invitation dure sept jours. Une nouvelle invitation pour le même rôle, email, organisation et éventuelle fiche locataire révoque les invitations encore ouvertes. La consommation est atomique, verrouillée et idempotente pour la même identité ; un autre compte ne peut pas la reprendre.
- Le schéma actuel conserve un seul `profiles.kind` par identité. Dans ce bloc, un compte propriétaire ne devient pas gestionnaire ni locataire, et un gestionnaire ne rejoint pas une seconde organisation. Le serveur retourne un message explicite pour ces cas au lieu de changer silencieusement un rôle existant. Un locataire peut être lié à des fiches de plusieurs organisations s'il est invité à la même adresse.

## Parcours agence

`/signup/agence` demande nom, email, mot de passe et nom d'agence. Après création du compte Auth, un endpoint dédié vérifie la session, crée idempotemment un profil `agency_manager`, une organisation `agency` et son premier membership. Il refuse un compte déjà profilé dans un autre rôle. Le bouton marketing agence mène à cette page. La connexion reste `/login`, puis `/api/account/context` dirige vers `/dashboard`.

Dans les paramètres d'une organisation agence, un gestionnaire peut saisir l'email d'un collègue et créer un lien d'invitation `agency_manager` pour **son** organisation. Il peut voir les invitations en attente, les révoquer et en générer une nouvelle. Un gestionnaire invité n'obtient aucun droit sur d'autres organisations. Tous les gestionnaires de cette première version peuvent inviter ou révoquer des collègues de leur agence ; un rôle d'administrateur distinct et un rôle de comptable restent hors de ce bloc.

## Parcours locataire

Depuis `/tenants`, un propriétaire ou gestionnaire peut créer une fiche locataire avec nom, email et téléphone. Il peut aussi inviter une fiche existante non liée, notamment une fiche qui possède déjà des baux. Si cette fiche n'a pas encore d'email, il doit d'abord lui en ajouter un ; une invitation existante ne peut pas être redirigée vers un autre email. L'endpoint vérifie le membership, le `tenant_id`, l'email enregistré et l'organisation côté serveur avant de générer le lien. Une fiche déjà liée à une autre identité ne peut pas être revendiquée.

`/invitation/[token]` montre le nom de l'organisation, le rôle proposé et l'email masqué. Le destinataire s'inscrit ou se connecte avec **le même email**. L'acceptation vérifie la session Neon Auth, le hash du token, l'expiration, la révocation, l'email et l'état du profil dans une transaction. Elle crée le profil `tenant` si nécessaire puis lie `tenants.auth_user_id`. Les baux, échéances et quittances déjà reliés à cette fiche apparaissent alors dans `/espace-locataire`. Une fiche neuve sans bail affiche son état vide actuel ; la création de bail, actuellement une page d'attente, est un chantier métier distinct.

Un locataire ne s'inscrit pas librement comme tel depuis le formulaire propriétaire. L'invitation reste nécessaire pour relier un compte à une fiche et empêcher la lecture de données sur simple connaissance d'une adresse email.

## Mot de passe oublié

Les deux pages de connexion mènent à `/mot-de-passe-oublie`. Le formulaire appelle `requestPasswordReset` de Neon Auth et affiche une réponse identique pour une adresse connue ou inconnue. Le lien envoyé par Neon ouvre `/reinitialiser-mot-de-passe`, qui valide le token avec `resetPassword`, puis propose la connexion. Le site n'enregistre jamais de token de réinitialisation dans sa base. La remise effective d'emails en production dépend de la configuration email de Neon Auth ; si elle n'est pas opérationnelle, le lancement du parcours reste conditionné à sa vérification réelle.

## Autorisation et erreurs

- Chaque endpoint d'écriture vérifie la session et le rôle en base, puis utilise une requête SQL paramétrée et bornée à l'organisation autorisée. Le client ne peut pas envoyer librement un rôle ou une organisation pour obtenir des droits.
- Les endpoints d'invitation refusent les emails mal formés, les fiches d'autres organisations, les liens utilisés, révoqués ou expirés, et les comptes connectés avec une autre adresse.
- Les tokens bruts ne figurent ni dans les journaux, ni dans les listes d'invitations, ni dans les messages d'erreur. Les pages de token et de réinitialisation évitent le cache et une fuite via les liens externes.
- Les opérations de création et d'acceptation sont transactionnelles ; un échec ne laisse pas de membership ni de lien locataire partiel. La répétition après une réponse perdue ne crée pas de doublon.
- Le proxy protège les nouvelles pages de gestion ; les pages d'acceptation et de réinitialisation restent publiques, mais leurs actions vérifient la session ou le token nécessaire.

## Interface et vérification

Les formulaires indiquent chargement, erreur et succès. La liste des locataires montre si la fiche est liée ou attend une invitation. La page d'invitation explique clairement à quel espace elle donne accès. Les liens à copier ne sont visibles qu'au moment de la génération, avec une action explicite de copie.

Tests ciblés : création agence idempotente ; refus du bootstrap agence pour un propriétaire ; invitation autorisée seulement dans l'organisation du demandeur ; acceptation avec email différent, lien expiré, révoqué ou déjà utilisé ; rattachement locataire sans mélange de données ; absence de doublons après répétition. Vérifier TypeScript, tests et build, puis exercer dans le navigateur les trois parcours neufs et la récupération de mot de passe. Les migrations sont d'abord essayées sur une branche Neon de répétition, puis appliquées sur `production` seulement après vérification ; aucune donnée de démonstration ne doit être effacée.
