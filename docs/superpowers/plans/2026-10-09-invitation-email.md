# Invitation Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send tenant and agency-manager invitations through Resend when configured, and always report a truthful delivery state with a usable manual link.

**Architecture:** Keep invitation authorization and token creation in PostgreSQL. The API sends the just-created link through a server-only transport, records the provider's acceptance state, and returns the link plus delivery state. Missing or failed email configuration leaves the invitation usable through the existing copy flow.

**Tech Stack:** Next.js 16 App Router, Neon PostgreSQL via `pg`, Resend Email API over `fetch`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-09-action-feedback-dashboard-invitation-email-design.md`

## Global Constraints

- An email is sent only after `issueInvitation` checks the caller's session, organization, and role.
- Never log or persist the raw invitation token; only its existing SHA-256 hash remains in PostgreSQL.
- The invitation link is returned once in the creation response even when delivery is unavailable.
- `sent` means accepted by the provider, not delivered to the destination inbox.
- Do not transmit real email until `RESEND_API_KEY`, `INVITATION_FROM_EMAIL`, and the verified sender domain are configured.
- Neon Auth verification and reset mail require separate Neon provider setup.
- Apply the migration first on the disposable Neon rehearsal branch, then on production before deploying the code.

## Review Focus

1. No Resend key or sender address: Task 2 returns `not_configured`, creates one valid invitation, and exposes the copy link.
2. Provider timeout or rejection: Task 2 returns `failed` without 500, preserves the valid link, and records failure.
3. Unauthorized caller: Task 3 confirms no invitation and no provider call.
4. Two invitation requests for one recipient: Task 3 confirms the old token is revoked and the UI warns about the older email.
5. A provider accepts but the response is repeated: Task 2 uses an invitation-ID idempotency key and sends at most one accepted email for the same invitation.

## File map

- `neon/migrations/0003_invitation_email.sql`: delivery state and provider-acceptance timestamp on `account_invitations`.
- `src/lib/email/invitation-email.ts`: server-only Resend transport, timeout, text template, and idempotency header.
- `src/lib/onboarding/invitations.ts`: return recipient and organization name with a newly created invitation; update delivery metadata by invitation ID.
- `src/app/api/invitations/route.ts`: call the transport after creation and return `delivery` beside the one-time link.
- `src/components/invitations/invite-form.tsx`: distinct sent, failed, and unconfigured messages with copy fallback.
- `src/app/tenants/page.tsx`, `src/app/settings/page.tsx`: show stored delivery state for pending invitations.
- `.env.example`, `docs/ARCHITECTURE.md`: provider variables, domain and Neon Auth separation.
- `tests/email/invitation-email.test.ts`, `tests/onboarding/invitation-delivery.test.ts`, `tests/e2e/onboarding.spec.ts`: transport, authorization, and browser states.

---

### Task 1: Delivery-state schema

**Files:** Create `neon/migrations/0003_invitation_email.sql`, `tests/onboarding/invitation-delivery.test.ts`.

**Interfaces:** `account_invitations.email_delivery_status` is `not_configured | sent | failed` with default `not_configured`; `email_accepted_at timestamptz` is non-null only for `sent`. The migration must leave existing invitations as `not_configured`.

- [ ] **Step 1: On the rehearsal branch, write a failing schema test.** Query `information_schema.columns` for the new columns and default, then query `pg_constraint` for the check. For an invalid-status probe, open a transaction, create a rehearsal invitation through the existing authorized fixture, attempt the update, and roll back. Do not assume the table already contains a row.

```ts
const columns = await db.query("SELECT column_name,column_default FROM information_schema.columns WHERE table_name='account_invitations' AND column_name IN ('email_delivery_status','email_accepted_at')");
expect(columns.rows).toHaveLength(2);
expect(columns.rows.find(row=>row.column_name==='email_delivery_status')?.column_default).toContain('not_configured');
```

- [ ] **Step 2: Run `NEON_BRANCH=auth-onboarding-rehearsal-20261008 npx vitest run tests/onboarding/invitation-delivery.test.ts`; confirm the missing-column failure.**
- [ ] **Step 3: Add `ALTER TABLE account_invitations ADD COLUMN ...` for the status and timestamp, plus a check restricting status and timestamp consistency. Do not backfill `sent` for existing rows.**

```sql
ALTER TABLE account_invitations
  ADD COLUMN email_delivery_status text NOT NULL DEFAULT 'not_configured',
  ADD COLUMN email_accepted_at timestamptz;
ALTER TABLE account_invitations ADD CONSTRAINT account_invitations_email_delivery_check
  CHECK (email_delivery_status IN ('not_configured','sent','failed')
    AND ((email_delivery_status = 'sent') = (email_accepted_at IS NOT NULL)));
```

- [ ] **Step 4: Run `npm run db:migrate -- --project-id morning-resonance-39210364 --branch auth-onboarding-rehearsal-20261008`, then the focused test twice; confirm rerunning the migration is a no-op.**
- [ ] **Step 5: Commit:** `git add neon/migrations/0003_invitation_email.sql tests/onboarding/invitation-delivery.test.ts && git commit -m "feat: track invitation email state"`.

### Task 2: Server-only provider with manual fallback

**Files:** Create `src/lib/email/invitation-email.ts`, `tests/email/invitation-email.test.ts`; modify `src/lib/onboarding/invitations.ts`, `src/app/api/invitations/route.ts`, `tests/onboarding/invitation-issuance.test.ts`.

**Interfaces:** `sendInvitationEmail(input:{id:string;to:string;url:string;organizationName:string;kind:"tenant"|"agency_manager"}, fetcher?:typeof fetch): Promise<"sent"|"not_configured"|"failed">`; `markInvitationDelivery(id:string,status:"sent"|"not_configured"|"failed",db?:Queryable):Promise<void>`; `issueInvitation` additionally returns `email` and `organizationName` to the route. The route response remains `{id,url,delivery}`.

- [ ] **Step 1: Write failing transport tests.** With missing environment, expect `not_configured` and zero fetch calls. With a fake 200 from Resend, expect `sent`, POST to `https://api.resend.com/emails`, and `Idempotency-Key: invitation/<id>`. With a rejection or abort, expect `failed` and no thrown error. Assert the request body has the recipient and link but no secret in the response/logs.

```ts
expect(await sendInvitationEmail(input, fakeFetch)).toBe("sent");
expect(fakeFetch).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({method:"POST"}));
```

- [ ] **Step 2: Run `npx vitest run tests/email/invitation-email.test.ts`; confirm missing-module failure.**
- [ ] **Step 3: Implement the server-only module using `fetch` with `AbortSignal.timeout(8000)`, `Authorization: Bearer`, JSON `{from,to,subject,text}`, and the invitation-ID idempotency header. Build the French text email without interpolating HTML. Return `not_configured` when either variable is absent; catch HTTP/network failure as `failed`.**

```ts
const key = process.env.RESEND_API_KEY;
const from = process.env.INVITATION_FROM_EMAIL;
if (!key || !from) return "not_configured";
const response = await fetcher("https://api.resend.com/emails", {
  method:"POST", signal:AbortSignal.timeout(8000),
  headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json","Idempotency-Key":`invitation/${input.id}`},
  body:JSON.stringify({from,to:input.to,subject:"Votre invitation ImmoPay",text:emailText(input)}),
});
return response.ok ? "sent" : "failed";
```

`emailText(input)` is a private function that includes the organization name, the invitation URL, and the seven-day expiry statement. Catch fetch/abort errors around this block and return `failed`.
- [ ] **Step 4: Extend `issueInvitation` to select the authorized organization's name and return the normalized destination email. The route constructs the URL from its own origin, invokes the transport after the transaction commits, persists the state and provider-acceptance time by invitation ID, then returns `{id,url,delivery}`. If the status update fails, return the actual transport result and log only the invitation ID and error category. Never retry the email by creating another invitation in this request.**

```ts
const invitation = await issueInvitation(data.user.id, input);
const url = `${new URL(request.url).origin}/invitation/${invitation.urlToken}`;
const delivery = await sendInvitationEmail({id:invitation.id,to:invitation.email,url,organizationName:invitation.organizationName,kind:input.kind});
await markInvitationDelivery(invitation.id, delivery);
return Response.json({id:invitation.id,url,delivery},{status:201});
```

Wrap only `markInvitationDelivery` in a narrow catch so a metadata write failure does not turn a created invitation into a misleading 500 response.
- [ ] **Step 5: Run focused transport and invitation-issuance tests, `npm run typecheck`, and `npm run build`.**
- [ ] **Step 6: Commit:** `git add src/lib/email src/lib/onboarding/invitations.ts src/app/api/invitations/route.ts tests/email tests/onboarding/invitation-issuance.test.ts && git commit -m "feat: send invitations with a safe fallback"`.

### Task 3: Distinct UI outcomes and authorization regression

**Files:** Modify `src/components/invitations/invite-form.tsx`, `src/app/tenants/page.tsx`, `src/app/settings/page.tsx`, `src/lib/onboarding/invitations.ts`, `tests/onboarding/invitation-issuance.test.ts`, `tests/e2e/onboarding.spec.ts`.

**Interfaces:** `InvitationListItem` gains `emailDeliveryStatus` and `emailAcceptedAt`; the create UI reads `delivery` from Task 2 and always keeps the one-time link visible until navigation.

- [ ] **Step 1: Add tests:** `sent` shows “Email accepté pour envoi” without claiming inbox delivery; `failed` and `not_configured` show “Email non envoyé” and the copy button. The API integration test asserts a caller from another organization receives 403 and `sendInvitationEmail` is not called. A second invite makes the previous token invalid and displays a warning about the older email.
- [ ] **Step 2: Run focused tests and confirm the delivery-copy assertions fail before UI changes.**
- [ ] **Step 3: Render the delivery status under each pending invitation on tenant and agency pages. Change `InviteForm` to announce the actual response state with inline `role=status` and optional toast, keep the URL and copy control for all states, and warn before making a new link when an invitation is pending. Keep revoke feedback truthful.**

```tsx
{url && <p role="status">{delivery==="sent" ? "Email accepté pour envoi." : "Email non envoyé. Copiez le lien pour le transmettre."}</p>}
{url && <input readOnly aria-label="Lien d’invitation" value={url} />}
```
- [ ] **Step 4: Run focused Vitest and Playwright on the rehearsal branch, then `npm run typecheck` and `npm run build`.**
- [ ] **Step 5: Commit:** `git add src/components/invitations/invite-form.tsx src/app/tenants/page.tsx src/app/settings/page.tsx src/lib/onboarding/invitations.ts tests/onboarding tests/e2e/onboarding.spec.ts && git commit -m "feat: show invitation delivery outcomes"`.

### Task 4: Configuration and production rollout

**Files:** Modify `.env.example`, `docs/ARCHITECTURE.md`.

**Interfaces:** `RESEND_API_KEY` and `INVITATION_FROM_EMAIL` are server-only variables. No variable value appears in Git.

- [ ] **Step 1: Document the sender domain verification, the two variables, the manual fallback, and that Neon Auth verification/reset emails require a separate email-provider setup.** Add empty names to `.env.example`.

```dotenv
RESEND_API_KEY=
INVITATION_FROM_EMAIL=
```
- [ ] **Step 2: Run `git diff --check`, `npm test`, `npm run typecheck`, and `npm run build` with rehearsal configuration; verify no secrets or raw invitation links are in the diff.**
- [ ] **Step 3: Commit:** `git add .env.example docs/ARCHITECTURE.md && git commit -m "docs: configure invitation email"`.
- [ ] **Step 4: Apply migration `0003` to Neon production only after the rehearsal run is green. Configure the verified domain and server variables in Vercel if available, deploy the code, then confirm the new route response and UI on the public site without sending to a real recipient until the sender is verified. If configuration is unavailable, deploy the manual fallback and report that automatic email remains inactive.**
