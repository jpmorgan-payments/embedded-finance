# Plan 001: Make all toast notifications render via sonner and delete the dead legacy toast stack

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1663e9a3..HEAD -- embedded-components/src/components/ui/toast.tsx embedded-components/src/components/ui/toaster.tsx embedded-components/src/components/ui/use-toast.tsx embedded-components/src/core/OnboardingWizardBasic/ClientOnboardingStateView/ embedded-components/package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug + tech-debt
- **Planned at**: commit `1663e9a3`, 2026-06-10

## Why this matters

The library contains two toast systems. The active one is **sonner**: `EBComponentsProvider` mounts sonner's `<Toaster>`, and all product code (OnboardingWizardBasic step forms, OnboardingFlow formUtils — 10 files) calls `toast.success(...)` etc. from `'sonner'`. The legacy shadcn/Radix stack (`toast.tsx`, `toaster.tsx`, `use-toast.tsx`, dependency `@radix-ui/react-toast`) is still shipped, and one file still calls it: `NotificationService.ts`. Because the legacy `<Toaster>` is mounted **nowhere**, every `toast(...)` call from `NotificationService` dispatches into an in-memory store with no renderer — **those notifications are silently never shown to the user**. This plan migrates `NotificationService` to sonner and deletes the dead stack, fixing the lost notifications and removing dead code plus an unused runtime dependency from a published npm package.

## Current state

- `embedded-components/src/core/EBComponentsProvider/EBComponentsProvider.tsx` — mounts the **sonner** Toaster only:
  - line 19: `import { Toaster } from '@/components/ui/sonner';`
  - line 270: `<Toaster closeButton expand position="bottom-left" />`
- `embedded-components/src/core/OnboardingWizardBasic/ClientOnboardingStateView/NotificationService.ts` — the only product code importing the legacy hook:

  ```ts
  // NotificationService.ts:3
  import { toast } from '@/components/ui/use-toast';
  ```

  It calls `toast` in three places:

  ```ts
  // NotificationService.ts:26-29 (inside requestPermission)
  toast({
    title: i18next.t('clientOnboardingStatus.notification.toast.title'),
    variant: 'default',
  });

  // NotificationService.ts:55-59 (inside showNotification, when tab is visible)
  toast({
    title,
    description: options?.body,
    duration: 5000,
  });

  // NotificationService.ts:64-68 (catch-block fallback — identical shape)
  toast({
    title,
    description: options?.body,
    duration: 5000,
  });
  ```

- Legacy stack files (all under `embedded-components/src/components/ui/`):
  - `toast.tsx` — Radix primitives wrapper; the **only** file in `src/` importing `@radix-ui/react-toast` (line 5).
  - `toaster.tsx` — renders legacy toasts; imports from `./toast` and `./use-toast`; mounted nowhere.
  - `use-toast.tsx` — the in-memory store + `toast()` function.
  - `toast.test.tsx`, `toaster.test.tsx` — tests for the dead stack.
  - The internal barrel `embedded-components/src/components/ui/index.ts` does **not** export any of these. The public API `embedded-components/src/index.tsx` does not export them either.
- `embedded-components/package.json:115` — `"@radix-ui/react-toast": "^1.2.15",` (becomes unused after deletion).
- Sonner call-style exemplar (the convention to match), `embedded-components/src/core/OnboardingWizardBasic/OrganizationStepForm/OrganizationStepForm.tsx:204`: `toast.success(...)` with `import { toast } from 'sonner'`. Sonner's API: `toast(title)`, `toast(title, { description, duration })`, `toast.success(title)`.

Repo conventions: TypeScript strict, prettier with import sorting (`yarn format`), conventional-commit style messages (see `git log`: `fix(dropzone): convert dropzone component to use forwardRef ...`). The repo's documented quality workflow for `embedded-components` is `yarn format`, `yarn build`, then `yarn test` (see root `AGENTS.md`, "code-quality-workflow").

## Commands you will need

All run from `C:\dev\code\embedded-finance\embedded-components` (PowerShell: chain with `;`, never `&&`).

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Install   | `yarn install`     | exit 0              |
| Typecheck | `yarn typecheck`   | exit 0, no errors   |
| Lint      | `yarn lint`        | exit 0              |
| Format    | `yarn format`      | exit 0 (writes)     |
| Unit tests| `yarn test:unit`   | all pass            |
| Build     | `yarn build`       | exit 0              |

## Scope

**In scope** (the only files you should modify/delete):
- `embedded-components/src/core/OnboardingWizardBasic/ClientOnboardingStateView/NotificationService.ts` (modify)
- `embedded-components/src/components/ui/toast.tsx` (delete)
- `embedded-components/src/components/ui/toaster.tsx` (delete)
- `embedded-components/src/components/ui/use-toast.tsx` (delete)
- `embedded-components/src/components/ui/toast.test.tsx` (delete)
- `embedded-components/src/components/ui/toaster.test.tsx` (delete)
- `embedded-components/package.json` (remove one dependency)
- `embedded-components/src/core/OnboardingWizardBasic/ClientOnboardingStateView/NotificationService.test.ts` (create)
- `yarn.lock` (regenerated by `yarn install`)

**Out of scope** (do NOT touch, even though they look related):
- `embedded-components/src/components/ui/sonner.tsx` — it has its own styling bug, fixed by plan 002. Do not edit it here.
- `embedded-components/src/core/EBComponentsProvider/EBComponentsProvider.tsx` — already correct.
- All other files importing `toast` from `'sonner'` — already correct.
- `app/client-next-ts/**` — the showcase app is out of scope for this plan set.

## Git workflow

- Branch: `advisor/001-consolidate-toast-to-sonner`
- Commit style: conventional, e.g. `fix(toast): route NotificationService through sonner and remove legacy toast stack`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Migrate NotificationService to sonner

In `NotificationService.ts`:
1. Replace line 3 `import { toast } from '@/components/ui/use-toast';` with `import { toast } from 'sonner';`.
2. Replace the three call sites:
   - `requestPermission` (lines 26-29): `toast(i18next.t('clientOnboardingStatus.notification.toast.title'));` (sonner has no `variant: 'default'`; plain `toast()` is the default style).
   - `showNotification` visible-tab branch (lines 55-59) and catch fallback (lines 64-68): `toast(title, { description: options?.body, duration: 5000 });`

**Verify**: `yarn typecheck` → exit 0.

### Step 2: Delete the legacy stack

Delete these five files from `embedded-components/src/components/ui/`:
`toast.tsx`, `toaster.tsx`, `use-toast.tsx`, `toast.test.tsx`, `toaster.test.tsx`.

**Verify** (PowerShell, from repo root):
`Get-ChildItem embedded-components\src -Recurse | Select-String -Pattern "ui/use-toast|ui/toaster|components/ui/toast'" -List` → no output.
Then `yarn typecheck` in `embedded-components` → exit 0. If typecheck reports any other file importing the deleted modules, STOP (see STOP conditions).

### Step 3: Remove the unused dependency

Remove `"@radix-ui/react-toast": "^1.2.15",` from `embedded-components/package.json` dependencies (line 115 at planning time). Run `yarn install`.

**Verify**: `Select-String -Path embedded-components\src\**\*.tsx -Pattern "@radix-ui/react-toast"` → no matches; `yarn install` → exit 0.

### Step 4: Add a regression test for NotificationService

Create `NotificationService.test.ts` next to `NotificationService.ts` (see Test plan).

**Verify**: `yarn test:unit src/core/OnboardingWizardBasic/ClientOnboardingStateView` → all pass.

### Step 5: Full quality gate

Run `yarn format`, then `yarn build`, then `yarn test` (the repo's mandated sequence).

**Verify**: all three exit 0.

## Test plan

Create `NotificationService.test.ts` (Vitest; model the mocking style on existing unit tests such as `embedded-components/src/components/ui/dropzone.test.tsx` — `vi.mock` at module level, `describe/it/expect`):

- `vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn() }) }))`.
- Mock `i18next` `t` to return a known string.
- Case 1 (regression for the silent-toast bug): with `Notification.permission === 'granted'` stubbed, `requestPermission()` calls sonner `toast` once with the i18n title.
- Case 2: `showNotification(title, { body })` with `document.visibilityState === 'visible'` (jsdom default) calls `toast(title, { description: body, duration: 5000 })`.
- Case 3: when `Notification` API throws / is unavailable, the catch fallback still calls `toast`.
- Note: jsdom has no `Notification` global — define one on `window` in the test (`Object.defineProperty(window, 'Notification', ...)`) and restore it after.

Verification: `yarn test:unit src/core/OnboardingWizardBasic/ClientOnboardingStateView` → all pass, ≥3 new tests.

## Done criteria

ALL must hold (run in `embedded-components/`):

- [ ] `yarn typecheck` exits 0
- [ ] `yarn lint` exits 0
- [ ] `yarn test:unit` exits 0; new `NotificationService.test.ts` exists and passes
- [ ] `yarn build` exits 0
- [ ] `Select-String -Path src -Pattern "use-toast" -Recurse 2>$null` (or `grep -rn "use-toast" src/`) → no matches
- [ ] `grep -rn "@radix-ui/react-toast" src/ package.json` → no matches
- [ ] Files `src/components/ui/toast.tsx`, `toaster.tsx`, `use-toast.tsx` and their tests no longer exist
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any file other than `NotificationService.ts`, `toaster.tsx`, and `use-toast.tsx` imports from `@/components/ui/use-toast` or `@/components/ui/toast` (the audit found none at `1663e9a3`, but drift is possible).
- `embedded-components/src/index.tsx` or `src/components/ui/index.ts` exports anything from the deleted files (they did not at planning time).
- Storybook stories reference the legacy `<Toaster>` (check `*.story.tsx` / `*.stories.tsx` before deleting; none did at planning time).
- `yarn build` fails after the dependency removal for a reason related to Radix toast types.

## Maintenance notes

- After this lands, `'sonner'` is the **only** toast API in the library. New notification code must import `{ toast } from 'sonner'`; review should reject any re-introduction of `useToast`.
- Plan 002 edits `sonner.tsx` (theme classes are currently broken there) — these two plans touch adjacent code but no shared lines; execute 001 first to keep 002's grep-based done criteria clean (the malformed `sm:eb-eb-bottom-0` in `toast.tsx:19` disappears with the file).
- Deferred deliberately: visual styling of sonner toasts (plan 002); browser `Notification` permission UX in `ClientOnboardingStateView` is untouched.
