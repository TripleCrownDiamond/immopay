# Agency and Tenant Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a new agency to register, invite managers, and let an owner or manager create and invite tenants who can see their own existing rentals; add password recovery through Neon Auth.

**Architecture:** Neon Auth owns identities and reset tokens. PostgreSQL owns organizations, membership, tenant links, and short-lived invitation hashes. Every mutation verifies the Auth session and organization scope on the server and commits role assignment in a transaction.

**Tech Stack:** Next.js 16 App Router, React 19, Neon Auth SDK, PostgreSQL via `pg`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-08-agency-tenant-onboarding-design.md`

## Global Constraints

- Keep the existing owner signup and the demo identities intact.
- Invite links are copied by a member; this block does not send invitation email.
- A token is single use, expires after seven days, is stored only as SHA-256, and is never logged.
- Never infer a role, organization, or tenant ID from the browser without checking the session and database membership.
- Keep Neon Auth secrets, SQL URLs, and demo passwords out of Git.
- Read the relevant Next.js 16 docs in `node_modules/next/dist/docs/` before changing routes, proxy, or pages.
- Test the SQL migration on a disposable Neon branch before applying it to `production`; preserve existing demo data.

## Review Focus

1. Two invitation creation requests for the same email arrive together: Task 3 tests that only the latest live token remains.
2. An invitation is copied to a signed-in user with a different email: Task 4 tests rejection without a profile or membership write.
3. A tenant row has no email or is already linked: Task 3 tests refusal until its email is supplied, and refusal to transfer a linked row.
4. Signup creates an Auth user but no session yet: Task 5 keeps the invitation URL and offers sign-in after email verification.
5. Reset is requested for an unknown address: Task 6 uses the same public message as for a known address, without exposing existence.

## File map

- `neon/migrations/0002_onboarding.sql`: organization kind and invitation schema.
- `src/lib/onboarding/agency.ts`: idempotent agency bootstrap and agency checks.
- `src/lib/onboarding/tenants.ts`: organization-scoped tenant creation and email updates.
- `src/lib/onboarding/invitations.ts`: token generation, listing, revocation, preview, and atomic acceptance.
- `src/app/api/account/agency/route.ts`: agency bootstrap.
- `src/app/api/tenants/route.ts`, `src/app/api/tenants/[id]/route.ts`: tenant writes.
- `src/app/api/invitations/route.ts`, `src/app/api/invitations/[id]/route.ts`, `src/app/api/invitations/accept/route.ts`: invitation writes and reads.
- `src/app/signup/agence/page.tsx`, `src/components/auth/agency-signup-form.tsx`: agency registration.
- `src/app/invitation/[token]/page.tsx`, `src/components/auth/invitation-accept.tsx`: invitation activation.
- `src/app/mot-de-passe-oublie/page.tsx`, `src/app/reinitialiser-mot-de-passe/page.tsx`: password recovery.
- `src/lib/auth/password-recovery.ts`, `src/components/auth/password-recovery.tsx`: reset request helper and forms.
- `src/app/tenants/new/page.tsx`, `src/app/tenants/page.tsx`, `src/app/settings/page.tsx`: member entry points and status.
- `next.config.ts`: response headers preventing invitation and reset tokens from leaking through referrers.
- `tests/onboarding/*.test.ts`: business rules and negative access cases.

---

### Task 1: Database migration and constraints

**Files:** Create `neon/migrations/0002_onboarding.sql`; test `tests/onboarding/schema.test.ts`.

**Interfaces:** Produces `organizations.kind` and `account_invitations` for Tasks 2–5. Run through existing `scripts/migrate.mjs` with explicit project and branch.

- [ ] **Step 1: Write a branch-gated failing schema test.** In `tests/onboarding/schema.test.ts`, connect using `DATABASE_URL_UNPOOLED` only on the disposable branch. Assert `organizations.kind` exists, the demo agency is `agency`, a tenant invitation cannot omit `tenant_id`, and `(organization_id, tenant_id)` must reference the same tenant row. Use `BEGIN`/`ROLLBACK` around constraint probes.

```ts
const column = await db.query("SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='kind'");
expect(column.rowCount).toBe(1);
await expect(db.query("INSERT INTO account_invitations(organization_id,kind,email,token_hash,expires_at,created_by_auth_user_id) VALUES($1,'tenant',$2,$3,now()+interval '7 days',$4)", [org, "x@example.test", hash, actor])).rejects.toThrow();
```

- [ ] **Step 2: Create the rehearsal branch with `neon branch create --project-id morning-resonance-39210364 --parent production --name auth-onboarding-rehearsal-20261008 --no-secrets`; load its direct URL into `DATABASE_URL_UNPOOLED` locally without printing it. Run `npx vitest run tests/onboarding/schema.test.ts` with `NEON_BRANCH=auth-onboarding-rehearsal-20261008`; confirm the missing column/table failure.**
- [ ] **Step 3: Add the migration.** Use `ALTER TABLE organizations ADD COLUMN kind text NOT NULL DEFAULT 'owner' CHECK (kind IN ('owner','agency'))`; classify existing agency organizations with an `EXISTS` query on `organization_members.role='agency_manager'`. Add `UNIQUE(organization_id,id)` to `tenants` if needed by the composite FK. Create `account_invitations` with UUID PK, composite tenant FK, role/tenant consistency check, unique `token_hash`, seven-day expiry column, accepted/revoked timestamps, accepted identity, creator identity, and indexes for pending invitations. Ensure an agency manager invitation has `tenant_id IS NULL`, a tenant invitation has `tenant_id IS NOT NULL`.

```sql
CHECK ((kind='tenant' AND tenant_id IS NOT NULL) OR (kind='agency_manager' AND tenant_id IS NULL)),
FOREIGN KEY (organization_id,tenant_id) REFERENCES tenants(organization_id,id)
```

- [ ] **Step 4: Run `npm run db:migrate -- --project-id morning-resonance-39210364 --branch auth-onboarding-rehearsal-20261008`, then the schema test twice; confirm migration repeatability and no changed demo rows.**
- [ ] **Step 5: Commit the migration and test:** `git add neon/migrations/0002_onboarding.sql tests/onboarding/schema.test.ts && git commit -m "feat: add onboarding schema"`.

### Task 2: Agency registration and scoped organization

**Files:** Create `src/lib/onboarding/agency.ts`, `src/app/api/account/agency/route.ts`, `src/app/signup/agence/page.tsx`, `src/components/auth/agency-signup-form.tsx`; modify `src/app/page.tsx`; test `tests/onboarding/agency.test.ts`.

**Interfaces:** `createAgency(user: {id:string; email:string; name:string}, agencyName:string, db?: Pool): Promise<{organizationId:string}>`; `requireAgencyManager(userId:string, organizationId:string, db?: Queryable): Promise<Membership>` for Task 3. Reuses `auth.getSession()` and `organization_members`.

- [ ] **Step 1: Test owner rejection, new-agency creation, and retry.** Use a rehearsal database transaction/fake Auth session for the route. Expect a profile `agency_manager`, organization `kind='agency'`, one membership, and identical `organizationId` after retry; an existing owner profile yields 403 with no organization created.

```ts
const first = await createAgency(user, "Agence Kora", db);
expect(first.organizationId).toBeTruthy();
expect((await createAgency(user, "Agence Kora", db)).organizationId).toBe(first.organizationId);
await expect(createAgency(ownerUser, "Intrus", db)).rejects.toMatchObject({code:"FORBIDDEN"});
```

- [ ] **Step 2: Run `npx vitest run tests/onboarding/agency.test.ts`; confirm failure before implementation.**
- [ ] **Step 3: Implement `createAgency` with `BEGIN`, a user-scoped advisory lock, profile-kind check, profile insert, organization insert and membership insert. Implement `requireAgencyManager` by checking both membership role and `organizations.kind='agency'`. The route validates same-origin POST, Auth session, and agency name length (2–120), then calls the service.**

```ts
const {data} = await auth.getSession();
if (!data?.user?.id || !data.user.email) return Response.json({error:"UNAUTHENTICATED"},{status:401});
const result = await createAgency(data.user, agencyName);
return Response.json(result,{status:201});
```

- [ ] **Step 4: Build `/signup/agence` with email/password/name/agency name, call `authClient.signUp.email`, then `/api/account/agency`. Handle the Neon 401/no-session case with an email-verification message. Point the agency CTA in `src/app/page.tsx` at this route. Run the focused test and `npm run typecheck`.**
- [ ] **Step 5: Commit:** `git add src/lib/onboarding/agency.ts src/app/api/account/agency src/app/signup/agence src/components/auth/agency-signup-form.tsx src/app/page.tsx tests/onboarding/agency.test.ts && git commit -m "feat: register agency organizations"`.

### Task 3: Tenant records and invitation issuance

**Files:** Create `src/lib/onboarding/tenants.ts`, `src/lib/onboarding/invitations.ts`, `src/app/api/tenants/route.ts`, `src/app/api/tenants/[id]/route.ts`, `src/app/api/invitations/route.ts`, `src/app/api/invitations/[id]/route.ts`; modify `src/lib/db/owner.ts`; test `tests/onboarding/invitation-issuance.test.ts`.

**Interfaces:** `createTenant(userId:string,input:{fullName:string;email:string;phone?:string},db?:Pool)`; `updateTenantEmail(userId:string,tenantId:string,email:string,db?:Pool)`; `issueInvitation(userId:string,input:{kind:'tenant'|'agency_manager';organizationId:string;tenantId?:string;email?:string},db?:Pool):Promise<{id:string;urlToken:string}>`; `listInvitations(userId:string,organizationId:string)`; `revokeInvitation(userId:string,id:string)`.

- [ ] **Step 1: Test tenant creation only in the actor's organization, no cross-org email update, no invite for a missing-email or linked tenant, no manager invite from an owner organization, and two simultaneous issues leaving one live token.** Use a disposable branch and rollback-created fixtures. Compare `COUNT(*)` of invitations with `revoked_at IS NULL AND accepted_at IS NULL`.

```ts
await expect(issueInvitation(owner,{kind:"tenant",organizationId:agencyOrg,tenantId:agencyTenant},db)).rejects.toMatchObject({code:"FORBIDDEN"});
await Promise.all([issueInvitation(manager,input,db),issueInvitation(manager,input,db)]);
expect((await db.query("SELECT count(*)::int AS n FROM account_invitations WHERE organization_id=$1 AND email=$2 AND revoked_at IS NULL AND accepted_at IS NULL",[org,email])).rows[0].n).toBe(1);
```

- [ ] **Step 2: Run the focused test and confirm it fails.**
- [ ] **Step 3: Implement validation and services.** Normalize email with trim/lowercase, reject malformed email and names outside 2–120 chars, use `requireOrganization` for tenant writes, use `requireAgencyManager` for manager invitation, check tenant `(id,organization_id)` and `auth_user_id IS NULL`, and serialize issue requests with an advisory lock for the organization/kind/email/tenant tuple. Generate 32 random bytes, return base64url token, persist only `createHash('sha256').update(token).digest('hex')`; revoke prior open rows inside the transaction. List metadata without `token_hash`.

```ts
const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
```

- [ ] **Step 4: Routes read the Auth session, call the services, enforce same-origin on mutations, and return invitation URL only in the create response. `PATCH /api/tenants/[id]` only changes the email of an unlinked row; `DELETE /api/invitations/[id]` revokes an open invitation. Extend `listTenants` with `email`, `authUserId`, and invitation status scoped to its organization. Run the test and typecheck.**
- [ ] **Step 5: Commit:** `git add src/lib/onboarding src/app/api/tenants src/app/api/invitations src/lib/db/owner.ts tests/onboarding/invitation-issuance.test.ts && git commit -m "feat: issue scoped tenant and agency invitations"`.

### Task 4: Atomic invitation acceptance

**Files:** Modify `src/lib/onboarding/invitations.ts`; create `src/app/api/invitations/accept/route.ts`; test `tests/onboarding/invitation-acceptance.test.ts`.

**Interfaces:** `previewInvitation(token:string,db?:Queryable):Promise<{kind:string|null;organizationName:string|null;maskedEmail:string|null;state:'open'|'expired'|'used'|'revoked'|'invalid'}>`; `acceptInvitation(user:{id:string;email:string;name:string},token:string,db?:Pool):Promise<{destination:string}>`.

- [ ] **Step 1: Test valid manager/tenant acceptance, identical-user retry, different email, expired/revoked/used/unknown token, profile-role conflict, manager already belonging to another agency, tenant already claimed, and no partial writes after an error.** A tenant test starts with a lease and asserts `getTenantRentals(authId,db)` returns exactly that lease after acceptance. Another test accepts an invitation for an existing tenant profile in a second organization and confirms both histories remain scoped to that identity.

```ts
await expect(acceptInvitation({id:otherId,email:"wrong@example.test",name:"Other"},token,db)).rejects.toMatchObject({code:"EMAIL_MISMATCH"});
expect(await getTenantRentals(tenantAuthId,db)).toHaveLength(1);
expect((await acceptInvitation(tenantUser,token,db)).destination).toBe("/espace-locataire");
```

- [ ] **Step 2: Run the focused test and confirm failure.**
- [ ] **Step 3: Implement hash lookup and `SELECT ... FOR UPDATE` in a transaction.** Check the token format before hashing, then `accepted_at`, `accepted_by_auth_user_id`, `revoked_at`, `expires_at`, normalized Auth email, profile kind, existing memberships, and tenant linkage. Insert or reuse a matching profile, insert membership or set `tenants.auth_user_id`, set accepted timestamp/identity, commit, return destination. The same identity may retry after acceptance; another identity always fails. Preview returns only nonsecret organization and masked email data.

```ts
const tokenHash = createHash("sha256").update(token).digest("hex");
const invitation = await client.query("SELECT * FROM account_invitations WHERE token_hash=$1 FOR UPDATE",[tokenHash]);
if (row.email !== user.email.trim().toLowerCase()) throw new InvitationError("EMAIL_MISMATCH");
```

- [ ] **Step 4: Implement the same-origin `POST /api/invitations/accept` handler and map error codes to 400/401/403/409/410. Run focused tests and typecheck.**
- [ ] **Step 5: Commit:** `git add src/lib/onboarding/invitations.ts src/app/api/invitations/accept/route.ts tests/onboarding/invitation-acceptance.test.ts && git commit -m "feat: activate invitations atomically"`.

### Task 5: Invitation and management screens

**Files:** Create `src/app/invitation/[token]/page.tsx`, `src/components/auth/invitation-accept.tsx`, `src/components/tenants/tenant-form.tsx`, `src/components/invitations/invite-form.tsx`; modify `src/app/tenants/new/page.tsx`, `src/app/tenants/page.tsx`, `src/app/settings/page.tsx`, `src/proxy.ts`, `next.config.ts`; test `tests/auth/protection.test.ts`; add Playwright scenario `tests/e2e/onboarding.spec.ts`.

**Interfaces:** Uses Tasks 2–4 APIs; browser never chooses a role or organization without a server check. `GET /invitation/[token]` uses `previewInvitation` and `cache: no-store` behavior.

- [ ] **Step 1: Extend protection test to include management routes and leave `/invitation/:token` public. Add an end-to-end test: agency signup → manager invite → invite acceptance → agency dashboard; owner invites a tenant tied to an existing lease → tenant history shows only that lease.**

```ts
expect(config.matcher.some((pattern:string)=>pattern.startsWith("/tenants"))).toBe(true);
expect(config.matcher.some((pattern:string)=>pattern.startsWith("/invitation"))).toBe(false);
```

- [ ] **Step 2: Run focused test; capture failing route/UI behavior.**
- [ ] **Step 3: Replace tenant new placeholder with a form calling `POST /api/tenants`; add per-row invite and missing-email edit actions. Add an agency-only manager invitation panel to settings. Show pending invitation metadata and revoke button. Display the generated link once with `navigator.clipboard.writeText` and fallback selectable text.**
- [ ] **Step 4: Build public invitation page with `export const dynamic='force-dynamic'`, masked address, expiry/used states, and sign-in/sign-up with the invited email. Add a `headers()` rule in `next.config.ts` to return `Referrer-Policy: no-referrer` for `/invitation/:path*` and `/reinitialiser-mot-de-passe`. Preserve the invitation URL if Neon signup requires email verification and sign-in. After Auth session exists, call accept endpoint, route to `/dashboard` or `/espace-locataire`. Run tests, typecheck, and the Playwright scenario against the rehearsal branch.**
- [ ] **Step 5: Commit:** `git add src/app/invitation src/components/auth/invitation-accept.tsx src/components/tenants src/components/invitations src/app/tenants src/app/settings/page.tsx src/proxy.ts next.config.ts tests/auth/protection.test.ts tests/e2e/onboarding.spec.ts && git commit -m "feat: complete invitation screens"`.

### Task 6: Password recovery and release verification

**Files:** Create `src/app/mot-de-passe-oublie/page.tsx`, `src/app/reinitialiser-mot-de-passe/page.tsx`, `src/lib/auth/password-recovery.ts`, `src/components/auth/password-recovery.tsx`; modify `src/components/auth/login-form.tsx`, `.env.example`, `docs/ARCHITECTURE.md`; test `tests/auth/password-recovery.test.ts` and `tests/e2e/onboarding.spec.ts`.

**Interfaces:** `requestResetPublicMessage(email:string):Promise<string>` in `src/lib/auth/password-recovery.ts` calls `authClient.requestPasswordReset({email,redirectTo: origin + '/reinitialiser-mot-de-passe'})` and returns the fixed public success text for known/unknown accounts. The reset form calls `authClient.resetPassword({newPassword,token})` from the installed SDK; no application SQL reset token.

- [ ] **Step 1: Test that both login pages offer the recovery link, the request form produces the same public success text for known/unknown emails, invalid/expired reset tokens show an error, and a successful reset returns to login. Mock Neon client calls for the UI tests.**

```ts
const successText = "Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.";
expect(await requestResetPublicMessage("known@example.test")).toBe(successText);
expect(await requestResetPublicMessage("unknown@example.test")).toBe(successText);
```

- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Implement `requestResetPublicMessage` and the two forms with pending/error/success states, URL token parsing, password minimum length eight, and no token logging. Use the installed SDK method signatures, not a custom SQL reset. The `next.config.ts` rule from Task 5 supplies `no-referrer` for the reset page. Add the link under the shared `LoginForm` rendered by both login pages.**
- [ ] **Step 4: Run `npm run typecheck`, `npm test`, and `npm run build`. Test signup, sign-in, sign-out, invitation, and reset in the browser with the rehearsal branch. Verify Neon Auth actually delivers a reset email in production configuration; if delivery is absent, report it as an external blocker and keep a truthful UI. Apply migration to `production` only after rehearsal passes; verify production routes and role separation without printing credentials.**
- [ ] **Step 5: Commit code and docs after fresh verification:** `git add src/app/mot-de-passe-oublie src/app/reinitialiser-mot-de-passe src/lib/auth/password-recovery.ts src/components/auth/password-recovery.tsx src/components/auth/login-form.tsx .env.example docs/ARCHITECTURE.md tests/auth/password-recovery.test.ts tests/e2e/onboarding.spec.ts && git commit -m "feat: add Neon password recovery"`.

## Final acceptance checklist

- [ ] Agency CTA creates an agency organization and one manager membership; owner signup still creates an owner organization.
- [ ] Manager invites only within their agency; owner/manager invites only their own tenant records.
- [ ] Tenant acceptance reveals only the linked tenant's existing leases, dues, and receipts.
- [ ] Used, revoked, expired, foreign-email, and cross-organization invitations cannot grant access.
- [ ] Password reset sends and consumes a Neon Auth link with non-enumerating request UI.
- [ ] `npm run typecheck`, `npm test`, and `npm run build` pass with fresh output; browser scenarios pass on the rehearsal environment.
- [ ] Production migration and deployment are recorded only after all dependent checks and configuration succeed.
