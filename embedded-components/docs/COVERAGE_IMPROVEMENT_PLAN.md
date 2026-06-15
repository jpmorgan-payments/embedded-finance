# Coverage Improvement Plan

**Goal**: Reach 80%+ line coverage (currently at **66.93%**)

**Baseline** (June 11, 2026 full local run):

- 94 test files, 794 tests passing
- 66% stmts | 58.46% branch | 61.05% funcs | 66.93% lines

**Target**: 80% lines → need ~1,600 more lines covered

---

## Phase 1: Sonar Exclusion Alignment ✅

The vitest config already excludes `**/stories/**`, `**/fixtures/**`, and `**/api/generated/**` from coverage.
SonarQube `sonar.coverage.exclusions` should be updated to match:

```properties
sonar.coverage.exclusions=**/index.ts,**/mock/**,**/mocks/**,**/msw/**,**/*.types.ts,**/types/**,**/stories/**,**/fixtures/**,**/api/generated/**
```

**Impact**: Aligns Sonar reporting to local numbers (no code change needed).

**Status**: [ ] TODO

---

## Phase 2: Pure Logic Unit Tests (~420 lines, +3-4%)

Files with 0% or low coverage that are **pure functions or simple hooks** — no complex rendering needed.

| File                                                           | Uncovered Lines | Status |
| -------------------------------------------------------------- | --------------- | ------ |
| `src/core/IndirectOwnership/utils/utils.ts`                    | 66              | [ ]    |
| `src/core/IndirectOwnership/utils/hierarchyIntegrityFixed.ts`  | 47              | [ ]    |
| `src/core/IndirectOwnership/utils/hierarchyIntegrityNew.ts`    | 47              | [ ]    |
| `src/core/IndirectOwnership/hooks/hooks.ts`                    | 45              | [ ]    |
| `src/core/IndirectOwnership/hooks/useExistingEntitiesNew.ts`   | 23              | [ ]    |
| `src/lib/utils.ts`                                             | 71              | [ ]    |
| `src/lib/recipientHelpers.ts`                                  | 18              | [ ]    |
| `src/lib/utils/userTracking.ts`                                | 33              | [ ]    |
| `src/i18n/config.ts`                                           | 20              | [ ]    |
| `src/i18n/useTranslationWithTokens.tsx`                        | 25              | [ ]    |
| `src/core/TransactionsDisplay/utils/modifyTransactionsData.ts` | 10              | [ ]    |
| `src/core/ClientDetails/utils/formatClientFacing.ts`           | 16              | [ ]    |

---

## Phase 3: Boost Partially-Covered Files (~600 lines, +4-5%)

Files already at 50-79% that need a few more test cases to hit 80%+.

| File                                | Current Coverage | Uncovered Lines | Status |
| ----------------------------------- | ---------------- | --------------- | ------ |
| `OnboardingFlow/utils/formUtils.ts` | 79.6%            | 64              | [ ]    |
| `OnboardingFlow/OnboardingFlow.tsx` | 76.3%            | 42              | [ ]    |
| `StepperRenderer.tsx`               | 72%              | 68              | [ ]    |
| `OnboardingFlow/config/fieldMap.ts` | 68.5%            | 41              | [ ]    |
| `TransactionsTable.columns.tsx`     | 66.4%            | 41              | [ ]    |
| `OperationalDetailsForm.tsx`        | 63.9%            | 73              | [ ]    |
| `BankAccountForm.tsx`               | 60%              | 161             | [ ]    |
| `TermsAndConditionsForm.tsx`        | 59.4%            | 73              | [ ]    |
| `BankAccountForm.schema.ts`         | 59%              | 41              | [ ]    |

---

## Phase 4: Refactor for Testability (~350 lines, +3%)

Components that are hard to test due to monolithic structure.

| File                       | Uncovered | Refactor Needed                      |
| -------------------------- | --------- | ------------------------------------ |
| `BaseRecipientsWidget.tsx` | 193       | Extract `useRecipientListLogic` hook |
| `IndirectOwnership.tsx`    | 151       | Extract `useOwnershipState` hook     |
| `HierarchyBuilder.tsx`     | 54        | Extract builder logic to hook        |
| `AddOwnerDialog.tsx`       | 65        | Extract form logic to hook           |
| `PeopleDetailsContent.tsx` | 59        | Integration test via parent          |

---

## Phase 5: PaymentFlow Deep Coverage (~475 lines, +4%)

`PaymentFlow.tsx` is at 42% locally. Strategy:

1. Create integration test with `retry: false` QueryClient
2. Test full user journey (select account → payee → method → amount → submit → success)
3. Exercises `MainTransferView`, `StepSection`, `SuccessView`

---

## Completed Work

| File                             | Before | After | Date       |
| -------------------------------- | ------ | ----- | ---------- |
| `stepper.tsx`                    | 0%     | 92%   | 2026-06-11 |
| `FlowContext.tsx`                | 4.3%   | 95%   | 2026-06-11 |
| `FlowContainer/`                 | 0%     | 92%   | 2026-06-11 |
| `ReviewPanel.tsx`                | 0%     | 90%   | 2026-06-11 |
| `PayeeSelector/`                 | 0%     | 68%   | 2026-06-11 |
| `PaymentFlow.tsx`                | 0%     | 42%   | 2026-06-11 |
| `BankAccountFormWrapper.tsx`     | 0%     | ~60%  | 2026-06-11 |
| `EnablePaymentMethodWrapper.tsx` | 0%     | ~50%  | 2026-06-11 |

---

## Projected Coverage by Phase

| Phase   | Lines Covered | Cumulative |
| ------- | ------------- | ---------- |
| Current | —             | **66.93%** |
| Phase 2 | +420          | ~70.4%     |
| Phase 3 | +600          | ~75.4%     |
| Phase 4 | +350          | ~78.3%     |
| Phase 5 | +475          | ~82.2%     |
