# Coverage Improvement Plan

**Goal**: Reach 80%+ line coverage

**Baseline** (June 15, 2026 full local run):

- 104 test files, 950 tests passing
- 68.52% stmts | 60.18% branch | 63.73% funcs | 69.36% lines

**Current** (June 16, 2026):

- 117 test files, 1182 tests passing
- 71.12% stmts | 62.95% branch | 66.41% funcs | 71.91% lines

**Target**: 80% lines → need ~950 more lines covered

---

## Next Priority Targets (by ROI)

### Tier 1: Near-80% files (push over the threshold)

| File | Current | Uncov Lines | Effort |
| ---- | ------- | ----------- | ------ |
| `StepperRenderer.tsx` | 69% | 69 | Medium — mock contexts, test static/check-answers steps |
| `OperationalDetailsForm.tsx` | 65% | 73 | Medium-High — MSW for questions API + context mocks |
| `TermsAndConditionsForm.tsx` | 64% | 73 | Medium — extend existing test with disclosure/document paths |
| `IndustryForm.tsx` | 67% | 10 | Low — test tooltip hide logic |
| `FlowView.tsx` | 67% | 2 | Trivial — one branch |

### Tier 2: High-line-count files (significant coverage boost)

| File | Current | Uncov Lines | Effort |
| ---- | ------- | ----------- | ------ |
| `BaseRecipientsWidget.tsx` | 30% | ~193 | High — MSW integration test |
| `IndirectOwnership.tsx` | 42% | ~151 | High — dialog interaction flows |
| `StandardFormField.tsx` | 44% | ~44 | Medium — FormProvider + each field type |
| `PaymentFlow.tsx` | 56% | ~337 | **Deferred** to deep refactoring |

### Tier 3: Partially-covered utilities (quick pure-function tests)

| File | Current | Uncov Lines | Effort |
| ---- | ------- | ----------- | ------ |
| `hooks.ts` (IndirectOwnership) | 58% | 19 | Low — test remaining hook branches |
| `Pagination.tsx` | 64% | 14 | Low — test page-change callbacks |
| `OnboardingTimeline.tsx` | 85% | 24 | Low — test collapsed/expanded states |

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
| `src/core/IndirectOwnership/utils/utils.ts`                    | 66              | [x]    |
| `src/core/IndirectOwnership/utils/hierarchyIntegrityFixed.ts`  | 47              | [x]    |
| `src/core/IndirectOwnership/utils/hierarchyIntegrityNew.ts`    | 47              | [x]    |
| `src/core/IndirectOwnership/hooks/hooks.ts`                    | 45              | [x]    |
| `src/core/IndirectOwnership/hooks/useExistingEntitiesNew.ts`   | 23              | [x]    |
| `src/lib/utils.ts`                                             | 71              | [x]    |
| `src/lib/recipientHelpers.ts`                                  | 18              | [x]    |
| `src/lib/utils/userTracking.ts`                                | 33              | [x]    |
| `src/i18n/config.ts`                                           | 20              | [x]    |
| `src/i18n/useTranslationWithTokens.tsx`                        | 25              | [x]    |
| `src/core/TransactionsDisplay/utils/modifyTransactionsData.ts` | 10              | [x]    |
| `src/core/ClientDetails/utils/formatClientFacing.ts`           | 16              | [x]    |
| `src/core/OnboardingFlow/utils/dataUtils.ts`                   | 23              | [x]    |
| `src/components/ServerErrorAlert/ServerErrorAlert.tsx`          | 26              | [x]    |

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
| `i18n/config.ts`                 | 33%    | ~80%  | 2026-06-16 |
| `useTranslationWithTokens.tsx`   | 34%    | ~70%  | 2026-06-16 |
| `ServerErrorAlert.tsx`           | 58%    | ~85%  | 2026-06-16 |
| `lib/utils.ts`                   | 30%    | ~50%  | 2026-06-16 |
| `userTracking.ts`                | 40%    | ~75%  | 2026-06-16 |
| `dataUtils.ts`                   | 66%    | ~95%  | 2026-06-16 |
| `formUtils.ts`                   | 78%    | ~85%  | 2026-06-16 |
| `partyFieldMap (transforms)`     | 10%    | ~60%  | 2026-06-16 |
| `TransactionsTable.columns.tsx`  | 66%    | ~80%  | 2026-06-16 |
| `IndirectOwnership.tsx`          | 50%    | ~65%  | 2026-06-16 |
| `TermsAndConditionsForm.tsx`     | 59%    | ~70%  | 2026-06-16 |

---

## Projected Coverage by Phase

| Phase   | Lines Covered | Cumulative |
| ------- | ------------- | ---------- |
| Current | —             | **66.93%** |
| Phase 2 | +420          | ~70.4%     |
| Phase 3 | +600          | ~75.4%     |
| Phase 4 | +350          | ~78.3%     |
| Phase 5 | +475          | ~82.2%     |
