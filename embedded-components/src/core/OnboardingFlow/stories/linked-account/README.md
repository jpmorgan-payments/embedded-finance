# OnboardingFlow — Linked account stories

Storybook: **Core → OnboardingFlow → Linked account**

## Two UI surfaces in the product (not Storybook-only)

| Surface                     | File                                              | Role                                                                                                                          |
| --------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Overview — bank section** | `screens/OverviewScreen/OverviewScreen.tsx`       | Shows linked account **or** “Start” to open the link step. **Verify Account** when `READY_FOR_VALIDATION`.                    |
| **Link bank account step**  | `screens/LinkAccountScreen/LinkAccountScreen.tsx` | Create flow (`editable` / `prefillSummary`) or **existing account** view (same verify + card as Overview + back to Overview). |

Both use **`RecipientAccountDisplayCard`**, **`StatusAlert`**, **`MicrodepositsFormDialogTrigger`**, and **`linked-accounts`** i18n — aligned with **LinkedAccountWidget**, which is the standalone management experience.

## Story files

- **`OnboardingFlow.LinkedAccount.States.story.tsx`** — Client States: lifecycle seeds, prefill variants, existing **ACTIVE** account.
- **`OnboardingFlow.LinkedAccount.Interactive.story.tsx`** — Play functions: full link + MSW state machine, prefill summary, **microdeposit verification from Overview** (story 3; slow pacing constants at top of play).

Shared MSW helpers: **`../story-utils.tsx`** (`buildApprovedClientLinkAccountStory`, `createOnboardingFlowHandlers`, linked-account mocks).

## Docs

OnboardingFlow overview (Storybook MDX): **`../Docs.mdx`** — full **Storybook decomposition** taxonomy plus _Linked account (Storybook)_.
