# Retour des actions, tableau de bord et invitations par email

Date : 9 octobre 2026

## Intention et critère de réussite

Une personne qui crée un compte, ajoute un locataire ou émet une invitation doit savoir immédiatement ce qui a réussi, ce qui reste à faire et ce qui a échoué. Le tableau de bord propriétaire ou agence doit donner accès aux actions courantes sans faire lire une succession de blocs de texte. Une invitation doit pouvoir être expédiée au destinataire quand un fournisseur email est configuré, avec un lien manuel utilisable si l'envoi n'est pas disponible.

Le parcours actuel d'inscription peut aboutir à `/login` après une redirection vers `/dashboard` sans y conserver le message de création du compte. L'inscription propriétaire, l'inscription agence et l'acceptation d'invitation ont déjà des messages locaux, mais ceux-ci sont perdus lors d'une navigation. Les cartes du tableau de bord n'ont ni icônes ni actions directes. L'API d'invitation crée aujourd'hui un lien à usage unique et le rend à l'interface sans envoyer d'email.

## Choix de conception

1. **Retour d'action partagé.** Ajouter `react-hot-toast` à la racine de l'application, avec succès, erreur et information visuellement distincts. Les toasts annoncent les opérations courtes ; les erreurs de formulaire restent à proximité des champs avec `role="alert"`. Les états qui demandent une étape suivante (vérification d'email, reprise de connexion, invitation non envoyée) restent visibles dans la page et ne reposent jamais sur le seul toast.
2. **Inscription compréhensible.** Quand Neon Auth crée un utilisateur sans session immédiatement exploitable, afficher un état de réussite persistant, l'adresse utilisée, la consigne de vérifier l'email si nécessaire et un lien explicite vers la connexion. Lorsqu'une redirection vers le tableau de bord finit malgré tout sur `/login`, conserver un message ponctuel de succès dans la session du navigateur et l'afficher sur la page de connexion. Une erreur de configuration de l'espace est distinguée d'un échec de création du compte : l'utilisateur ne doit pas recréer son identité. Le même principe s'applique aux propriétaires, agences et invités locataires ou gestionnaires.
3. **Dashboard orienté actions.** Conserver les quatre indicateurs et le taux de recouvrement, mais leur ajouter des icônes Lucide et une hiérarchie visuelle. Placer des boutons bien visibles vers l'ajout d'un bien, d'un locataire et l'enregistrement d'un paiement, en utilisant les routes existantes. La prochaine échéance et les états vides indiquent quoi ouvrir ensuite. Les montants et permissions restent ceux renvoyés par les services actuels ; la mise en page s'adapte au mobile.
4. **Email à la création de l'invitation.** La fiche locataire est une donnée métier, sans accès accordé. L'email d'accès part quand un membre autorisé crée une invitation, car c'est à ce moment que le jeton existe. Le même transport sert aux invitations de gestionnaires d'agence. L'envoi est initié côté serveur après validation des droits et création de l'invitation. Un fournisseur Resend via API est recommandé pour ce premier bloc ; son appel est isolé derrière un module de transport afin qu'un SMTP tiers puisse le remplacer plus tard. L'appareil ne reçoit jamais la clé du fournisseur.

## Flux d'invitation et états de livraison

L'API `POST /api/invitations` continue de renvoyer le lien une seule fois. Elle tente ensuite l'envoi avec une clé `RESEND_API_KEY` et une adresse expéditrice `INVITATION_FROM_EMAIL` configurées côté serveur. Le domaine expéditeur doit être vérifié auprès du fournisseur avant l'envoi réel. La réponse inclut `delivery: "sent" | "not_configured" | "failed"` et l'interface distingue « invitation créée et email envoyé » de « invitation créée, email non envoyé : copiez le lien ». Une panne du fournisseur ne détruit ni l'invitation ni le lien de secours. Le statut d'envoi et la date d'acceptation par le fournisseur sont conservés dans la ligne d'invitation pour éviter d'afficher plus tard un succès fictif. « Envoyé » veut dire accepté par le fournisseur, pas livré dans la boîte du destinataire.

Le lien reste valable sept jours selon la règle existante. Créer un nouveau lien révoque le précédent ; l'interface doit avertir que l'ancien email, s'il a déjà été envoyé, ne permettra plus d'accéder à l'espace. Le bouton de copie demeure disponible immédiatement après création. Aucune adresse ou jeton n'est inscrit dans les logs d'erreur. Les opérations gardent les vérifications serveur de session, d'organisation et de rôle existantes. L'envoi n'a lieu que pour une invitation créée par un utilisateur autorisé.

Sans clé ou domaine vérifié, l'application utilise le lien manuel. Elle ne prétend pas qu'un email a été envoyé et ne bascule pas vers un autre SMTP silencieusement. Les emails de vérification de compte et de réinitialisation de mot de passe restent gérés par Neon Auth et son propre fournisseur email : brancher Resend pour les invitations ne configure pas automatiquement ces messages.

## Options considérées

- **Resend API avec lien manuel de secours (retenu)** : interface serveur simple pour l'application Next.js, statut d'acceptation exploitable et peu de configuration dans le code. Il faut créer la clé et vérifier le domaine d'envoi avant la production.
- **SMTP tiers dès le premier bloc** : convient si l'entreprise dispose déjà d'identifiants SMTP ; demande plus de configuration de transport et de gestion des erreurs réseau. Le module de transport permet de l'adopter ultérieurement sans changer l'API d'invitation.
- **Lien manuel uniquement** : fonctionne sans fournisseur et reste le secours, mais ne satisfait pas l'envoi automatique demandé.

## Périmètre et vérification

Le premier déploiement couvre les parcours propriétaire, agence, locataire invité, les actions de création et révocation d'invitation, ainsi que le tableau de bord partagé. Il ne crée pas de campagne marketing, de relance planifiée ou de garantie de livraison en boîte de réception.

Vérifier par tests de service les trois états de livraison, l'autorisation d'envoi et l'absence de fuite du jeton ; par tests navigateur la confirmation après inscription, la redirection vers la connexion, les toasts et les actions du dashboard. Répéter les migrations et les tests sur la branche Neon de répétition avant production. Les tests d'envoi utilisent un transport simulé ; un envoi réel vers une boîte de test est requis seulement après configuration du fournisseur et du domaine. Mesurer le résultat sur ordinateur et mobile.

## Déploiement et dépendances externes

Variables serveur nouvelles : `RESEND_API_KEY` et `INVITATION_FROM_EMAIL`. Leur absence active le secours manuel. Ajouter la migration de statut de livraison avant le déploiement de l'application. Vérifier le domaine et les enregistrements DNS requis dans Resend, puis la configuration du fournisseur email de Neon Auth séparément. Aucun secret ni lien d'invitation réel n'est commité.

Références : [Resend avec Next.js](https://resend.com/nextjs), [Resend SMTP](https://www.resend.com/changelog/smtp-service), [vérification de domaine Resend](https://resend.com/changelog/new-domains-workflow), [Neon Auth et ses réglages email](https://neon.com/blog/handling-auth-in-a-staging-environment).
