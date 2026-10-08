# Neon Auth and Demo Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give owners, agency managers, and tenants email/password access to correctly scoped, persistent demonstration data on Neon `production`.

**Architecture:** Neon Auth owns identities and sessions. Next.js server code owns authorization and SQL access to app tables. A versioned SQL migration and an idempotent seed create fictional business records; Auth users are provisioned separately and linked by ID.

**Tech Stack:** Next.js 16, React 19, TypeScript, `@neondatabase/auth`, PostgreSQL on Neon, `pg` with pooled application access and a direct migration connection, Vitest for authorization tests, Playwright for browser verification.

**Spec:** `docs/superpowers/specs/2026-10-08-neon-auth-demo-data-design.md`

## Global Constraints

- Project `morning-resonance-39210364`, Neon branch `production`; seed directly there only after a branch rehearsal.
- Public signup can assign only a new personal `owner` membership. Manager and tenant roles are provisioned or invited server-side.
- Passwords and database/Auth secrets never enter Git, SQL migrations, screenshots, or logs.
- Every private read checks a server session and scopes SQL by an authorized organization or the signed-in tenant ID.
- Existing marketing device captures remain static illustrations.
- Real payments, property creation, invitations, and PDF generation are outside this first block; corresponding controls must not falsely claim persistence.

## Review Focus

- An anonymous direct request to a private page or data handler returns a redirect or `401`, never fixture data (Tasks 1 and 3).
- A signed-in owner passing another organization's ID still receives no rows (Task 3).
- A tenant tied to two organizations sees only their own leases and receipts across both, while another tenant sees none (Task 3).
- A repeated seed run leaves counts and references unchanged (Task 2).
- An unknown receipt code returns an unavailable state, never “authentic” (Task 6).

## File map

- `neon.ts`, `package.json`, `package-lock.json`: enable Managed Auth and Next.js 16 compatible dependencies.
- `src/lib/auth/server.ts`, `src/lib/auth/client.ts`, `src/app/api/auth/[...path]/route.ts`, `src/proxy.ts`: session plumbing and private-route redirects.
- `neon/migrations/0001_core.sql`, `scripts/migrate.mjs`, `scripts/seed-demo.mjs`, `scripts/provision-demo.mjs`: schema, version tracking, fictional data, and Auth account linkage.
- `src/lib/db/pool.ts`, `src/lib/db/access.ts`, `src/lib/db/owner.ts`, `src/lib/db/tenant.ts`: one database connection and explicit authorization boundaries.
- `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/espace-locataire/connexion/page.tsx`, `src/components/auth/*`: actual forms, redirects, and logout.
- `src/app/dashboard/page.tsx`, `src/app/properties/page.tsx`, `src/app/tenants/page.tsx`, `src/app/dues/page.tsx`, `src/app/payments/page.tsx`, `src/app/espace-locataire/**/page.tsx`, `src/app/verify/[code]/page.tsx`: data-backed read screens and truthful inactive actions.
- `tests/auth/*.test.ts`, `tests/db/*.test.ts`, `tests/e2e/*.spec.ts`: session, isolation, seed, and browser checks.
- `.env.example`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`: required configuration and actual completion state.

---

### Task 1: Compatible Auth foundation

**Files:** Modify `package.json`, `package-lock.json`, `neon.ts`; create `src/lib/auth/server.ts`, `src/lib/auth/client.ts`, `src/app/api/auth/[...path]/route.ts`, `src/proxy.ts`, `tests/auth/protection.test.ts`.

**Interfaces:** Produces `auth` (server), `authClient` (browser), and `requireSession()` returning the authenticated Neon user ID. Later tasks call `requireSession()` before any SQL.

- [ ] **Step 1: Write a failing protection test.** In `tests/auth/protection.test.ts`, assert that an unauthenticated `/dashboard` request redirects to `/login` and `/espace-locataire` redirects to `/espace-locataire/connexion`; assert `/` and `/api/auth/session` remain public. Use the test runner chosen for the repo and document its command in `package.json`.

```ts
expect(await visitAsGuest("/dashboard")).toEqual({status: 307, location: "/login"});
expect(await visitAsGuest("/espace-locataire")).toEqual({status: 307, location: "/espace-locataire/connexion"});
expect(await visitAsGuest("/")).toMatchObject({status: 200});
```
- [ ] **Step 2: Run the single test.** Expected: FAIL because `src/proxy.ts` and session handling do not exist.
- [ ] **Step 3: Upgrade Next.js to a version satisfying `@neondatabase/auth`'s `next >=16.0.0` peer; add the SDK, merge `auth: true` into the existing Neon config, implement the auth handler and narrowly matched proxy.** Create a disposable Neon branch cloned from `production`, enable Auth there first, and use that branch's Auth URL for local tests. Use the documented `createNeonAuth({baseUrl: process.env.NEON_AUTH_BASE_URL!, cookies:{secret:process.env.NEON_AUTH_COOKIE_SECRET!}})` on the server and `createAuthClient()` in the browser. Keep `/login`, `/signup`, `/api/auth`, assets, and marketing pages outside the matcher.

```ts
// src/lib/auth/server.ts
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {secret: process.env.NEON_AUTH_COOKIE_SECRET!},
});
// src/proxy.ts — narrow matcher for /dashboard, /properties, /tenants,
// /dues, /payments, /receipts, /reports, /settings, and /espace-locataire.
```
- [ ] **Step 4: Run the protection test, `npm run typecheck`, and `npm run build`.** Expected: all pass. If SDK or Next APIs differ from the spec's examples, use the installed types and record the exact compatibility ruling.
- [ ] **Step 5: Commit.** `git commit -m "feat: add Neon Auth session foundation"`.

### Task 2: Versioned schema and repeatable demonstration seed

**Files:** Create `neon/migrations/0001_core.sql`, `scripts/migrate.mjs`, `scripts/seed-demo.mjs`, `scripts/provision-demo.mjs`, `tests/db/seed.test.ts`; modify `package.json`, `.env.example`.

**Interfaces:** Produces tables `profiles`, `organizations`, `organization_members`, `properties`, `units`, `tenants`, `leases`, `rent_dues`, `payments`, `receipts` and a `schema_migrations` record. `seedDemo(client)` returns stable fixture IDs and does not create Auth passwords. `provision-demo` links Auth IDs to fixture profiles after account creation.

- [ ] **Step 1: Write a failing seed test on a disposable Neon branch.** Run `seedDemo` twice and compare `SELECT count(*)` for each demo table and unique receipt references. Assert the second run changes neither counts nor existing amounts. Expected: FAIL before the migration and seed exist.

```ts
const first = await snapshotDemoRows(db);
await seedDemo(db);
const second = await snapshotDemoRows(db);
expect(second).toEqual(first);
```
- [ ] **Step 2: Write the migration with UUID keys, foreign keys, organization consistency constraints, nonnegative integer amounts, unique receipt codes, and indexes on scope keys.** Adapt the historical `supabase/migrations` business columns; do not execute their `auth.users` foreign keys or `auth.uid()` policies against Neon.

```sql
CREATE TABLE profiles (
  auth_user_id text PRIMARY KEY,
  full_name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('owner','agency_manager','tenant'))
);
CREATE TABLE organization_members (
  organization_id uuid NOT NULL REFERENCES organizations(id),
  auth_user_id text NOT NULL REFERENCES profiles(auth_user_id),
  role text NOT NULL CHECK (role IN ('owner','agency_manager')),
  PRIMARY KEY (organization_id, auth_user_id)
);
```
- [ ] **Step 3: Implement `migrate.mjs` using `DATABASE_URL_UNPOOLED`, a migration ledger and transaction per migration; implement `seed-demo.mjs` with fixed fictitious IDs or stable natural keys and `ON CONFLICT` updates constrained to demo-owned records.** Refuse to run if the target project/branch does not match explicit script arguments. `provision-demo.mjs` calls Managed Auth `signUp.email` for three fictional addresses using passwords from environment or a secure prompt, captures returned Auth IDs, then links them to fixture profiles. It must not print passwords or put them in SQL.

```sql
INSERT INTO organizations (id, name, currency, is_demo)
VALUES ('10000000-0000-4000-8000-000000000001', 'Résidence Démo', 'XOF', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
WHERE organizations.is_demo = true;
```
- [ ] **Step 4: Run the migration and seed twice on a temporary branch; run the seed test.** Expected: schema exists; both runs pass; counts and receipt references are stable. Record the branch ID and row counts without connection strings.
- [ ] **Step 5: Commit.** `git commit -m "feat: add Neon schema and idempotent demo seed"`.

### Task 3: Server-side role and tenant isolation

**Files:** Create `src/lib/db/pool.ts`, `src/lib/db/access.ts`, `src/lib/db/owner.ts`, `src/lib/db/tenant.ts`, `tests/db/access.test.ts`; modify `src/lib/auth/server.ts` only if necessary for `requireSession()`.

**Interfaces:** `requireOrganization(userId, organizationId)` returns an authorized `{organizationId, role}` or throws a typed forbidden error. `listOwnerDashboard(userId, organizationId)` and related list functions always use it. `getTenantHome(userId)` joins through `tenants.auth_user_id` and returns only that account's records. No repository function accepts an arbitrary user ID from browser input.

- [ ] **Step 1: Write failing integration tests against the temporary branch.** Seed two distinct organizations and two tenant Auth IDs; assert owner A cannot pass org B to `requireOrganization`, manager B cannot read org A, tenant A sees their own leases across two orgs, and tenant B sees none of tenant A's records. Expected: FAIL because repositories do not exist.

```ts
await expect(requireOrganization(ownerA, orgB)).rejects.toMatchObject({code: "FORBIDDEN"});
expect(await getTenantReceipts(tenantA)).toHaveLength(2);
expect(await getTenantReceipts(tenantB)).toHaveLength(0);
```
- [ ] **Step 2: Implement a server-only pooled database connector and parameterized queries.** For example, authorize with `SELECT role FROM organization_members WHERE organization_id=$1 AND auth_user_id=$2`; return forbidden when absent. Join tenant tables on authenticated ID and preserve organization equality on all related records.

```ts
const membership = await db.query(
  "SELECT role FROM organization_members WHERE organization_id=$1 AND auth_user_id=$2",
  [organizationId, userId],
);
if (membership.rowCount !== 1) throw new AccessError("FORBIDDEN");
```
- [ ] **Step 3: Run the isolation tests, then typecheck.** Expected: tests pass and TypeScript passes. Add a direct unauthenticated handler test if any data handler is introduced.
- [ ] **Step 4: Commit.** `git commit -m "feat: enforce scoped Neon data access"`.

### Task 4: Real login, signup, tenant entry, and logout

**Files:** Modify `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/components/app-shell.tsx`, `src/components/tenant-shell.tsx`; create `src/app/espace-locataire/connexion/page.tsx`, `src/components/auth/login-form.tsx`, `src/components/auth/signup-form.tsx`, `tests/e2e/auth.spec.ts`.

**Interfaces:** Login and signup use `authClient.signIn.email` / `signUp.email`; after successful signup, a server action or handler creates the profile and owner organization idempotently using the session ID, not a client-provided role. Logout calls `authClient.signOut()` and navigates to `/`.

- [ ] **Step 1: Write browser tests for wrong password, successful login, reload preserving session, logout, tenant entry, and owner signup with no ability to choose manager role.** Expected: FAIL on current inert forms.

```ts
await page.goto("/login");
await page.getByLabel("Email").fill(ownerEmail);
await page.getByLabel("Mot de passe").fill(ownerPassword);
await page.getByRole("button", {name: "Se connecter"}).click();
await expect(page).toHaveURL(/\/dashboard$/);
await page.reload();
await expect(page.getByText("Résidence Démo")).toBeVisible();
```
- [ ] **Step 2: Implement forms with pending/error states, validated redirect target restricted to local paths, and the server-side owner bootstrap.** A signup request that is retried must not create two organizations. If email verification is required, show that state and bootstrap after the first verified session. An authenticated tenant entering `/dashboard` must be redirected or forbidden; an owner entering tenant pages likewise.

```ts
const result = await authClient.signIn.email({email, password});
if (result.error) setError(result.error.message ?? "Connexion impossible");
else router.replace(safeLocalReturnTo ?? "/dashboard");
```
- [ ] **Step 3: Run browser tests and typecheck.** Expected: each supported flow passes using the temporary branch's test accounts.
- [ ] **Step 4: Commit.** `git commit -m "feat: connect account and tenant login flows"`.

### Task 5: Persistent private read screens

**Files:** Modify `src/app/dashboard/page.tsx`, `src/app/properties/page.tsx`, `src/app/tenants/page.tsx`, `src/app/dues/page.tsx`, `src/app/payments/page.tsx`, `src/app/espace-locataire/page.tsx`, `src/app/espace-locataire/historique/page.tsx`, `src/app/espace-locataire/quittances/page.tsx`, relevant shells; create `tests/e2e/scoped-screens.spec.ts`.

**Interfaces:** Pages call Task 3 repositories after `requireSession()`. List functions return typed records plus an empty array, never a global fixture fallback. Agency pages show the currently authorized organization.

- [ ] **Step 1: Write failing browser checks for owner, agency manager, tenant, and a newly registered empty owner.** Assert visible names and amounts equal the seeded records; assert empty owner sees an empty state and no other organization's names. Expected: FAIL because current pages use constants from `src/lib/demo/*`.

```ts
await loginAs(page, managerAccount);
await page.goto("/properties");
await expect(page.getByText("Résidence Démo")).toBeVisible();
await expect(page.getByText("Autre organisation démo")).toHaveCount(0);
```
- [ ] **Step 2: Convert each private read page to server data and keep interactive filters in small client components fed with scoped props.** Show a precise empty state. Disable or label buttons whose write operations are outside this block; do not show a fake “payment confirmed” message.

```ts
const userId = await requireSession();
const organization = await requireOrganization(userId, selectedOrganizationId);
const properties = await listProperties(organization.organizationId);
```
- [ ] **Step 3: Run browser checks, direct role-access checks, typecheck and build.** Expected: all pass.
- [ ] **Step 4: Commit.** `git commit -m "feat: render scoped Neon data in private spaces"`.

### Task 6: Receipt verification and production rollout

**Files:** Modify `src/app/verify/[code]/page.tsx`, `.env.example`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`; create `tests/e2e/receipt-verification.spec.ts`.

**Interfaces:** `findReceiptByCode(code)` returns public-safe verification fields or `null`; page never treats an arbitrary path value as authentic.

- [ ] **Step 1: Write a failing test for a known seeded receipt and an unknown code.** Expected: unknown code incorrectly says “Quittance authentique” before the fix.

```ts
await page.goto("/verify/NO-SUCH-RECEIPT");
await expect(page.getByText("Quittance introuvable")).toBeVisible();
await expect(page.getByText("Quittance authentique")).toHaveCount(0);
```
- [ ] **Step 2: Query the receipt by unique code and render only its public verification fields; render an unavailable state for unknown codes.** Update environment documentation with `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET`, without values.

```ts
const result = await db.query(
  "SELECT public_code, issued_at FROM receipts WHERE public_code=$1 LIMIT 1",
  [code],
);
const receipt = result.rows[0] ?? null;
```
- [ ] **Step 3: Run verification tests, isolation tests, typecheck, build, and `git diff --check`.** Expected: all pass; no secret pattern occurs in staged files.
- [ ] **Step 4: Commit the final public verification and documentation changes.** `git commit -m "feat: verify persisted receipts and document Neon rollout"`.
- [ ] **Step 5: Confirm both Vercel projects have server variables and trusted domains.** Enable Auth and deploy Neon config; apply tested migration and seed to Neon `production`; provision demo Auth accounts with noncommitted passwords; deploy the committed app. Verify both Vercel production deployments and the three browser roles against them. If environment access is absent, leave the code ready and report the exact missing access without inventing a successful rollout.

## Final verification

Run the entire relevant test suite, `npm run typecheck`, `npm run build`, and `git diff --check` after the last change. Confirm no tracked secrets, no stale demo-only claims on protected screens, and a clean Git status. Report separately the code result, migration result, demo account result, and production deployment result; never infer one from another.
