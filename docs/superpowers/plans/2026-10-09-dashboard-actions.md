# Dashboard Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing owner and agency dashboard easier to scan and provide clear routes to working actions.

**Architecture:** Keep the server query and authorization intact. Add small presentational components for metric cards and quick links, using Lucide icons and the existing brand tokens. Only link to working destinations.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 3, Lucide React, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-09-action-feedback-dashboard-invitation-email-design.md`

## Global Constraints

- Preserve the values from `getOwnerDashboard` and the `requireOwnerPage()` gate.
- `/properties/new` and `/payments/new` are placeholders; do not use them as action targets.
- Keep the dashboard readable on mobile and desktop, with text labels alongside icon-only decoration.
- Do not add new payment or property creation claims.

## Review Focus

1. An organization with no dues: Task 1 checks that the next-due card gives a useful, truthful empty state.
2. An overdue amount greater than zero: Task 1 checks that the amount and overdue label remain readable with color and text.
3. A narrow mobile viewport: Task 2 checks that cards and action links fit without horizontal overflow.
4. Keyboard navigation: Task 2 checks each quick link has visible text and can receive focus.
5. A manager account: Task 2 checks it sees the same authorized dashboard without showing a forbidden route.

## File map

- `src/components/dashboard/stat-card.tsx`: typed stat label, value, icon, and tone.
- `src/components/dashboard/quick-actions.tsx`: links to `/tenants/new`, `/properties`, and `/payments`.
- `src/app/dashboard/page.tsx`: compose the existing data into visual cards, progress, and next due.
- `tests/e2e/dashboard-actions.spec.ts`: route, keyboard, and responsive behavior.

---

### Task 1: Visual metric cards and meaningful empty states

**Files:** Create `src/components/dashboard/stat-card.tsx`; modify `src/app/dashboard/page.tsx`; create `tests/e2e/dashboard-actions.spec.ts`.

**Interfaces:** `StatCard({label,value,icon: Icon,tone}: {label:string;value:string;icon:LucideIcon;tone:"neutral"|"success"|"warning"|"danger"})`; no data fetching inside the component.

- [ ] **Step 1: Add a browser check after demo-owner sign-in.** Assert four metrics still expose their French labels and formatted amounts, a visible recouvrement percentage, and either a next due or “Aucune échéance ouverte”. Use the existing rehearsal demo credentials without copying them into the test file.

```ts
await expect(page.getByRole("heading",{name:"Taux de recouvrement"})).toBeVisible();
await expect(page.getByText("Attendu",{exact:true})).toBeVisible();
await expect(page.getByText("En retard",{exact:true})).toBeVisible();
await expect(page.getByRole("progressbar",{name:"Taux de recouvrement"})).toBeVisible();
```

- [ ] **Step 2: Run `npx playwright test tests/e2e/dashboard-actions.spec.ts`; confirm the new semantic heading or card expectation fails before changing the page.**
- [ ] **Step 3: Implement `StatCard` with Lucide icon component, label, amount, and toned icon background. In `dashboard/page.tsx`, map the four existing statistics to icons and tones; keep the existing currency formatter and clamp the progress width to 0–100 while exposing `aria-valuenow`. Render a clear next-due empty state when `nextDue` is null.**

```tsx
<StatCard label="Encaissé" value={money(stats.paid)} icon={CircleCheck} tone="success" />
<div role="progressbar" aria-label="Taux de recouvrement" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,Math.max(0,rate))}>
  <div style={{width:`${Math.min(100,Math.max(0,rate))}%`}} />
</div>
```
- [ ] **Step 4: Run the focused browser test and `npm run typecheck`.**
- [ ] **Step 5: Commit:** `git add src/components/dashboard/stat-card.tsx src/app/dashboard/page.tsx tests/e2e/dashboard-actions.spec.ts && git commit -m "feat: make dashboard metrics scannable"`.

### Task 2: Quick links to working destinations

**Files:** Create `src/components/dashboard/quick-actions.tsx`; modify `src/app/dashboard/page.tsx`, `tests/e2e/dashboard-actions.spec.ts`.

**Interfaces:** `QuickActions()` returns three labeled `Link` elements: `Ajouter un locataire` → `/tenants/new`, `Voir mes biens` → `/properties`, `Voir les paiements` → `/payments`.

- [ ] **Step 1: Add browser checks for the three links, keyboard focus, and no horizontal overflow at 375px viewport. Check that the manager demo identity can open the dashboard and see the same allowed destinations.**

```ts
await expect(page.getByRole("link",{name:"Ajouter un locataire"})).toHaveAttribute("href","/tenants/new");
await expect(page.getByRole("link",{name:"Voir mes biens"})).toHaveAttribute("href","/properties");
await expect(page.getByRole("link",{name:"Voir les paiements"})).toHaveAttribute("href","/payments");
```

- [ ] **Step 2: Run the focused browser test; confirm missing quick links make it fail.**
- [ ] **Step 3: Add `QuickActions` with icon, text, and visible focus ring. Place it near the dashboard greeting, then adjust responsive gaps and wrapping so the cards and links fit at 375px and desktop. Keep the floating `+` behavior outside this plan.**

```tsx
<Link href="/tenants/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
  <UserPlus aria-hidden="true" className="h-4 w-4" />Ajouter un locataire
</Link>
```
- [ ] **Step 4: Run the focused browser test at both widths, `npm run typecheck`, and `npm run build`; inspect the screenshot for clipped text or overflow.**
- [ ] **Step 5: Commit:** `git add src/components/dashboard/quick-actions.tsx src/app/dashboard/page.tsx tests/e2e/dashboard-actions.spec.ts && git commit -m "feat: add dashboard quick links"`.
