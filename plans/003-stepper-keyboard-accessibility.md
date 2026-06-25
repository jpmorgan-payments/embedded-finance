# Plan 003: Make clickable Stepper steps keyboard-accessible

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1663e9a3..HEAD -- embedded-components/src/components/ui/stepper.tsx`
> If the file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/002-fix-unprefixed-tailwind-classes.md (soft — both edit `stepper.tsx`; execute 002 first to avoid merge friction)
- **Category**: bug (accessibility, WCAG 2.1 Level A)
- **Planned at**: commit `1663e9a3`, 2026-06-10

## Why this matters

The Stepper drives the published onboarding flow (`OnboardingWizardBasic` imports `Step`, `Stepper`, `useStepper` — see `src/core/OnboardingWizardBasic/OnboardingWizardBasic.tsx:14`). When a stepper is configured as clickable (`onClickStep` provided), step navigation works **only with a mouse**: the click targets are plain `<div>`s with `onClick`, no `tabIndex`, no key handler, and no button role. The two `eslint-disable` comments in the file acknowledge exactly this. Keyboard-only and assistive-technology users cannot jump between steps — a WCAG 2.1 Level A (2.1.1 Keyboard) failure in a financial-onboarding component published to npm.

## Current state

File: `embedded-components/src/components/ui/stepper.tsx` (~1030 lines). Component API exported at the bottom: `Stepper`, `Step`, `useStepper`, plus types `StepProps`, `StepItem`, `StepperProps`. Steps come in two render branches:

**Vertical step** (lines 573-594):

```tsx
return (
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  <div
    ref={ref}
    className={cn(
      'stepper__vertical-step',
      verticalStepVariants({ ... }),
      isLastStepCurrentStep && 'eb-gap-[var(--step-gap)]',
      styles?.['vertical-step']
    )}
    data-optional={steps[index || 0]?.optional}
    data-completed={isCompletedStep}
    data-active={active}
    data-clickable={clickable || !!onClickStep}
    data-invalid={localIsError}
    onClick={() =>
      onClickStep?.(index || 0, setStep) ||
      onClickStepGeneral?.(index || 0, setStep)
    }
  >
```

**Horizontal step** (lines 686-712):

```tsx
return (
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  <div
    aria-disabled={!hasVisited}
    className={cn(
      'stepper__horizontal-step',
      'eb-relative eb-flex eb-items-center eb-transition-all eb-duration-200',
      ...
    )}
    data-optional={steps[index || 0]?.optional}
    data-completed={isCompletedStep}
    data-active={active}
    data-invalid={localIsError}
    data-clickable={clickable}
    onClick={() => onClickStep?.(index || 0, setStep)}
    ref={ref}
  >
```

Context: `clickable`, `onClickStep`, `setStep` come from `useStepper()`/`StepperContext` (defined at the top of the file, lines 13-39). Inside each step there is already a `StepButtonContainer` rendering a `<Button>` for the step icon — but the **outer div** is the element that owns `onClick`, so the inner button does not make navigation keyboard-reachable (verify this while implementing: if `StepButtonContainer`'s Button already fires the same `onClickStep` when focused and Enter is pressed, document that and adjust the approach to *delegating* to it rather than duplicating handlers — see STOP conditions).

Conventions: this file uses `React.forwardRef`, CVA variants, `cn()` from `@/lib/utils`, Tailwind classes with mandatory `eb-` prefix. ESLint runs `jsx-a11y` (the disables prove it's active). Tests: Vitest + Testing Library; a good structural exemplar with `userEvent` interactions is `embedded-components/src/components/ui/dropzone.test.tsx`.

## Commands you will need

All run from `C:\dev\code\embedded-finance\embedded-components` (PowerShell: chain with `;`, never `&&`).

| Purpose   | Command                                          | Expected on success |
|-----------|--------------------------------------------------|---------------------|
| Install   | `yarn install`                                   | exit 0              |
| Typecheck | `yarn typecheck`                                 | exit 0              |
| Lint      | `yarn lint`                                      | exit 0              |
| Unit test | `yarn test:unit src/components/ui/stepper`       | all pass            |
| Build     | `yarn build`                                     | exit 0              |

## Scope

**In scope**:
- `embedded-components/src/components/ui/stepper.tsx` — only the two step-wrapper JSX blocks quoted above (plus a small shared helper inside the same file if useful).
- `embedded-components/src/components/ui/stepper.test.tsx` (create).

**Out of scope** (do NOT touch):
- Any class-string cleanup beyond what this change forces — plan 002 owns that.
- `StepButtonContainer` / `StepIcon` internals, the Collapsible logic, `useMediaQuery` — unrelated.
- `src/core/OnboardingWizardBasic/**` and `src/core/OnboardingFlow/**` — consumers; their behavior must not change except steps becoming focusable when clickable.
- Public exported types (`StepProps`, `StepperProps`, `StepItem`) — no signature changes.

## Git workflow

- Branch: `advisor/003-stepper-keyboard-a11y`
- Commit style: `fix(stepper): make clickable steps keyboard-accessible`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add keyboard semantics to the vertical step (lines 573-594)

Compute interactivity exactly as the existing `data-clickable` does: `const isInteractive = clickable || !!onClickStep;` (for the vertical branch; note it also calls `onClickStepGeneral`). Extract the existing onClick body into a local `handleStepNavigation` function. Then on the div:

- `role={isInteractive ? 'button' : undefined}`
- `tabIndex={isInteractive ? 0 : undefined}`
- `onKeyDown`: when `isInteractive` and key is `Enter` or `' '` → `event.preventDefault()` (Space must not scroll) and call `handleStepNavigation()`
- Keep `onClick={handleStepNavigation}` (guard it with `isInteractive` if currently unconditional — preserve today's effective behavior: the optional-chaining already no-ops when handlers are absent)
- Remove the `eslint-disable-next-line jsx-a11y/...` comment above the div — the point is that the rule now passes legitimately.
- Add a visible focus style consistent with the library's pattern (match `input.tsx`'s tokens): `focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-2` appended to the `cn(...)` call, applied only when interactive (conditional class).

**Verify**: `yarn typecheck` → exit 0; `yarn lint` → no `jsx-a11y` errors for stepper.tsx.

### Step 2: Same treatment for the horizontal step (lines 686-712)

`const isInteractive = clickable && !!onClickStep;` — mirror the *existing* horizontal semantics (its `data-clickable={clickable}` and `onClick` only calls `onClickStep`); do not "upgrade" it to the vertical branch's logic. Apply the same role/tabIndex/onKeyDown/focus-ring pattern and remove the second eslint-disable comment. Note the existing `aria-disabled={!hasVisited}` — when `!hasVisited`, also skip Enter/Space handling so keyboard behavior matches the disabled signal.

**Verify**: `yarn typecheck` ; `yarn lint` → exit 0; `grep -n "eslint-disable.*jsx-a11y" src/components/ui/stepper.tsx` → no matches.

### Step 3: Write the tests

Create `src/components/ui/stepper.test.tsx` (see Test plan).

**Verify**: `yarn test:unit src/components/ui/stepper` → all pass.

### Step 4: Full quality gate

`yarn format` ; `yarn build` ; `yarn test`.

**Verify**: all exit 0.

## Test plan

`src/components/ui/stepper.test.tsx`, Vitest + Testing Library + `@testing-library/user-event` (model setup/structure on `dropzone.test.tsx`). Build a minimal harness:

```tsx
const steps = [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }];
render(
  <Stepper initialStep={0} steps={steps} onClickStep={onClickStep} orientation="horizontal">
    {steps.map((s) => (<Step key={s.label} {...s} />))}
  </Stepper>
);
```

(Confirm exact prop names against the `StepperProps` type at the top of `stepper.tsx` before writing — e.g. orientation may be a `isVertical`/`orientation` prop; match the real API, this excerpt is a sketch.)

Cases:
1. **Keyboard activation (the fix)**: tab until a step wrapper has focus, press `Enter` → `onClickStep` called with the step index; same for `Space`.
2. **Mouse still works**: `userEvent.click` on a step → `onClickStep` called (characterization of pre-existing behavior).
3. **Non-clickable stepper**: render without `onClickStep`/`clickable` → step wrappers have no `role="button"` and no `tabIndex` (query by `data-clickable` or label text).
4. **Vertical branch**: repeat case 1 with vertical orientation so both code paths are covered.
5. **aria-disabled**: a horizontal step with `aria-disabled="true"` does not fire `onClickStep` on Enter.

Verification: `yarn test:unit src/components/ui/stepper` → ≥5 tests pass.

## Done criteria

ALL must hold (run in `embedded-components/`):

- [ ] `grep -n "eslint-disable.*jsx-a11y" src/components/ui/stepper.tsx` → no matches
- [ ] `yarn lint` exits 0 (jsx-a11y satisfied without suppressions)
- [ ] `yarn typecheck` exits 0
- [ ] `yarn test:unit` exits 0; `stepper.test.tsx` exists with the 5 cases above
- [ ] `yarn build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The two JSX blocks don't match the excerpts (drift).
- While implementing you find the inner `StepButtonContainer` `<Button>` **already** wires `onClickStep` on its own click — then the right design is delegation (make the inner button the single interactive element and drop the outer div's handler), which changes DOM/event order for consumers; report the finding and the proposed alternative instead of shipping either unilaterally.
- Adding `role="button"`/`tabIndex` to the wrapper causes nested-interactive a11y errors (button inside button) from `jsx-a11y` — same situation as above; report.
- Existing OnboardingWizardBasic tests fail after the change (`yarn test:unit src/core/OnboardingWizardBasic`) — the focus/role change leaked into consumer behavior; report which test and how.

## Maintenance notes

- This makes step wrappers focusable when clickable; any future redesign of `StepButtonContainer` should consolidate to a single interactive element (the deferred "delegation" design) — tracked as a known follow-up, not done here to keep DOM changes minimal.
- Reviewers should manually tab through the Storybook onboarding story once (`yarn storybook`) and confirm focus rings are visible in both orientations.
- Plans 002 and 003 both touch `stepper.tsx` — execute in numeric order; if 002 was skipped, the class tokens `e-w-full`/`w-full` near your edits are NOT yours to fix here.
