# Action Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make account creation and mutations report success, failure, and required next steps without losing the message during navigation.

**Architecture:** A small client toast host handles transient action results. A typed, one-use sessionStorage message bridges signup redirects to either login or dashboard. Important next steps remain inline on the page.

**Tech Stack:** Next.js 16 App Router, React 19, `react-hot-toast`, Neon Auth, Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-09-action-feedback-dashboard-invitation-email-design.md`

## Global Constraints

- Preserve server-side session and role checks; client notices never grant access.
- Keep form errors inline with `role="alert"` and do not rely on toast alone for verification or recovery instructions.
- Never store passwords, invitation tokens, or auth cookies in the flash message.
- Read `node_modules/next/dist/docs/01-app/02-guides/redirecting.md` before changing navigation behavior.
- Run browser mutations against the Neon rehearsal branch, not the local server targeting production.

## Review Focus

1. A successful signup is redirected to `/login`: Task 2 checks the one-use confirmation appears there.
2. A signup creates an identity but has no session: Task 2 checks the page displays verification and sign-in steps.
3. A bootstrap request fails after Auth succeeds: Task 2 checks that the UI says the account exists and offers recovery rather than suggesting a second account.
4. Reopening `/login` later: Task 2 checks the flash is consumed and does not reappear.
5. A failed tenant or invitation mutation: Task 3 checks the error remains beside the form and no success toast appears.

## File map

- `src/components/feedback/toast-host.tsx`: one client toaster with accessible colors and duration.
- `src/lib/feedback/signup-flash.ts`: typed one-use sessionStorage message.
- `src/app/layout.tsx`: mount the toast host once.
- `src/components/auth/signup-form.tsx`, `agency-signup-form.tsx`, `invitation-accept.tsx`: explicit next steps and success flash.
- `src/components/auth/login-form.tsx`, `src/components/app-shell.tsx`: consume the flash after a redirect.
- `src/components/tenants/tenant-form.tsx`, `src/components/invitations/invite-form.tsx`: toast for completed mutations while keeping inline errors.
- `tests/e2e/action-feedback.spec.ts`, `tests/feedback/signup-flash.test.ts`: focused behavior checks.

---

### Task 1: Shared toast host and one-use flash

**Files:** Create `src/components/feedback/toast-host.tsx`, `src/lib/feedback/signup-flash.ts`, `tests/feedback/signup-flash.test.ts`; modify `src/app/layout.tsx`, `package.json`, `package-lock.json`.

**Interfaces:** `rememberSignupFlash({kind,email,step}: SignupFlash): void`; `takeSignupFlash(): SignupFlash | null`; `SignupFlash = {kind:"owner"|"agency"|"tenant"|"agency_manager";email:string;step:"created"|"verify_email"|"finish_setup"}`. The helper is browser-only and returns null for missing, malformed, or older data.

- [ ] **Step 1: Write a failing storage test.** Stub `sessionStorage`, save a flash and read it twice. Assert the first read equals the saved object and the second is null; malformed JSON must return null without throwing.

```ts
rememberSignupFlash({kind:"owner",email:"test@example.com",step:"verify_email"});
expect(takeSignupFlash()).toEqual({kind:"owner",email:"test@example.com",step:"verify_email"});
expect(takeSignupFlash()).toBeNull();
```

- [ ] **Step 2: Run `npx vitest run tests/feedback/signup-flash.test.ts`; confirm it fails because the module does not exist.**
- [ ] **Step 3: Add `react-hot-toast` with `npm install react-hot-toast`, implement the helper using one stable storage key, and mount `<Toaster position="top-right" />` in a client `ToastHost` from the root layout. Use distinct success/error/info styles and keep live-region behavior from the library.**

```ts
const key = "immopay.signup-flash.v1";
const kinds = ["owner","agency","tenant","agency_manager"];
const steps = ["created","verify_email","finish_setup"];
function parseSignupFlash(value: unknown): SignupFlash | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string,unknown>;
  return kinds.includes(String(item.kind)) && steps.includes(String(item.step))
    && typeof item.email === "string" && item.email.includes("@")
      ? {kind:item.kind as SignupFlash["kind"],email:item.email,step:item.step as SignupFlash["step"]} : null;
}
export function rememberSignupFlash(value: SignupFlash) { sessionStorage.setItem(key, JSON.stringify(value)); }
export function takeSignupFlash(): SignupFlash | null {
  const raw = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  if (!raw) return null;
  try { return parseSignupFlash(JSON.parse(raw)); } catch { return null; }
}
```

`ToastHost` renders `<Toaster position="top-right" toastOptions={{duration: 5000}} />`.
- [ ] **Step 4: Run the focused test and `npm run typecheck`; confirm both pass.**
- [ ] **Step 5: Commit:** `git add package.json package-lock.json src/app/layout.tsx src/components/feedback src/lib/feedback tests/feedback && git commit -m "feat: add action feedback host"`.

### Task 2: Account creation messages survive redirects

**Files:** Modify `src/components/auth/signup-form.tsx`, `agency-signup-form.tsx`, `invitation-accept.tsx`, `login-form.tsx`, `src/components/app-shell.tsx`; create `tests/e2e/action-feedback.spec.ts`.

**Interfaces:** Consume `rememberSignupFlash` and `takeSignupFlash` from Task 1. `LoginForm` displays an inline status with a clear action; `AppShell` consumes successful signup on dashboard and emits one success toast.

- [ ] **Step 1: Write browser checks on the rehearsal server.** Seed a valid flash in sessionStorage before `/login` and assert a visible `role=status` confirmation; reload and assert it is gone. Exercise owner signup with a fresh `@immopay.test` address while forcing `/api/account/bootstrap` to return 401; assert the signup page retains a success message, the email, and a sign-in link. A second case forces a 500 bootstrap response and asserts a distinct “account created, setup incomplete” message.

```ts
await page.goto("/login");
await page.evaluate(() => sessionStorage.setItem("immopay.signup-flash.v1", JSON.stringify({kind:"owner",email:"test@example.com",step:"created"})));
await page.reload();
await expect(page.getByRole("status")).toContainText("Compte créé");
await page.reload();
await expect(page.getByRole("status")).toHaveCount(0);
```

- [ ] **Step 2: Run `npx playwright test tests/e2e/action-feedback.spec.ts`; confirm failure on the missing confirmation.**
- [ ] **Step 3: In each signup success path, remember the typed outcome before navigating. For a 401, keep a persistent success panel and sign-in link on the current page; for a non-401 bootstrap failure, state that the account exists but setup needs completion. Let `LoginForm` consume the flash and show the email and next step; let `AppShell` consume it on successful dashboard navigation and show a success toast. Keep invitation URL in its existing page state for invited users.**

```ts
rememberSignupFlash({kind:"owner",email,step:"created"});
if (response.status === 401) {
  setNotice(`Compte créé pour ${email}. Vérifiez votre email, puis connectez-vous.`);
  return;
}
if (!response.ok) {
  setError(`Le compte ${email} existe, mais son espace reste à terminer. Connectez-vous pour reprendre.`);
  return;
}
router.replace("/dashboard");
```

The agency and invitation forms choose their own kind; the login and dashboard consumers call `takeSignupFlash()` once in `useEffect`, so only the actual destination displays it.
- [ ] **Step 4: Run focused Playwright, `npm run typecheck`, and the existing owner/agency/tenant signup e2e tests on the rehearsal branch.**
- [ ] **Step 5: Commit:** `git add src/components/auth src/components/app-shell.tsx tests/e2e/action-feedback.spec.ts && git commit -m "fix: explain account creation after redirect"`.

### Task 3: Action results for the existing mutation forms

**Files:** Modify `src/components/tenants/tenant-form.tsx`, `src/components/invitations/invite-form.tsx`, `src/components/auth/password-recovery.tsx`, `tests/e2e/action-feedback.spec.ts`.

**Interfaces:** Use `toast.success`, `toast.error`, or `toast` only after the server response is classified. Inline `role=alert` remains authoritative for a failed form submission. Invitation delivery states are added by the separate email plan.

- [ ] **Step 1: Add a browser check that a successful tenant create reports success after returning to `/tenants`, while a rejected invitation POST leaves its inline alert visible and never displays the success toast.** Use a fresh rehearsal tenant and intercept the rejected request.
- [ ] **Step 2: Run the focused browser check and confirm it fails on the missing success feedback.**
- [ ] **Step 3: Add success toasts for tenant creation, invitation create/copy/revoke, and password reset request; add error toasts only where they clarify a failed network action, preserving inline errors. Before tenant navigation, set `sessionStorage.setItem("immopay.tenant-created.v1","1")`; a `useEffect` in the existing client `AppShell` consumes that key on `/tenants` and calls `toast.success("Locataire ajouté")`. Never emit success before `response.ok`.**

```ts
if (!response.ok) { setError("Impossible d’ajouter ce locataire."); return; }
sessionStorage.setItem("immopay.tenant-created.v1", "1");
router.replace("/tenants");
```
- [ ] **Step 4: Run focused browser checks, `npm run typecheck`, and `npm run build`.**
- [ ] **Step 5: Commit:** `git add src/components/tenants src/components/invitations src/components/auth/password-recovery.tsx tests/e2e/action-feedback.spec.ts && git commit -m "feat: confirm user actions"`.
